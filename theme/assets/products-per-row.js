(function () {
  const SWITCHING_CLASS = "per-row-switching";
  const FADE_OUT_CLASS = "per-row-switching--out";
  const GRID_SELECTOR = ".collection-product-list";
  const BUTTON_SELECTOR = ".per-row__button";
  const CONTAINER_SELECTOR = "[data-productis-in-row]";

  const FADE_OUT_DURATION = 120;
  const RESIZE_DURATION = 320;

  const animations = new WeakMap();

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const syncButtons = (perRow) => {
    document.querySelectorAll(BUTTON_SELECTOR).forEach((button) => {
      const isActive = button.dataset.perRow === perRow;

      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const resetGrids = (container) => {
    container.classList.remove(SWITCHING_CLASS, FADE_OUT_CLASS);
    container.querySelectorAll(GRID_SELECTOR).forEach((grid) => {
      grid.style.removeProperty("height");
    });
  };

  const stopAnimation = (container) => {
    const animation = animations.get(container);

    if (!animation) return;

    animation.timers.forEach((timer) => clearTimeout(timer));
    animation.frames.forEach((frame) => cancelAnimationFrame(frame));
    animations.delete(container);
    resetGrids(container);
  };

  const setPerRow = (container, perRow) => {
    stopAnimation(container);

    const grids = Array.from(container.querySelectorAll(GRID_SELECTOR));

    if (!grids.length || prefersReducedMotion()) {
      container.dataset.productisInRow = perRow;
      return;
    }

    const animation = { timers: [], frames: [] };
    animations.set(container, animation);

    // Lock the current heights so the grid cannot jump while it reflows
    const fromHeights = grids.map((grid) => grid.offsetHeight);

    grids.forEach((grid, index) => {
      grid.style.height = `${fromHeights[index]}px`;
    });
    container.classList.add(SWITCHING_CLASS);

    animation.frames.push(
      requestAnimationFrame(() => {
        container.classList.add(FADE_OUT_CLASS);

        animation.timers.push(
          setTimeout(() => {
            container.dataset.productisInRow = perRow;

            // Measure the new layout, then animate from the locked height to it
            grids.forEach((grid) => {
              grid.style.height = "auto";
            });

            const toHeights = grids.map((grid) => grid.offsetHeight);

            grids.forEach((grid, index) => {
              grid.style.height = `${fromHeights[index]}px`;
            });

            void container.offsetHeight;

            grids.forEach((grid, index) => {
              grid.style.height = `${toHeights[index]}px`;
            });

            animation.frames.push(
              requestAnimationFrame(() => {
                container.classList.remove(FADE_OUT_CLASS);
              })
            );

            animation.timers.push(
              setTimeout(() => {
                animations.delete(container);
                resetGrids(container);
              }, RESIZE_DURATION)
            );
          }, FADE_OUT_DURATION)
        );
      })
    );
  };

  const onClick = (event) => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const button = target.closest(BUTTON_SELECTOR);
    const perRow = button ? button.dataset.perRow : null;

    if (!perRow) return;

    syncButtons(perRow);

    document.querySelectorAll(CONTAINER_SELECTOR).forEach((container) => {
      if (container.dataset.productisInRow === perRow) return;

      setPerRow(container, perRow);
    });
  };

  const syncFromContainer = () => {
    const container = document.querySelector(CONTAINER_SELECTOR);

    if (!container) return;

    syncButtons(container.dataset.productisInRow);
  };

  // Delegated listener, bound once, so re-rendered markup keeps working
  // without stacking duplicate handlers in the theme editor
  document.addEventListener("click", onClick);
  document.addEventListener("shopify:section:load", syncFromContainer);
  syncFromContainer();
})();
