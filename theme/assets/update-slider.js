(function () {
  function swiperInit() {
    subSliderInit(true);
    sliderInit(true);
    popupSliderInit(true);

    const mainProductSection = document.querySelector(".main-product-section");
    if (mainProductSection?.dataset?.mainProductDifferentGallery === "true") {
      window.__mainProductDifferentGallery = true;

      subSliderInit(true, ".js-media-mobile-list", ".js-media-mobile-sublist");
      sliderInit(true, ".js-media-mobile-list", ".js-media-mobile-sublist");
    }
  }

  document.addEventListener("shopify:section:load", function (e) {
    if (!window?.isSwiperInit) {
      swiperInit();
    }
  });

  document.addEventListener(
    "shopify:section:load",
    function () {
      swiperInit();
    },
    { once: true }
  );

  if (!window?.isSwiperInit) {
    swiperInit();
  }

  // This file is loaded from both the main-product.liquid and featured-product.liquid files
  // and is called twice. To avoid the variable being initialized and the slider being
  // instantiated multiple times, need to implement a isSwiperInit variable to prevent double initialization
  window.isSwiperInit = true;
})();
