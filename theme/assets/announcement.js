(function () {
  const SECTION_SELECTOR = ".section-announcement";
  const CLOSE_BUTTON_SELECTOR = ".announcement-bar__close-button";
  const CLOSING_CLASS = "section-announcement--closing";
  const HIDDEN_CLASS = "announcement-hide";
  const STORAGE_KEY = "announcement_bar_hidden";
  const CLOSED_EVENT = "announcement:closed";
  const FALLBACK_DURATION = 300;

  if (window.announcementBarInitialized) return;
  window.announcementBarInitialized = true;

  const root = document.documentElement;
  let isClosing = false;

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const getDuration = () => {
    if (prefersReducedMotion()) return 0;

    const value = getComputedStyle(root)
      .getPropertyValue("--duration-default")
      .trim();
    const parsed = parseFloat(value);

    if (!parsed) return FALLBACK_DURATION;

    return value.endsWith("ms") ? parsed : parsed * 1000;
  };

  // First element of the document flow that follows the announcement bar. Its
  // position is the reference used to give back, through the scroll offset,
  // whatever vertical space the collapsing bar releases.
  const getScrollAnchor = () =>
    document.getElementById("MainContent") ||
    document.querySelector(".shopify-section-header");

  // Both variables describe the same height: --announcement-height feeds the
  // layout (section height, full height sections, offsets of the fixed
  // elements), --ann-height is the measured value shared with header.js. They
  // are written together so nothing is left one step behind while the bar
  // collapses.
  const setBarHeight = (height) => {
    root.style.setProperty("--announcement-height", `${height}px`);
    root.style.setProperty("--ann-height", `${height}px`);
  };

  const clearBarHeight = () => {
    root.style.removeProperty("--announcement-height");
    root.style.removeProperty("--ann-height");
  };

  const collapse = (section) => {
    if (isClosing || root.classList.contains(HIDDEN_CLASS)) return;
    isClosing = true;

    const startHeight = section.getBoundingClientRect().height;
    const anchor = getScrollAnchor();
    const anchorTop = anchor ? anchor.getBoundingClientRect().top : 0;

    const previousRootScrollBehavior = root.style.scrollBehavior;
    const previousBodyScrollBehavior = document.body.style.scrollBehavior;
    const previousOverflowAnchor = root.style.overflowAnchor;

    // Smooth scrolling is enabled globally and browsers run their own scroll
    // anchoring: both are turned off so every correction below lands in the
    // frame that requested it, exactly once.
    root.style.scrollBehavior = "auto";
    document.body.style.scrollBehavior = "auto";
    root.style.overflowAnchor = "none";

    section.classList.add(CLOSING_CLASS);

    // Reading the rect flushes the pending layout, so the delta also covers
    // the sections that resize with the bar and any adjustment the browser
    // made on its own.
    const keepAnchorInPlace = () => {
      if (!anchor) return;

      const delta = anchor.getBoundingClientRect().top - anchorTop;
      if (!delta) return;

      window.scrollTo(
        window.pageXOffset,
        Math.max(0, window.pageYOffset + delta)
      );
    };

    const finish = () => {
      section.style.display = "none";
      section.classList.remove(CLOSING_CLASS);
      root.classList.add(HIDDEN_CLASS);
      // The class already resolves both variables to 0, the inline values are
      // dropped so the section keeps ownership of its own height.
      clearBarHeight();
      keepAnchorInPlace();

      requestAnimationFrame(() => {
        root.style.scrollBehavior = previousRootScrollBehavior;
        document.body.style.scrollBehavior = previousBodyScrollBehavior;
        root.style.overflowAnchor = previousOverflowAnchor;
      });

      isClosing = false;
      document.dispatchEvent(new CustomEvent(CLOSED_EVENT));
    };

    const duration = getDuration();

    if (!startHeight || !duration) {
      finish();
      return;
    }

    let startTime = null;

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setBarHeight(startHeight * (1 - eased));
      keepAnchorInPlace();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        finish();
      }
    };

    requestAnimationFrame(step);
  };

  // Delegated listener: survives theme editor section re-renders without
  // registering duplicate handlers.
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest?.(CLOSE_BUTTON_SELECTOR);
    if (!closeButton) return;

    const section = closeButton.closest(SECTION_SELECTOR);
    if (!section) return;

    collapse(section);

    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (error) {
      // Storage can be unavailable (private mode, blocked cookies).
    }
  });

  // Bring the bar back when it is re-rendered from the theme editor, otherwise
  // the hidden state would survive the merchant editing the section.
  document.addEventListener("shopify:section:load", (event) => {
    const section = event.target.matches?.(SECTION_SELECTOR)
      ? event.target
      : event.target.querySelector?.(SECTION_SELECTOR);

    if (!section || !section.querySelector(".announcement-bar")) return;

    section.style.display = "";
    section.classList.remove(CLOSING_CLASS);
    root.classList.remove(HIDDEN_CLASS);
    clearBarHeight();
  });
})();
