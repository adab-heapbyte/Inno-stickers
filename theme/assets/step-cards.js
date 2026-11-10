if (!customElements.get('step-cards-slider')) {
  /**
   * Mobile progress bar for the step cards row.
   * The row scrolls natively (CSS scroll-snap); this element only moves the
   * 72px thumb along the track to reflect the scroll position.
   */
  class StepCardsSlider extends HTMLElement {
    connectedCallback() {
      this.list = this.querySelector('.step-cards__list');
      this.track = this.querySelector('.step-cards__progress');
      if (!this.list || !this.track) return;

      this.onScroll = this.update.bind(this);
      this.list.addEventListener('scroll', this.onScroll, { passive: true });

      this.resizeObserver = new ResizeObserver(this.onScroll);
      this.resizeObserver.observe(this.list);

      this.update();
    }

    disconnectedCallback() {
      if (this.list && this.onScroll) this.list.removeEventListener('scroll', this.onScroll);
      if (this.resizeObserver) this.resizeObserver.disconnect();
    }

    update() {
      const maxScroll = this.list.scrollWidth - this.list.clientWidth;
      const scrollable = maxScroll > 1;

      this.classList.toggle('is-scrollable', scrollable);
      if (!scrollable) return;

      const progress = Math.min(Math.max(this.list.scrollLeft / maxScroll, 0), 1);
      this.style.setProperty('--step-progress', progress.toFixed(4));
      this.style.setProperty('--step-track', `${this.track.clientWidth}px`);
    }
  }

  customElements.define('step-cards-slider', StepCardsSlider);
}
