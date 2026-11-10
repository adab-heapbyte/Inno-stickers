/**
 * Variant media grouping.
 *
 * Shopify allows a single featured image per variant, so a color with several
 * photos cannot be described through the admin alone. Merchants tag the alt
 * text of every color specific media with "#ColorName" and this module shows
 * only the media of the selected color, plus every untagged (shared) media.
 *
 * The gallery is rendered with all of the product media in the DOM, so
 * switching color only toggles visibility and refreshes the existing sliders.
 */
(function () {
  const ROOT_SELECTOR = '[data-alt-media-grouping="true"]';
  const MEDIA_ITEM_SELECTOR = "[data-media-group]";
  const MAIN_SLIDER_SELECTOR = ".product__media-list.swiper";
  const THUMBS_SLIDER_SELECTOR = ".product__media-sublist.swiper";
  const THUMBS_OUTER_SELECTOR = ".product__media-sublist-outer";
  const THUMBS_OUTER_HIDDEN_CLASS =
    "product__media-sublist-outer--variant-hidden";

  const handleize = (value) => {
    if (value === null || value === undefined) return "";

    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const hiddenClassFor = (item) => {
    if (item.classList.contains("product__media-subitem")) {
      return "product__media-subitem--variant-hidden";
    }
    if (item.classList.contains("product-media-modal__item")) {
      return "product-media-modal__item--variant-hidden";
    }
    return "product__media-item--variant-hidden";
  };

  const getRoots = (sectionId) => {
    const selector = sectionId
      ? `${ROOT_SELECTOR}[data-media-grouping-section="${sectionId}"]`
      : ROOT_SELECTOR;

    return document.querySelectorAll(selector);
  };

  const getSelectedVariant = (sectionId) => {
    const variantJson = document.querySelector(
      `#variant-radios-${sectionId} script[data-selected-variant]`
    );
    if (!variantJson) return null;

    try {
      return JSON.parse(variantJson.textContent);
    } catch (error) {
      return null;
    }
  };

  const applyVisibility = (root, selectedGroup) => {
    root.querySelectorAll(MEDIA_ITEM_SELECTOR).forEach((item) => {
      const group = item.dataset.mediaGroup;
      const isVisible = !group || group === selectedGroup;

      item.classList.toggle(hiddenClassFor(item), !isVisible);

      // Swiper only counts children carrying the slide class, so a hidden item
      // has to stop being a slide while it stays inside the wrapper.
      if (item.dataset.mediaSlide === "true") {
        item.classList.toggle("swiper-slide", isVisible);
      }
    });
  };

  const isHiddenItem = (item) => item.classList.contains(hiddenClassFor(item));

  const isFeaturedItem = (item, featuredMediaId) => {
    if (!featuredMediaId) return false;

    const mediaId =
      item.dataset.mediaId ||
      item.dataset.mediaSubId ||
      item.dataset.mediaModalId ||
      "";

    return mediaId.endsWith(`-${featuredMediaId}`);
  };

  // The order the media was rendered in is stamped by Liquid. It cannot be read
  // back from the DOM, because a slider rearranges the slides it owns.
  const stampOrder = (items) => {
    items.forEach((item, index) => {
      if (item.dataset.mediaOrder === undefined) {
        item.dataset.mediaOrder = index;
      }
    });
  };

  const byRenderedOrder = (a, b) =>
    Number(a.dataset.mediaOrder) - Number(b.dataset.mediaOrder);

  const mediaChildrenOf = (element) =>
    Array.prototype.filter.call(element.children, (child) =>
      child.matches(MEDIA_ITEM_SELECTOR)
    );

  /**
   * Keeps the slides of a slider the only children of its wrapper, in the order
   * the media was rendered in, and parks the hidden media next to the wrapper.
   *
   * Swiper resolves a slide to its index by counting DOM siblings rather than by
   * looking it up in its slide list, so it is only right while the slides are
   * the wrapper's only children. A hidden media left between two slides shifts
   * every index behind it, and loop mode then resolves a preview click to the
   * wrong slide, or to no slide at all.
   *
   * The order has to stay the rendered one: the thumbs are matched to the main
   * slides by position, so the two must agree.
   */
  const reflowSliderMedia = (wrapper) => {
    const host = wrapper.parentElement;
    if (!host) return;

    const items = Array.prototype.filter.call(
      host.querySelectorAll(MEDIA_ITEM_SELECTOR),
      (item) => item.parentElement === wrapper || item.parentElement === host
    );
    if (items.length === 0) return;

    stampOrder(items);

    const visible = items.filter((item) => !isHiddenItem(item));
    visible.sort(byRenderedOrder);

    const current = mediaChildrenOf(wrapper);
    const settled =
      current.length === visible.length &&
      current.every((item, index) => item === visible[index]);

    if (!settled) {
      visible.forEach((item) => wrapper.appendChild(item));
    }

    items.forEach((item) => {
      if (isHiddenItem(item) && item.parentElement !== host) {
        host.appendChild(item);
      }
    });
  };

  /**
   * The static galleries are laid out through structural selectors
   * (:first-child, :nth-child(2), :last-of-type), which keep counting the media
   * that grouping hides: the two column gallery would leave its sticky first
   * column empty. Leading with the media of the selected variant and pushing the
   * hidden media to the end makes those rules match what is on screen.
   */
  const reorderMedia = (container, featuredMediaId) => {
    const items = mediaChildrenOf(container);
    if (items.length < 2) return;

    stampOrder(items);

    const rank = (item) => {
      if (isHiddenItem(item)) return 2;
      return isFeaturedItem(item, featuredMediaId) ? 0 : 1;
    };

    const sorted = items
      .slice()
      .sort((a, b) => rank(a) - rank(b) || byRenderedOrder(a, b));

    if (sorted.every((item, index) => item === items[index])) return;

    const anchor = document.createComment("");
    container.insertBefore(anchor, items[0]);
    sorted.forEach((item) => container.insertBefore(item, anchor));
    container.removeChild(anchor);
  };

  const reorderAllMedia = (root, featuredMediaId) => {
    const containers = new Set();

    root.querySelectorAll(MEDIA_ITEM_SELECTOR).forEach((item) => {
      if (item.parentElement) containers.add(item.parentElement);
    });

    containers.forEach((container) => {
      if (container.classList.contains("swiper-wrapper")) {
        reflowSliderMedia(container);
      } else if (!container.querySelector(".swiper-wrapper")) {
        reorderMedia(container, featuredMediaId);
      }
      // Anything holding a wrapper only holds parked media, handled above.
    });
  };

  /**
   * Takes a loop apart before the set of slides changes. Loop mode reorders the
   * slides it owns and stamps each one with the real index that slideToLoop and
   * the thumbs resolve clicks through. Both survive a filter pass as stale
   * values, which leaves every preview click pointing at nothing.
   */
  const teardownLoop = (sliderElem) => {
    const slider = sliderElem && sliderElem.swiper;
    if (!slider || slider.destroyed) return;
    if (!slider.params.loop || typeof slider.loopDestroy !== "function") return;

    slider.loopDestroy();
  };

  /**
   * Refreshes a slider in place. Destroying and recreating it would reset the
   * gallery layout (thumbs position, slider direction, heights).
   */
  const refreshSlider = (sliderElem) => {
    const slider = sliderElem && sliderElem.swiper;
    if (!slider || slider.destroyed) return null;

    const wasVertical = slider.isVertical();

    // Adding and removing the slide class changes which children are slides,
    // and the update methods do not rebuild that list: they measure the DOM but
    // leave slider.slides untouched. A stale list keeps the thumbs mapped to the
    // wrong main slides, and a thumb that just became visible is not recognised
    // as a slide at all, so clicking it does nothing.
    if (typeof slider.recalcSlides === "function") {
      slider.recalcSlides();
    }

    // Same rebuild order Swiper itself uses when slides are added or removed.
    if (slider.params.loop && typeof slider.loopCreate === "function") {
      slider.loopCreate();
    }

    slider.updateSize();
    slider.updateSlides();
    slider.updateProgress();
    slider.updateSlidesClasses();
    slider.update();

    if (slider.isVertical() !== wasVertical) {
      slider.changeDirection(wasVertical ? "vertical" : "horizontal", false);
    }

    return slider;
  };

  const slideToVariantMedia = (root, slider, sectionId, variant) => {
    if (!slider || !slider.slides || slider.slides.length === 0) return;

    let featuredSlide = null;

    if (variant && variant.featured_media) {
      featuredSlide = root.querySelector(
        `[data-media-id="${sectionId}-${variant.featured_media.id}"]`
      );
    }

    // A looping slider is addressed through the real index it stamps on each
    // slide, not through the position of the slide in the wrapper.
    if (slider.params.loop && typeof slider.slideToLoop === "function") {
      const realIndex = featuredSlide
        ? parseInt(featuredSlide.getAttribute("data-swiper-slide-index"), 10)
        : NaN;

      slider.slideToLoop(isNaN(realIndex) ? 0 : realIndex, 0);
      return;
    }

    const index = featuredSlide
      ? Array.prototype.indexOf.call(slider.slides, featuredSlide)
      : -1;

    slider.slideTo(index > -1 ? index : 0, 0);
  };

  const updateThumbsVisibility = (root) => {
    root.querySelectorAll(THUMBS_OUTER_SELECTOR).forEach((thumbsOuter) => {
      const visibleThumbs = thumbsOuter.querySelectorAll(
        ".product__media-subitem:not(.product__media-subitem--variant-hidden)"
      ).length;

      thumbsOuter.classList.toggle(
        THUMBS_OUTER_HIDDEN_CLASS,
        visibleThumbs <= 1
      );
    });
  };

  /**
   * Keeps the media counter of the two column gallery in sync. The counter is
   * rendered inside a media item, so it has to follow the media that stays
   * visible for the selected color.
   */
  const updateMediaCounter = (root) => {
    const list = root.querySelector(".product__media-list");
    if (!list) return;

    const counter = list.querySelector(".image_number");
    if (!counter) return;

    const visibleItems = list.querySelectorAll(
      ".product__media-item:not(.product__media-item--variant-hidden)"
    );
    if (visibleItems.length === 0) return;

    const host = counter.closest(".product__media-item");
    if (
      host &&
      host.classList.contains("product__media-item--variant-hidden")
    ) {
      visibleItems[0].appendChild(counter);
    }

    const totalElem = counter.querySelector("span:last-child");
    if (totalElem) {
      const total = visibleItems.length;
      totalElem.textContent = total > 9 ? `${total}` : `0${total}`;
    }
  };

  const updateRoot = (root, variant) => {
    const optionPosition = parseInt(root.dataset.groupOptionPosition, 10);
    if (!optionPosition) return;

    const optionValue =
      variant && variant.options ? variant.options[optionPosition - 1] : null;
    const selectedGroup = handleize(optionValue);
    if (!selectedGroup) return;

    const sectionId = root.dataset.mediaGroupingSection;
    const featuredMediaId = variant.featured_media
      ? variant.featured_media.id
      : null;

    const thumbsElem = root.querySelector(THUMBS_SLIDER_SELECTOR);
    const mainElem = root.querySelector(MAIN_SLIDER_SELECTOR);

    // The loop has to come apart before the slide set changes and go back
    // together after, otherwise it keeps addressing slides that are no longer
    // there.
    teardownLoop(thumbsElem);
    teardownLoop(mainElem);

    applyVisibility(root, selectedGroup);
    reorderAllMedia(root, featuredMediaId);
    updateThumbsVisibility(root);
    updateMediaCounter(root);

    // Thumbs first: the main slider reads its slide count through the thumbs module.
    refreshSlider(thumbsElem);
    const mainSlider = refreshSlider(mainElem);

    slideToVariantMedia(root, mainSlider, sectionId, variant);

    if (typeof window.forceUpdateSwiperHeight === "function") {
      window.forceUpdateSwiperHeight();
    }
  };

  /**
   * Shows every media of the color carried by the given variant.
   *
   * @param {String} sectionId - Section the gallery belongs to.
   * @param {Object} variant - Selected variant, as rendered in the variant JSON.
   */
  window.updateVariantMediaDisplay = (sectionId, variant) => {
    if (!variant) return;

    getRoots(sectionId).forEach((root) => updateRoot(root, variant));
  };

  const init = () => {
    getRoots().forEach((root) => {
      const variant = getSelectedVariant(root.dataset.mediaGroupingSection);
      if (variant) updateRoot(root, variant);
    });
  };

  // The script is deferred, so the gallery is already parsed and the sliders are
  // already built here. Filtering right away keeps the first paint correct
  // instead of reordering the media once the document is ready.
  init();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  }

  document.addEventListener("shopify:section:load", init);
})();
