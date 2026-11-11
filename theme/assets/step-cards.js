if (!customElements.get('step-cards-slider')) {
  /**
   * Mobile progress bar for the step cards row.
   * The row scrolls natively (CSS scroll-snap); this element only moves the
   * 72px thumb along the track to reflect the scroll position.
   *
   * Smoothness: scroll events only request a frame; the thumb is moved once
   * per animation frame with a GPU transform. Sizes are measured only when the
   * row or track is resized, never during scrolling.
   */
  class StepCardsSlider extends HTMLElement {
    connectedCallback() {
      this.list = this.querySelector('.step-cards__list');
      this.track = this.querySelector('.step-cards__progress');
      this.thumb = this.querySelector('.step-cards__progress-thumb');
      if (!this.list || !this.track || !this.thumb) return;

      this.frame = null;
      this.onScroll = this.requestUpdate.bind(this);
      this.onResize = this.measure.bind(this);

      this.list.addEventListener('scroll', this.onScroll, { passive: true });

      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(this.list);
      this.resizeObserver.observe(this.track);

      this.measure();
    }

    disconnectedCallback() {
      if (this.list && this.onScroll) this.list.removeEventListener('scroll', this.onScroll);
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.frame) cancelAnimationFrame(this.frame);
    }

    /** Read sizes (only on load and resize). */
    measure() {
      this.maxScroll = this.list.scrollWidth - this.list.clientWidth;
      this.travel = Math.max(this.track.clientWidth - this.thumb.offsetWidth, 0);

      const scrollable = this.maxScroll > 1;
      this.classList.toggle('is-scrollable', scrollable);
      this.render();
    }

    /** Coalesce scroll events into one update per frame. */
    requestUpdate() {
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = null;
        this.render();
      });
    }

    /** Write the thumb position (no layout reads except scrollLeft). */
    render() {
      if (!(this.maxScroll > 1)) {
        this.thumb.style.transform = 'translate3d(0, 0, 0)';
        return;
      }
      const progress = Math.min(Math.max(this.list.scrollLeft / this.maxScroll, 0), 1);
      this.thumb.style.transform = `translate3d(${(progress * this.travel).toFixed(2)}px, 0, 0)`;
    }
  }

  customElements.define('step-cards-slider', StepCardsSlider);
}
