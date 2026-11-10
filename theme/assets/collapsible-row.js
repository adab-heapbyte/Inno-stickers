(function () {
  const initProductAccordion = () => {
    $(".product-collapsible-row__title")
      .off("click")
      .on("click", function () {
        if (!$(this).hasClass("active")) {
          $(".product-collapsible-row__title.active").removeClass("active");
          $(this).addClass("active");
          $(".product-collapsible-row__description").stop().slideUp(300);
          $(this)
            .siblings(".product-collapsible-row__description")
            .eq($(this).index())
            .stop()
            .slideDown(300);

          const autoNavigation = $(this).data("autoNavigation");
          if (autoNavigation && window.innerWidth < 990) {
            setTimeout(() => {
              const $headerWrapper = $(".header-wrapper");
              const headerWrapper = $headerWrapper.length
                ? $headerWrapper.height()
                : 0;

              const $sectionAnnouncement = $(".section-announcement");
              const sectionAnnouncement = $sectionAnnouncement.length
                ? $sectionAnnouncement.height()
                : 0;
              const $countdownTimerBar = $(".countdown-timer-bar");
              const countdownTimerBar = $countdownTimerBar.length
                ? $countdownTimerBar.height()
                : 0;

              const position =
                $(this).offset().top -
                headerWrapper -
                sectionAnnouncement -
                countdownTimerBar;

              window.scrollTo({
                top: position,
                behavior: "smooth",
              });
            }, 400);
          }
        } else {
          $(this).removeClass("active");
          $(this)
            .siblings(".product-collapsible-row__description")
            .stop()
            .slideUp(300);
        }
      });
  };

  document.addEventListener("shopify:section:load", function () {
    initProductAccordion();
  });

  initProductAccordion();
})();
