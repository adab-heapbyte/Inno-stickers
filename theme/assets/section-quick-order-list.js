class BulkAdd extends HTMLElement {
  static ASYNC_REQUEST_DELAY = 250;

  constructor() {
    super();
    this.queue = [];
    this.setRequestStarted(false);
    this.pendingItemIds = [];
  }

  startQueue(id, quantity) {
    this.queue.push({ id, quantity });

    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        if (!this.requestStarted) {
          this.sendRequest(this.queue);
        }
      } else {
        clearInterval(interval);
      }
    }, BulkAdd.ASYNC_REQUEST_DELAY);
  }

  sendRequest(queue) {
    this.setRequestStarted(true);
    const items = {};

    queue.forEach((queueItem) => {
      items[parseInt(queueItem.id, 10)] = queueItem.quantity;
    });

    this.queue = this.queue.filter((queueElement) => !queue.includes(queueElement));
    this.updateMultipleQty(items);
  }

  setRequestStarted(requestStarted) {
    this._requestStarted = requestStarted;
  }

  get requestStarted() {
    return this._requestStarted;
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    if (input) {
      input.value = input.getAttribute("value") || input.value;
    }
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value, 10);
    const index = event.target.dataset.index;
    const minValue = parseInt(event.target.dataset.min || "0", 10);
    const maxValue = parseInt(event.target.max || "0", 10);
    const stepValue = parseInt(event.target.step || "1", 10);

    if (inputValue < minValue) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.minError.replace("[min]", event.target.dataset.min)
      );
    } else if (event.target.max && inputValue > maxValue) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.maxError.replace("[max]", event.target.max)
      );
    } else if (inputValue % stepValue !== 0) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.stepError.replace("[step]", event.target.step)
      );
    } else {
      event.target.setCustomValidity("");
      event.target.reportValidity();
      event.target.setAttribute("value", inputValue);
      this.toggleLoading(true, this, index);
      this.startQueue(index, inputValue);
    }
  }
}

class QuickOrderList extends BulkAdd {
  cartUpdateUnsubscriber = undefined;
  hasPendingQuantityUpdate = false;

  constructor() {
    super();
    this.stickyHeaderElement = document.querySelector("sticky-header");
    if (this.stickyHeaderElement) {
      this.stickyHeader = {
        height: this.stickyHeaderElement.offsetHeight,
        type: `${this.stickyHeaderElement.getAttribute("data-sticky-type")}`,
      };
    }

    this.totalBar = this.getTotalBar();
    if (this.totalBar) {
      this.totalBarPosition = window.innerHeight - this.totalBar.offsetHeight;
      this.handleResize = this.handleResize.bind(this);
      window.addEventListener("resize", this.handleResize);
    }

    this.querySelector("form")?.addEventListener("submit", (event) => event.preventDefault());
  }

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, async (event) => {
      if (event.source === this.id) return;

      this.toggleTableLoading(true);
      await this.refresh();
      this.toggleTableLoading(false);
    });

    this.initEventListeners();
  }

  disconnectedCallback() {
    this.cartUpdateUnsubscriber?.();
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize() {
    if (this.totalBar) {
      this.totalBarPosition = window.innerHeight - this.totalBar.offsetHeight;
    }

    this.stickyHeader = {
      height: this.stickyHeaderElement ? this.stickyHeaderElement.offsetHeight : 0,
      type: this.stickyHeaderElement?.getAttribute("data-sticky-type") || "",
    };
  }

  initEventListeners() {
    this.querySelectorAll(".pagination__item, .pagination__item--prev, .pagination__item--next").forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const url = new URL(event.currentTarget.href);

        this.toggleTableLoading(true);
        await this.refresh(url.searchParams.get("page") || "1");
        this.scrollTop();
        this.toggleTableLoading(false);
      });
    });

    this.querySelector(".quick-order-list__form")?.addEventListener(
      "keyup",
      this.handleScrollIntoView.bind(this)
    );

    this.quickOrderListTable?.addEventListener(
      "keydown",
      this.handleSwitchVariantOnEnter.bind(this)
    );

    this.initVariantEventListeners();
  }

  initVariantEventListeners() {
    this.allInputsArray = Array.from(this.querySelectorAll('input[type="number"]'));

    this.querySelectorAll("quantity-input").forEach((quantityInput) => {
      const debouncedOnChange = debounce(
        this.onChange.bind(this),
        BulkAdd.ASYNC_REQUEST_DELAY,
        true
      );

      quantityInput.addEventListener("change", (event) => {
        this.hasPendingQuantityUpdate = true;
        debouncedOnChange(event);
      });
    });

    this.querySelectorAll(".quick-variant-item__remove button").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const index = button.closest(".quick-variant-item__remove")?.dataset.index;
        if (!index) return;

        this.toggleLoading(true, this, index);
        this.startQueue(index, 0);
      });
    });
  }

  get currentPage() {
    return this.querySelector(".quick-order-list__pagination-wrapper")?.dataset?.page ?? "1";
  }

  get cartVariantsForProduct() {
    return JSON.parse(this.querySelector("[data-cart-contents]")?.innerHTML || "[]");
  }

  get quickOrderListTable() {
    return this.querySelector(".quick-order-list__table");
  }

  getSectionsToRender() {
    return [
      {
        id: this.id,
        section: this.dataset.section,
        selector: `#${this.id}`,
      },
      {
        id: `quick-order-list-live-region-text-${this.dataset.productId}`,
        section: "cart-live-region-text",
        selector: ".shopify-section",
      },
      {
        id: "CartDrawer",
        section: "cart-drawer",
        selector: "#CartDrawer",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
    ];
  }

  onChange(event) {
    const inputValue = parseInt(event.target.value, 10);
    this.cleanErrorMessageOnType(event);

    if (inputValue === 0) {
      event.target.setAttribute("value", inputValue);
      this.toggleLoading(true, this, event.target.dataset.index);
      this.startQueue(event.target.dataset.index, inputValue);
      return;
    }

    this.validateQuantity(event);
  }

  cleanErrorMessageOnType(event) {
    const handleKeydown = () => {
      event.target.setCustomValidity(" ");
      event.target.reportValidity();
      event.target.removeEventListener("keydown", handleKeydown);
    };

    event.target.addEventListener("keydown", handleKeydown);
  }

  validateInput(target) {
    const targetValue = parseInt(target.value, 10);
    const targetMin = parseInt(target.dataset.min || "0", 10);
    const targetStep = parseInt(target.step || "1", 10);

    if (target.max) {
      return (
        targetValue === 0 ||
        (targetValue >= targetMin &&
          targetValue <= parseInt(target.max, 10) &&
          targetValue % targetStep === 0)
      );
    }

    return targetValue === 0 || (targetValue >= targetMin && targetValue % targetStep === 0);
  }

  toggleTableLoading(enable) {
    this.querySelector(".quick-order-list__container")?.classList.toggle(
      "quick-order-list__container--disabled",
      enable
    );
    this.toggleLoading(enable);
  }

  async refresh(pageNumber = null) {
    const url = this.dataset.url || window.location.pathname;

    return fetch(`${url}?section_id=${this.dataset.section}&page=${pageNumber || this.currentPage}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, "text/html");
        const responseQuickOrderList = html.querySelector(`#${this.id}`);

        if (!responseQuickOrderList) {
          return;
        }

        this.innerHTML = responseQuickOrderList.innerHTML;
        this.totalBar = this.getTotalBar();
        this.handleResize();
        this.initEventListeners();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  renderSections(parsedState) {
    const { items, sections } = parsedState;

    this.getSectionsToRender().forEach(({ id, selector, section }) => {
      const sectionElement = document.getElementById(id);
      if (!sectionElement) return;

      const parsedSection = sections[section];
      if (!parsedSection) return;

      const newSection = new DOMParser()
        .parseFromString(parsedSection, "text/html")
        .querySelector(selector);

      if (!newSection) return;

      if (section === this.dataset.section) {
        if (this.queue.length > 0 || this.hasPendingQuantityUpdate) return;

        const focusTarget = document.activeElement?.dataset?.target;
        const total = this.getTotalBar();
        const newTotal = newSection.querySelector(".quick-order-list__total");
        if (total && newTotal) {
          total.innerHTML = newTotal.innerHTML;
        }

        const paginationWrapper = this.querySelector(".quick-order-list__pagination-wrapper");
        const newPaginationWrapper = newSection.querySelector(
          ".quick-order-list__pagination-wrapper"
        );
        if (paginationWrapper && newPaginationWrapper) {
          paginationWrapper.outerHTML = newPaginationWrapper.outerHTML;
        }

        const table = this.quickOrderListTable;
        const newTable = newSection.querySelector(".quick-order-list__table");
        const shouldUpdateVariants =
          this.currentPage ===
          (newSection.querySelector(".quick-order-list__pagination-wrapper")?.dataset.page ?? "1");

        if (table && newTable && shouldUpdateVariants) {
          table.innerHTML = newTable.innerHTML;

          const newFocusTarget = this.querySelector(`[data-target='${focusTarget}']`);
          if (newFocusTarget) {
            newFocusTarget.focus({ preventScroll: true });
          }

          this.initEventListeners();
        }
      } else if (section === "cart-drawer") {
        const cartDrawer = sectionElement.closest("cart-drawer");
        cartDrawer?.classList.toggle("is-empty", items.length === 0);

        sectionElement.className = newSection.className;
        sectionElement.innerHTML = newSection.innerHTML;

        const drawerOverlay = cartDrawer?.querySelector("#CartDrawer-Overlay");
        if (drawerOverlay && cartDrawer) {
          drawerOverlay.addEventListener("click", cartDrawer.close.bind(cartDrawer));
        }
      } else {
        sectionElement.innerHTML = newSection.innerHTML;
      }
    });
  }

  getTotalBar() {
    return this.querySelector(".quick-order-list__total");
  }

  scrollTop() {
    const { top } = this.getBoundingClientRect();

    window.scrollTo({
      top: top + window.scrollY - (this.stickyHeader?.height || 0),
      behavior: "auto",
    });
  }

  scrollQuickOrderListTable(target) {
    const quantityWrapperHeight =
      this.querySelector(".quick-variant-item__quantity-wrapper")?.offsetHeight || 0;
    const inputTopBorder = target.getBoundingClientRect().top;
    const inputBottomBorder = target.getBoundingClientRect().bottom;

    const stickyHeaderBottomBorder = this.stickyHeaderElement?.getBoundingClientRect().bottom;
    const totalBarCrossesInput = inputBottomBorder > this.totalBarPosition;
    const inputOutsideOfViewPort = inputBottomBorder < quantityWrapperHeight;
    const stickyHeaderCrossesInput =
      this.stickyHeaderElement &&
      this.stickyHeader.type !== "on-scroll-up" &&
      this.stickyHeader.height > inputTopBorder;
    const stickyHeaderScrollupCrossesInput =
      this.stickyHeaderElement &&
      this.stickyHeader.type === "on-scroll-up" &&
      this.stickyHeader.height > inputTopBorder &&
      stickyHeaderBottomBorder > 0;

    if (
      totalBarCrossesInput ||
      inputOutsideOfViewPort ||
      stickyHeaderCrossesInput ||
      stickyHeaderScrollupCrossesInput
    ) {
      this.scrollToCenter(target);
    }
  }

  scrollToCenter(target) {
    target.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }

  handleScrollIntoView(event) {
    if ((event.key === "Tab" || event.key === "Enter") && this.allInputsArray.length !== 1) {
      this.scrollQuickOrderListTable(event.target);
    }
  }

  handleSwitchVariantOnEnter(event) {
    if (event.key !== "Enter" || event.target.tagName !== "INPUT") return;

    event.preventDefault();
    event.target.blur();

    if (!this.validateInput(event.target) || this.allInputsArray.length <= 1) return;

    const currentIndex = this.allInputsArray.indexOf(event.target);
    const offset = event.shiftKey ? -1 : 1;
    const nextIndex =
      (currentIndex + offset + this.allInputsArray.length) % this.allInputsArray.length;

    this.allInputsArray[nextIndex]?.select();
  }

  updateMultipleQty(items) {
    if (this.queue.length === 0) {
      this.hasPendingQuantityUpdate = false;
    }

    this.pendingItemIds = Object.keys(items).map(String);
    this.toggleLoading(true);

    const url = this.dataset.url || window.location.pathname;
    const body = JSON.stringify({
      updates: items,
      sections: this.getSectionsToRender().map(({ section }) => section),
      sections_url: `${url}?page=${this.currentPage}`,
    });

    this.setErrorMessage();

    fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.text())
      .then((state) => {
        const parsedState = JSON.parse(state);
        if (parsedState.errors) {
          this.setErrorMessage(parsedState.errors);
          return;
        }

        this.renderSections(parsedState);

        document.dispatchEvent(
          new CustomEvent("cart:change", {
            detail: {
              cart: parsedState,
              sectionId: this.dataset.section,
            },
          })
        );

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: this.id,
          cartData: parsedState,
        });
      })
      .catch((error) => {
        console.error(error);
        this.setErrorMessage(window.cartStrings.error);
      })
      .finally(() => {
        if (this.queue.length === 0) {
          this.toggleLoading(false);
          this.pendingItemIds.forEach((id) => this.toggleLoading(false, this, id));
          this.pendingItemIds = [];
        }

        this.setRequestStarted(false);
      });
  }

  setErrorMessage(message = null) {
    this.errorMessageTemplate =
      this.errorMessageTemplate ||
      document
        .getElementById(`QuickOrderListErrorTemplate-${this.dataset.productId}`)
        ?.cloneNode(true);

    const errorElements = this.querySelectorAll(".quick-order-list__error");

    errorElements.forEach((errorElement) => {
      errorElement.innerHTML = "";
      if (!message || !this.errorMessageTemplate) return;

      const updatedMessageElement = this.errorMessageTemplate.cloneNode(true);
      updatedMessageElement.content.querySelector(
        ".quick-order-list__error-message"
      ).innerText = message;
      errorElement.appendChild(updatedMessageElement.content);
    });
  }

  toggleLoading(loading, target = this, item = null) {
    target
      .querySelector("#shopping-cart-variant-item-status")
      ?.toggleAttribute("aria-hidden", !loading);

    target
      .querySelectorAll(".quick-order-list__remove-all .loading-overlay__spinner")
      .forEach((spinner) => {
        spinner.classList.toggle("hidden", !loading);
      });

    if (item) {
      const row = target.querySelector(`[data-variant-id="${item}"]`);
      const itemSpinner = row?.querySelector(
        ".quick-variant-item__totals-wrapper .loading-overlay__spinner"
      );

      if (itemSpinner) {
        itemSpinner.classList.toggle("hidden", !loading);
      }
    }
  }
}

if (!customElements.get("quick-order-list")) {
  customElements.define("quick-order-list", QuickOrderList);
}

class QuickOrderListRemoveAllButton extends HTMLElement {
  constructor() {
    super();
    this.quickOrderList = this.closest("quick-order-list");

    this.actions = {
      confirm: "confirm",
      remove: "remove",
      cancel: "cancel",
    };

    this.addEventListener("click", (event) => {
      event.preventDefault();

      if (!this.quickOrderList) return;

      if (this.dataset.action === this.actions.confirm) {
        this.toggleConfirmation(false, true);
      } else if (this.dataset.action === this.actions.remove) {
        const items = this.quickOrderList.cartVariantsForProduct.reduce(
          (accumulator, variantId) => ({ ...accumulator, [variantId]: 0 }),
          {}
        );

        this.quickOrderList.updateMultipleQty(items);
        this.toggleConfirmation(true, false);
      } else if (this.dataset.action === this.actions.cancel) {
        this.toggleConfirmation(true, false);
      }
    });
  }

  toggleConfirmation(showConfirmation, showInfo) {
    this.quickOrderList
      ?.querySelector(".quick-order-list__total-confirmation")
      ?.classList.toggle("hidden", showConfirmation);
    this.quickOrderList
      ?.querySelector(".quick-order-list__total-info")
      ?.classList.toggle("hidden", showInfo);
  }
}

if (!customElements.get("quick-order-list-remove-all-button")) {
  customElements.define(
    "quick-order-list-remove-all-button",
    QuickOrderListRemoveAllButton
  );
}