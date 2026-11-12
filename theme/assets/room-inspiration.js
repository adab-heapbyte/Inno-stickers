if (!customElements.get('room-inspiration-slider')) {
  /**
   * Room inspiration gallery: Swiper slider (theme swiper-bundle), "01 / 05"
   * counter, progress bar and a <dialog> lightbox for the expand buttons.
   */
  class RoomInspirationSlider extends HTMLElement {
    connectedCallback() {
      this.sliderEl = this.querySelector('.room-inspiration__slider');
      this.current = this.querySelector('.room-inspiration__counter-current');
      this.dialog = this.querySelector('.room-inspiration__lightbox');
      this.total = parseInt(this.dataset.total, 10) || 0;

      this.initLightbox();
      this.initSlider();
    }

    disconnectedCallback() {
      if (this.swiper) this.swiper.destroy(true, true);
      if (this.resizeObserver) this.resizeObserver.disconnect();
    }

    initSlider() {
      if (!this.sliderEl) return;
      if (typeof window.Swiper !== 'function') {
        // swiper-bundle.min.js is deferred in the theme layout; wait for it.
        window.addEventListener('load', () => this.initSlider(), { once: true });
        return;
      }
      if (this.swiper) return;

      this.swiper = new window.Swiper(this.sliderEl, {
        slidesPerView: 'auto',
        spaceBetween: 24,
        watchOverflow: true,
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: { enabled: true },
        breakpoints: {
          990: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
        },
        on: {
          init: () => this.update(),
          slideChange: () => this.update(),
          progress: () => this.update(),
          resize: () => this.update(),
        },
      });

      this.update();
    }

    update() {
      if (!this.swiper) return;

      // QA-15: count from the first visible story. When every story fits (start and end at
      // once, e.g. 3 stories at 3 per view) it reads 01; at the real end it reads the total.
      const atEnd = this.swiper.isEnd && !this.swiper.isBeginning;
      const index = atEnd ? this.total : this.swiper.activeIndex + 1;
      if (this.current) this.current.textContent = String(Math.min(index, this.total)).padStart(2, '0');

      const progress = Math.min(Math.max(this.swiper.progress || 0, 0), 1);
      this.style.setProperty('--ri-progress', progress.toFixed(4));
    }

    initLightbox() {
      if (!this.dialog) return;
      const image = this.dialog.querySelector('.room-inspiration__lightbox-image');
      const close = this.dialog.querySelector('.room-inspiration__lightbox-close');

      this.querySelectorAll('.room-inspiration__expand').forEach((button) => {
        button.addEventListener('click', () => {
          image.src = button.dataset.full;
          image.alt = button.dataset.alt || '';
          this.lastTrigger = button;
          this.dialog.showModal();
        });
      });

      close?.addEventListener('click', () => this.dialog.close());

      // Click on the backdrop (outside the image) closes the lightbox.
      this.dialog.addEventListener('click', (event) => {
        if (event.target === this.dialog) this.dialog.close();
      });

      this.dialog.addEventListener('close', () => {
        image.removeAttribute('src');
        this.lastTrigger?.focus();
      });
    }
  }

  customElements.define('room-inspiration-slider', RoomInspirationSlider);
}

/**
 * "See it in your space": when a room visualizer app block (e.g. HomeVisioner)
 * is added to the section, the Figma button clicks the app button that is kept
 * off-screen. Falls back to the button link if the app has not rendered one.
 */
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-visualizer-trigger]');
  if (!trigger) return;

  const banner = trigger.closest('.room-inspiration__banner');
  const app = banner && banner.querySelector('[data-visualizer-app]');
  const appButton = app && app.querySelector('button, a[href], [role="button"]');

  if (appButton) {
    event.preventDefault();
    appButton.click();
    return;
  }

  if (trigger.dataset.fallbackUrl) window.location.href = trigger.dataset.fallbackUrl;
});
