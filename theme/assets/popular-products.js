(function () {
  const popularProductsSlider = () => {
    const sliders = Array.from(
      document.querySelectorAll(".popular-products__swiper-container")
    );
    if (sliders.length === 0) return;

    sliders.forEach((slider) => {
      const swiperEl = slider.querySelector(".swiper");
      if (!swiperEl || swiperEl.swiper) return;

      const sectionId = slider.dataset.id;
      const autoplay = toBoolean(slider.dataset.autoplay);
      const enableNavigation = toBoolean(slider.dataset.navigation);
      const enableLoop = toBoolean(slider.dataset.loop);
      const productsToShow = parseInt(slider.dataset.products, 10) || 4;

      let autoplayParam = {};
      if (autoplay) {
        autoplayParam = {
          autoplay: {
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
        };
      }

      let navigationParam = {};
      if (enableNavigation) {
        navigationParam = {
          navigation: {
            nextEl: `#${sectionId} .popular-products__btn-next`,
            prevEl: `#${sectionId} .popular-products__btn-prev`,
          },
        };
      }

      new Swiper(swiperEl, {
        loop: enableLoop,
        longSwipesRatio: 0.1,
        slidesPerView: 1.2,
        spaceBetween: 16,
        ...autoplayParam,
        ...navigationParam,
        breakpoints: {
          750: {
            slidesPerView: 2.2,
            spaceBetween: 24,
          },
          1100: {
            slidesPerView: productsToShow + 0.4,
            spaceBetween: 24,
          },
        },
      });
    });
  };

  function toBoolean(string) {
    return string === "true";
  }

  document.addEventListener("DOMContentLoaded", function () {
    popularProductsSlider();
    document.addEventListener("shopify:section:load", function () {
      popularProductsSlider();
    });
  });
})();
