if (typeof loadeMoreSlider_G === "undefined") {
  globalThis.loadeMoreSlider_G = null;
}

(function () {
  const HIDDEN_BULLET_CLASS = "product-pagination__bullet--hidden";

  // Keeps only `limit` bullets visible, as a window that follows the active slide.
  // The hidden class only takes effect below the desktop breakpoint (see component-card.scss).
  const limitBullets = (swiper, limit) => {
    const bullets = swiper.pagination?.bullets;
    if (!bullets || !bullets.length) return;

    const total = bullets.length;
    const active = swiper.realIndex || 0;
    const start = Math.min(
      Math.max(active - Math.floor(limit / 2), 0),
      Math.max(total - limit, 0)
    );
    const end = start + limit;

    bullets.forEach((bullet, index) => {
      bullet.classList.toggle(HIDDEN_BULLET_CLASS, index < start || index >= end);
    });
  };

  // Shared entry point for every product card slider (load more, facets, recommendations, linked products).
  // Pass `root` to limit initialization to a specific container.
  const initSlider = (root = document) => {
    const sliders = (root || document).querySelectorAll(".product-card-js");
    const dir = document.querySelector("html").getAttribute("dir");

    let nextEl = ".product-button-group .swiper-button-next";
    let prevEl = ".product-button-group .swiper-button-prev";
    if (dir === "rtl") {
      [nextEl, prevEl] = [prevEl, nextEl];
    }
    sliders.forEach((slider, index) => {
      if (slider?.swiper) return;

      const slideCount = slider.querySelectorAll(".swiper-slide").length;
      const speed = slideCount > 30 ? 0 : 800;
      const bulletsLimit = parseInt(slider.dataset.mobileBulletsLimit, 10);
      const on = {};

      if (bulletsLimit > 0 && slideCount > bulletsLimit) {
        on.paginationRender = (swiper) => limitBullets(swiper, bulletsLimit);
        on.paginationUpdate = (swiper) => limitBullets(swiper, bulletsLimit);
      }

      const productSlider = new Swiper(slider, {
        on: on,
        speed: speed,
        pagination: {
          el: ".product-pagination .swiper-pagination",
          clickable: true,
        },
        navigation: {
          nextEl: nextEl,
          prevEl: prevEl,
        },
        allowTouchMove: true,
        990: {
          allowTouchMove: false,
        },
      });
    });
  };

  initSlider();
  loadeMoreSlider_G = initSlider;

  document.addEventListener("shopify:section:load", function () {
    initSlider();
  });
})();
