/*
 * Product page - "Figma" style (snippets/product-page-figma.liquid)
 * - gallery: thumbnails, arrows, counter, jump to the variant image
 * - option cards -> variant (Sample is not an option card; it has its own button)
 * - price / per sq ft / coverage / stock / button labels follow the variant + quantity
 * - Shop Pay installments form gets the variant id
 * - delivery estimate: today + N business days
 * Add to cart itself is the theme's <product-form> (product-form.js).
 */
if (!customElements.get('pdp-figma')) {
  customElements.define(
    'pdp-figma',
    class PdpFigma extends HTMLElement {
      connectedCallback() {
        this.variants = this.readJson('[data-pdp-variants]') || [];
        this.strings = this.readJson('[data-pdp-strings]') || {};
        this.sampleIndex = parseInt(this.dataset.sampleIndex, 10);
        this.installIndex = parseInt(this.dataset.installIndex, 10);
        this.unit = this.dataset.unit || 'box';
        this.unitPlural = this.dataset.unitPlural || 'boxes';

        this.slides = Array.from(this.querySelectorAll('[data-pdp-slide]'));
        this.thumbs = Array.from(this.querySelectorAll('[data-pdp-thumb]'));
        this.qtyInput = this.querySelector('[data-pdp-qty-input]');
        this.slideIndex = 0;

        const idInput = this.querySelector('[data-pdp-variant-id]');
        this.variant = this.variants.find((v) => String(v.id) === idInput?.value) || this.variants[0];

        this.bindGallery();
        this.bindOptions();
        this.bindQuantity();
        this.bindCalculator();
        this.renderDelivery();
        this.update(false);
      }

      readJson(selector) {
        const el = this.querySelector(selector);
        if (!el) return null;
        try {
          return JSON.parse(el.textContent);
        } catch (e) {
          return null;
        }
      }

      money(cents) {
        return typeof formatMoney === 'function' ? formatMoney(cents) : `$${(cents / 100).toFixed(2)}`;
      }

      isSampleValue(value) {
        return String(value || '').trim().toLowerCase() === 'sample';
      }

      /* ---------- gallery */
      bindGallery() {
        this.thumbs.forEach((thumb) =>
          thumb.addEventListener('click', () => this.showSlide(parseInt(thumb.dataset.pdpThumb, 10)))
        );
        this.querySelector('[data-pdp-prev]')?.addEventListener('click', () => this.showSlide(this.slideIndex - 1));
        this.querySelector('[data-pdp-next]')?.addEventListener('click', () => this.showSlide(this.slideIndex + 1));
      }

      showSlide(index) {
        if (!this.slides.length) return;
        const count = this.slides.length;
        this.slideIndex = ((index % count) + count) % count;
        this.slides.forEach((slide, i) => {
          slide.hidden = i !== this.slideIndex;
          if (i === this.slideIndex) {
            const img = slide.querySelector('img[loading="lazy"]');
            if (img) img.loading = 'eager';
          }
        });
        this.thumbs.forEach((thumb, i) => {
          if (i === this.slideIndex) {
            thumb.setAttribute('aria-current', 'true');
            thumb.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          } else {
            thumb.removeAttribute('aria-current');
          }
        });
        const counter = this.querySelector('[data-pdp-counter]');
        if (counter) counter.textContent = String(this.slideIndex + 1);
      }

      showMedia(mediaId) {
        if (!mediaId) return;
        const index = this.slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
        if (index > -1) this.showSlide(index);
      }

      /* ---------- options */
      bindOptions() {
        this.addEventListener('change', (event) => {
          const input = event.target.closest('[data-pdp-option-input]');
          if (!input) return;
          const options = this.selectedOptions();
          let match = this.findVariant(options);
          if (!match) {
            // keep the changed option, take the first variant that has it
            const index = parseInt(input.dataset.pdpOptionInput, 10);
            match = this.variants.find((v) => v.options[index] === input.value && !this.isSample(v) && v.available) ||
              this.variants.find((v) => v.options[index] === input.value && !this.isSample(v));
          }
          if (match) {
            this.variant = match;
            this.update(true);
          }
        });
      }

      selectedOptions() {
        const options = this.variant ? this.variant.options.slice() : [];
        this.querySelectorAll('[data-pdp-option-input]:checked').forEach((input) => {
          options[parseInt(input.dataset.pdpOptionInput, 10)] = input.value;
        });
        return options;
      }

      findVariant(options) {
        return this.variants.find((v) => v.options.every((value, i) => value === options[i]));
      }

      isSample(variant) {
        return this.sampleIndex > -1 && this.isSampleValue(variant.options[this.sampleIndex]);
      }

      sampleVariant() {
        if (this.sampleIndex < 0 || !this.variant) return null;
        const wanted = this.variant.options.slice();
        wanted[this.sampleIndex] = null;
        return (
          this.variants.find(
            (v) => this.isSample(v) && v.options.every((value, i) => i === this.sampleIndex || value === wanted[i])
          ) || this.variants.find((v) => this.isSample(v))
        );
      }

      /* ---------- quantity */
      bindQuantity() {
        this.querySelectorAll('[data-pdp-qty]').forEach((button) =>
          button.addEventListener('click', () => {
            const step = parseInt(button.dataset.pdpQty, 10);
            this.setQuantity((parseInt(this.qtyInput.value, 10) || 1) + step);
          })
        );
        this.qtyInput?.addEventListener('change', () => this.setQuantity(parseInt(this.qtyInput.value, 10) || 1));
        this.addEventListener('pdp:set-quantity', (event) => this.setQuantity(event.detail.quantity));
      }

      maxQuantity() {
        const v = this.variant;
        if (v && v.inventory !== null && v.policy === 'deny' && v.inventory > 0) return v.inventory;
        return 9999;
      }

      setQuantity(quantity) {
        if (!this.qtyInput) return;
        const value = Math.min(Math.max(1, quantity), this.maxQuantity());
        this.qtyInput.value = value;
        this.updateQuantityTexts();
      }

      quantity() {
        return parseInt(this.qtyInput?.value, 10) || 1;
      }

      /* ---------- render */
      formatArea(value) {
        if (!value) return '';
        const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
        return rounded.toLocaleString('en-US');
      }

      update(fromUser) {
        const v = this.variant;
        if (!v) return;

        // option cards + labels
        this.querySelectorAll('[data-pdp-option]').forEach((group) => {
          const index = parseInt(group.dataset.pdpOption, 10);
          const label = group.querySelector('[data-pdp-option-value]');
          if (label) label.textContent = v.options[index];
          group.querySelectorAll('[data-pdp-option-input]').forEach((input) => {
            const selected = input.value === v.options[index];
            input.checked = selected;
            input.closest('[data-pdp-card]')?.classList.toggle('is-selected', selected);
            // unavailable: no available variant with this value and the other current values
            const test = v.options.slice();
            test[index] = input.value;
            const candidate = this.findVariant(test);
            input.closest('[data-pdp-card]')?.classList.toggle('is-unavailable', !candidate || !candidate.available);
          });
        });

        // variant ids
        const idInput = this.querySelector('[data-pdp-variant-id]');
        if (idInput) idInput.value = v.id;
        const termsInput = this.querySelector('[data-pdp-terms-id]');
        if (termsInput) {
          termsInput.value = v.id;
          termsInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // price
        const current = this.querySelector('[data-pdp-price-current]');
        if (current) {
          current.textContent = this.money(v.price);
          current.classList.toggle('is-sale', v.compare_at_price > v.price);
        }
        const compare = this.querySelector('[data-pdp-price-compare]');
        if (compare) {
          compare.hidden = !(v.compare_at_price > v.price);
          compare.textContent = this.money(v.compare_at_price);
        }
        const covering = this.querySelector('[data-pdp-price-covering]');
        if (covering) {
          covering.textContent = v.coverage
            ? ' ' + (this.strings.covering || '(covering [value] sq ft)').replace('[value]', this.formatArea(v.coverage))
            : '';
        }
        const sqft = this.querySelector('[data-pdp-price-sqft]');
        if (sqft) {
          sqft.hidden = !v.coverage;
          if (v.coverage) {
            sqft.textContent = `${this.money(Math.round(v.price / v.coverage))} ${this.strings.perSqft || '/sq ft'}`;
          }
        }

        // badge on the image
        const badge = this.querySelector('[data-pdp-install-badge]');
        if (badge && this.installIndex > -1) badge.textContent = v.options[this.installIndex];

        // stock
        const stock = this.querySelector('[data-pdp-stock]');
        if (stock) {
          stock.classList.toggle('is-out', !v.available);
          if (!v.available) stock.textContent = this.strings.outOfStock || 'Out of stock';
          else if (v.inventory !== null && v.inventory > 0)
            stock.textContent = (this.strings.inStockCount || '[count] In-stock. Ready to Ship.').replace('[count]', v.inventory);
          else stock.textContent = this.strings.inStock || 'In stock. Ready to Ship.';
        }

        // add to cart button
        const add = this.querySelector('[data-pdp-add]');
        if (add) {
          if (v.available) add.removeAttribute('aria-disabled');
          else add.setAttribute('aria-disabled', 'true');
        }

        // sample button
        const sampleForm = this.querySelector('[data-pdp-sample-form]');
        if (sampleForm) {
          const sample = this.sampleVariant();
          const sampleId = sampleForm.querySelector('[data-pdp-sample-id]');
          const sampleButton = sampleForm.querySelector('[data-pdp-sample-button]');
          const sampleLabel = sampleForm.querySelector('[data-pdp-sample-label]');
          sampleForm.hidden = !sample;
          if (sample) {
            sampleId.value = sample.id;
            sampleId.disabled = false;
            sampleLabel.textContent = sample.available
              ? `${this.strings.addSample || 'Add a sample'} • ${this.money(sample.price)}`
              : this.strings.soldOut || 'Sold out';
            if (sample.available) sampleButton.removeAttribute('aria-disabled');
            else sampleButton.setAttribute('aria-disabled', 'true');
          }
        }

        // quantity limits + texts
        if (this.quantity() > this.maxQuantity()) this.qtyInput.value = this.maxQuantity();
        this.updateQuantityTexts();

        if (fromUser) {
          this.showMedia(v.media);
          const url = new URL(window.location.href);
          url.searchParams.set('variant', v.id);
          window.history.replaceState({}, '', url.toString());
          this.dispatchEvent(new CustomEvent('pdp:variant-change', { bubbles: true, detail: { variant: v } }));
        }
      }

      updateQuantityTexts() {
        const v = this.variant;
        const quantity = this.quantity();

        const unit = this.querySelector('[data-pdp-qty-unit]');
        if (unit) unit.textContent = quantity === 1 ? this.unit : this.unitPlural;

        const coverage = this.querySelector('[data-pdp-coverage]');
        const help = this.querySelector('[data-pdp-help]');
        if (coverage) {
          coverage.hidden = !(v && v.coverage);
          if (v && v.coverage) {
            this.querySelector('[data-pdp-coverage-text]').textContent = (
              this.strings.coverage || 'Coverage: [value] sq ft'
            ).replace('[value]', this.formatArea(v.coverage * quantity));
          }
        }
        // the calculator needs the coverage per box
        if (help) help.hidden = !(v && v.coverage);

        const addLabel = this.querySelector('[data-pdp-add-label]');
        if (addLabel && v) {
          addLabel.textContent = v.available
            ? `${this.strings.addToCart || 'Add to cart'} • ${this.money(v.price * quantity)}`
            : this.strings.soldOut || 'Sold out';
        }
      }

      /* ---------- smart calculator (drawer) */
      bindCalculator() {
        this.calc = this.querySelector('[data-pdp-calc]');
        if (!this.calc) return;
        this.calcWidth = this.calc.querySelector('[data-pdp-calc-width]');
        this.calcHeight = this.calc.querySelector('[data-pdp-calc-height]');
        this.calcQty = this.calc.querySelector('[data-pdp-calc-qty]');
        this.calcOverage = this.calc.querySelector('[data-pdp-calc-overage]');
        // the drawer lives outside the page flow so it sits over the header
        document.body.appendChild(this.calc);

        this.querySelector('[data-pdp-calculator-open]')?.addEventListener('click', (event) => {
          this.calcTrigger = event.currentTarget;
          this.openCalculator();
        });
        this.calc.querySelectorAll('[data-pdp-calc-close]').forEach((el) =>
          el.addEventListener('click', () => this.closeCalculator())
        );
        this.calc.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') this.closeCalculator();
        });
        [this.calcWidth, this.calcHeight].forEach((input) => {
          input.addEventListener('input', () => this.computeCalculator(false));
          input.addEventListener('blur', () => this.computeCalculator(true));
        });
        this.calcOverage.addEventListener('change', () => {
          this.renderOverage();
          this.computeCalculator(false);
        });
        this.calc.querySelectorAll('[data-pdp-calc-step]').forEach((button) =>
          button.addEventListener('click', () => {
            const next = (parseInt(this.calcQty.value, 10) || 0) + parseInt(button.dataset.pdpCalcStep, 10);
            this.setCalcQty(next);
          })
        );
        this.calcQty.addEventListener('change', () => this.setCalcQty(parseInt(this.calcQty.value, 10) || 0));
        this.calc.querySelector('[data-pdp-calc-update]').addEventListener('click', () => {
          const quantity = parseInt(this.calcQty.value, 10) || 0;
          if (quantity > 0) this.setQuantity(quantity);
          this.closeCalculator();
        });
        this.renderOverage();
      }

      openCalculator() {
        const v = this.variant;
        const panel = this.calc.querySelector('[data-pdp-calc-panel]');
        if (panel) {
          panel.hidden = !(v && v.dims);
          if (v && v.dims) panel.textContent = (this.strings.calcPanel || 'Panel size: [size]').replace('[size]', v.dims);
        }
        this.calc.hidden = false;
        document.body.classList.add('overflow-hidden');
        requestAnimationFrame(() => this.calc.classList.add('is-open'));
        this.calcWidth.focus({ preventScroll: true });
        if (typeof trapFocus === 'function') trapFocus(this.calc.querySelector('.pdp-calc__drawer'), this.calcWidth);
        this.computeCalculator(false);
      }

      closeCalculator() {
        if (!this.calc || this.calc.hidden) return;
        this.calc.classList.remove('is-open');
        document.body.classList.remove('overflow-hidden');
        if (typeof removeTrapFocus === 'function') removeTrapFocus(this.calcTrigger);
        window.setTimeout(() => {
          this.calc.hidden = true;
        }, 250);
        this.calcTrigger?.focus({ preventScroll: true });
      }

      renderOverage() {
        const value = this.calcOverage.value;
        this.calc.querySelector('[data-pdp-calc-overage-percent]').textContent = `${value}%`;
        const help = this.calc.querySelector('[data-pdp-calc-overage-help]');
        help.textContent = value === '0' ? this.strings.calcOverage0 || '' : value === '10' ? this.strings.calcOverage10 || '' : '';
      }

      setCalcQty(quantity) {
        const value = Math.max(0, quantity);
        this.calcQty.value = value;
        this.calc.querySelector('[data-pdp-calc-qty-unit]').textContent = value === 1 ? this.unit : this.unitPlural;
      }

      computeCalculator(showErrors) {
        const fields = { width: this.calcWidth, height: this.calcHeight };
        const values = {};
        let valid = true;
        Object.keys(fields).forEach((key) => {
          const input = fields[key];
          const raw = input.value.trim();
          const number = parseFloat(raw);
          const isEmpty = raw === '';
          const isBad = !isEmpty && (!isFinite(number) || number <= 0);
          const error = this.calc.querySelector(`[data-pdp-calc-error="${key}"]`);
          // Figma error state: zero / negative values. An empty field shows no error.
          const showError = isBad;
          error.hidden = !showError;
          input.classList.toggle('is-invalid', showError);
          input.setAttribute('aria-invalid', showError ? 'true' : 'false');
          if (isEmpty || isBad) valid = false;
          values[key] = number;
        });

        const area = this.calc.querySelector('[data-pdp-calc-area]');
        const overageField = this.calc.querySelector('[data-pdp-calc-overage-field]');
        const coverage = this.variant ? this.variant.coverage : 0;

        if (!valid || !coverage) {
          area.hidden = true;
          overageField.hidden = true;
          this.calc.classList.remove('has-result');
          this.setCalcQty(0);
          return;
        }

        const sqft = (values.width * values.height) / 144;
        const overage = parseInt(this.calcOverage.value, 10) || 0;
        const boxes = Math.max(1, Math.ceil((sqft * (1 + overage / 100)) / coverage - 1e-9));

        area.hidden = false;
        overageField.hidden = false;
        this.calc.classList.add('has-result');
        this.calc.querySelector('[data-pdp-calc-area-value]').textContent = (Math.round(sqft * 10) / 10).toLocaleString('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
        this.setCalcQty(boxes);
      }

      /* ---------- delivery estimate */
      renderDelivery() {
        const target = this.querySelector('[data-pdp-delivery]');
        if (!target) return;
        const min = parseInt(this.dataset.deliveryMin, 10) || 0;
        const max = parseInt(this.dataset.deliveryMax, 10) || 0;
        if (!max) return;
        const addBusinessDays = (date, days) => {
          const d = new Date(date);
          let added = 0;
          while (added < days) {
            d.setDate(d.getDate() + 1);
            const day = d.getDay();
            if (day !== 0 && day !== 6) added += 1;
          }
          return d;
        };
        const format = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const today = new Date();
        target.textContent = `${format(addBusinessDays(today, min))} - ${format(addBusinessDays(today, max))}`;
      }
    }
  );
}
