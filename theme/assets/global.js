const sliderInit = (
  isUpdate,
  mainSelector = ".js-media-list",
  subSelector = ".js-media-sublist"
) => {
  if (
    document.querySelectorAll(mainSelector) &&
    document.querySelectorAll(mainSelector).length > 0
  ) {
    document.querySelectorAll(mainSelector).forEach((elem, index) => {
      const direction = elem.dataset.direction;
      const galleryType = elem.dataset.galleryType;
      const sliderLoop = elem.dataset.sliderLoop === "true";

      let mousewheel = true;
      let mousewheelForceToAxis = direction == "horizontal";

      const directionDesc = elem.dataset.direction_desc;
      const sliderType = elem.dataset.sliderType;
      const enableVideoAutoplay = elem.dataset.enableVideoAutoplay === "true";

      let mousewheel_desc = true;
      let mousewheelForceToAxisDesc = directionDesc == "horizontal";

      let defaultConfigs = {
        slidesPerView: 1,
        spaceBetween: 0,
      };
      if (galleryType == "full_horizontal_slider") {
        const mobileShowNextPreview =
          elem.dataset.mobileShowNextPreview === "true";
        defaultConfigs = {
          slidesPerView:
            window.innerWidth < 750 ? (mobileShowNextPreview ? 1.1 : 1) : 1.1,
          spaceBetween: 10,
        };
      }

      let slider = new Swiper(elem, {
        ...defaultConfigs,
        autoHeight: true,
        mousewheel: {
          enabled: mousewheel,
          forceToAxis: mousewheelForceToAxis,
        },
        direction: direction,
        speed: 500,
        noSwiping: true,
        noSwipingSelector: "model-viewer:not(.shopify-model-viewer-ui__disabled)",
        loop: sliderLoop,
        // Release touch to the page at the first/last slide so vertical swiping doesn't trap page scroll on mobile
        touchReleaseOnEdges: direction === "vertical",
        //observeParents: true,
        //freeMode: {
        //	enabled: !!elem
        //		.closest(".product__outer")
        //		.classList.contains("product__outer--multiple-top"),
        //	sticky: true,
        //},
        breakpoints: {
          750: {
            mousewheel: {
              enabled: mousewheel_desc,
              forceToAxis: mousewheelForceToAxisDesc,
            },
            direction: directionDesc,
            touchReleaseOnEdges: false,
          },
        },
        navigation: {
          nextEl: ".product .product__slider-nav .swiper-button-next",
          prevEl: ".product .product__slider-nav .swiper-button-prev",
        },
        pagination: {
          el: ".product .product__pagination",
          type: "bullets",
          clickable: true,
        },
        thumbs: {
          swiper: elem.nextElementSibling.querySelector(subSelector)
            ? elem.nextElementSibling.querySelector(subSelector).swiper
            : "",
        },
        on: {
          //afterInit: function (swiper) {
          //	if (document.querySelector(".product__outer--multiple-top")) {
          //		document
          //			.querySelectorAll(".product__media-toggle")
          //			.forEach((elem, index) => {
          //				elem.addEventListener("click", (e) => {
          //					var target = e.currentTarget;

          //					if (
          //						document.querySelector(".js-popup-slider") &&
          //						document.querySelector(".js-popup-slider").swiper
          //					) {
          //						document
          //							.querySelector(".js-popup-slider")
          //							.swiper.slideTo(index);
          //					}
          //				});
          //			});
          //	}
          //},
          slideChangeTransitionStart: function () {
            if (document.querySelector(subSelector)) {
              document
                .querySelector(subSelector)
                .swiper.slideTo(
                  document.querySelector(mainSelector).swiper.activeIndex
                );
            }
          },
          slideChange: function () {
            window.pauseAllMedia();

            //if (
            //	document.querySelector(".js-popup-slider") &&
            //	document.querySelector(".js-popup-slider").swiper &&
            //	!document.querySelector(".product__outer--multiple-top")
            //) {
            //	document
            //		.querySelector(".js-popup-slider")
            //		.swiper.slideTo(this.activeIndex);
            //}
          },
          slideChangeTransitionEnd: function () {
            if (this.slides[this.activeIndex].querySelector("model-viewer")) {
              this.slides[this.activeIndex]
                .querySelector(".shopify-model-viewer-ui__button--poster")
                .removeAttribute("hidden");
            }

            if (enableVideoAutoplay) {
              window.playMedia(this.slides[this.activeIndex]);
            }
          },
        },
      });

      //if (sliderType === "main-product") {
      //	optimizingVisibleSliderElements(
      //		elem,
      //		".product__media-item.swiper-slide"
      //	);
      //}

      if (isUpdate) {
        setTimeout(function () {
          slider.update();
        }, 400);
      }
    });
  }
};

function getSliderSelector() {
  let selector = ".js-media-list";
  if (window.__mainProductDifferentGallery) {
    if (window.innerWidth < 750) {
      selector = ".main-product-mobile-section-wrapper .js-media-mobile-list";
    } else {
      selector = ".main-product-desktop-section-wrapper .js-media-list";
    }
  }

  return selector;
}

function reinitSlider() {
  const isMobile = !!document.querySelector(".js-media-mobile-list");
  if (isMobile) {
    subSliderInit(true, ".js-media-mobile-list", ".js-media-mobile-sublist");
    sliderInit(true, ".js-media-mobile-list", ".js-media-mobile-sublist");
  }

  subSliderInit(true);
  sliderInit(true);
  autoplayStaticGalleryVideo();
}

//function forceUpdateSwiperHeight(slider) {
//	const activeSlide = slider.slides[slider.activeIndex];
//	if (activeSlide) {
//		const height = activeSlide.querySelector(".product__media").offsetHeight;

//		slider.el.style.height = height + "px";
//		slider.wrapperEl.style.height = height + "px";
//	}
//}

function forceUpdateSwiperHeight() {
  const sliderSelector = getSliderSelector();
  const sliders = document.querySelectorAll(sliderSelector);

  sliders.forEach((sliderEl) => {
    const swiperInstance = sliderEl.swiper;

    if (swiperInstance && swiperInstance.slides) {
      const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
      if (activeSlide) {
        const media = activeSlide.querySelector(".product__media");

        if (media) {
          const height = media.offsetHeight;
          swiperInstance.wrapperEl.style.height = height + "px";
        }
      }
    }
  });
}

window.addEventListener("resize", () => {
  setTimeout(function () {
    forceUpdateSwiperHeight();
    autoplayStaticGalleryVideo();
  }, 100);
});

const subSliderInit = (
  isUpdate,
  mainSelector = ".js-media-list",
  subSelector = ".js-media-sublist"
) => {
  if (
    document.querySelectorAll(subSelector) &&
    document.querySelectorAll(subSelector).length > 0
  ) {
    document.querySelectorAll(subSelector).forEach((elem, index) => {
      if (index >= 1) return;

      const direction = elem.dataset.direction;
      const sliderType = elem.dataset.sliderType;

      let subSlider = new Swiper(elem, {
        slidesPerView: "auto",
        direction: direction,
        freeMode: false,
        watchSlidesProgress: true,
        watchSlidesVisibility: true,
        autoHeight: true,
        //loop: false,
        //observeParents: true,
        on: {
          afterInit: function () {
            //this.params.slidesPerView = this.slides.length === 2 ? 2 : 3;
          },
          touchEnd: function (s, e) {
            let range = 5;
            let diff = (s.touches.diff = s.isHorizontal()
              ? s.touches.currentX - s.touches.startX
              : s.touches.currentY - s.touches.startY);
            if (diff < range && diff > -range) s.allowClick = true;
          },
        },
        //transitionStart: function () {
        //	document
        //		.querySelector(".js-media-list")
        //		.swiper.slideTo(
        //			document.querySelector(".js-media-sublist").swiper.activeIndex,
        //		);
        //},
        //breakpoints: {
        //	576: {
        //		direction: "vertical",
        //		slidesPerView: "auto",
        //	},
        //},
      });

      const sliderResizeObserve = new ResizeObserver((entries) => {
        const [entry] = entries;
        setTimeout(() => {
          const sliders = document.querySelectorAll(mainSelector);
          const thumbs = document.querySelectorAll(".product__media-sublist");
          if (sliders.length > 0 && thumbs.length > 0) {
            if (index >= 0 && index < sliders.length) {
              const sliderHeight =
                sliders[index].getBoundingClientRect().height;
              thumbs.forEach((thumb, idx) => {
                if (thumb.parentNode.parentNode === sliders[index].parentNode) {
                  thumb.style.maxHeight = `${sliderHeight - 1}px`;
                }
              });
            }
          }
        }, 400);
      });

      if (document.querySelector(".product-section"))
        sliderResizeObserve.observe(document.querySelector(".product-section"));

      //if (sliderType === "sub-product") {
      //	optimizingVisibleSliderElements(
      //		elem,
      //		".product__media-subitem.swiper-slide"
      //	);
      //}

      if (isUpdate) {
        setTimeout(function () {
          subSlider.update();
        }, 800);
      }
    });
  }
};

function optimizingVisibleSliderElements(sliderElement, sliderItemClass) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.visibility = "visible";
        } else {
          entry.target.style.visibility = "hidden";
        }
      });
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 0.5,
    }
  );

  sliderElement.querySelectorAll(sliderItemClass).forEach((slide) => {
    observer.observe(slide);
  });
}

const quickAddsliderInit = (isUpdate) => {
  const sliderSelector = getSliderSelector();

  if (
    document.querySelectorAll(sliderSelector) &&
    document.querySelectorAll(sliderSelector).length > 0
  ) {
    document.querySelectorAll(sliderSelector).forEach((elem, index) => {
      let slider = new Swiper(elem, {
        slidesPerView: 1,
        spaceBetween: 0,
        autoHeight: true,
        speed: 500,
        direction: "horizontal",
        noSwiping: true,
        noSwipingSelector: "model-viewer:not(.shopify-model-viewer-ui__disabled)",
        navigation: {
          nextEl: ".product .product__slider-nav .swiper-button-next",
          prevEl: ".product .product__slider-nav .swiper-button-prev",
        },
        pagination: {
          el: ".product .product__pagination",
          type: "bullets",
          clickable: true,
        },
        on: {
          // afterInit: function (swiper) {
          // 	if (document.querySelector(".product__outer--multiple-top")) {
          // 		document
          // 			.querySelectorAll(".product__media-toggle")
          // 			.forEach((elem, index) => {
          // 				elem.addEventListener("click", (e) => {
          // 					var target = e.currentTarget;

          // 					if (
          // 						document.querySelector(".js-popup-slider") &&
          // 						document.querySelector(".js-popup-slider").swiper
          // 					) {
          // 						document
          // 							.querySelector(".js-popup-slider")
          // 							.swiper.slideTo(index);
          // 					}
          // 				});
          // 			});
          // 	}
          // },
          // slideChangeTransitionStart: function () {
          // 	if (document.querySelector(".js-media-sublist")) {
          // 		document
          // 			.querySelector(".js-media-sublist")
          // 			.swiper.slideTo(
          // 				document.querySelector(".js-media-list").swiper.activeIndex,
          // 			);
          // 	}
          // },
          slideChange: function () {
            window.pauseAllMedia();

            // if (
            // 	document.querySelector(".js-popup-slider") &&
            // 	document.querySelector(".js-popup-slider").swiper &&
            // 	!document.querySelector(".product__outer--multiple-top")
            // ) {
            // 	document
            // 		.querySelector(".js-popup-slider")
            // 		.swiper.slideTo(this.activeIndex);
            // }
          },
          slideChangeTransitionEnd: function () {
            if (this.slides[this.activeIndex].querySelector("model-viewer")) {
              this.slides[this.activeIndex]
                .querySelector(".shopify-model-viewer-ui__button--poster")
                .removeAttribute("hidden");
            }
          },
        },
      });

      if (isUpdate) {
        setTimeout(function () {
          slider.update();
        }, 800);
      }
    });
  }
};

const popupSliderInit = (isUpdate) => {
  if (document.querySelector(".js-popup-slider")) {
    //let popupSlider = new Swiper(document.querySelector(".js-popup-slider"), {
    //	slidesPerView: 1,
    //	//navigation: {
    //	//	nextEl: ".product-media-modal .product__slider-nav .swiper-button-next",
    //	//	prevEl: ".product-media-modal .product__slider-nav .swiper-button-prev",
    //	//},
    //	//pagination: {
    //	//	el: ".product-media-modal .product__pagination",
    //	//	type: "bullets",
    //	//	clickable: true,
    //	//},
    //	on: {
    //		afterInit: function () {
    //			if (
    //				document.querySelector(
    //					".product__outer--static-multicolumns-aside"
    //				) ||
    //				document.querySelector(".product__outer--static-column-aside")
    //			) {
    //				document
    //					.querySelectorAll(".product__media-list .product__media-toggle")
    //					.forEach((elem, index) => {
    //						elem.addEventListener("click", (e) => {
    //							if (
    //								document.querySelector(".js-popup-slider") &&
    //								document.querySelector(".js-popup-slider").swiper
    //							) {
    //								document
    //									.querySelector(".js-popup-slider")
    //									.swiper.slideTo(index);
    //							}
    //						});
    //					});
    //			}
    //		},
    //		slideChange: function () {
    //			window.pauseAllMedia();
    //			this.params.noSwiping = false;
    //			document
    //				.querySelector(".product-media-modal__content")
    //				.classList.remove("zoom");
    //		},
    //		touchMove: function () {
    //			document
    //				.querySelector(".product-media-modal__content")
    //				.classList.remove("zoom");
    //		},
    //		slideChangeTransitionEnd: function () {
    //			if (this.slides[this.activeIndex].querySelector("model-viewer")) {
    //				this.slides[this.activeIndex]
    //					.querySelector(".shopify-model-viewer-ui__button--poster")
    //					.removeAttribute("hidden");
    //			}
    //		},
    //		touchStart: function () {
    //			if (this.slides[this.activeIndex].querySelector("model-viewer")) {
    //				if (
    //					!this.slides[this.activeIndex]
    //						.querySelector("model-viewer")
    //						.classList.contains("shopify-model-viewer-ui__disabled")
    //				) {
    //					this.params.noSwiping = true;
    //					this.params.noSwipingClass = "swiper-slide";
    //				} else {
    //					this.params.noSwiping = false;
    //				}
    //			}
    //		},
    //	},
    //});

    if (isUpdate) {
      setTimeout(function () {
        //popupSlider.update();
      }, 800);
    }
  }
};

(function () {
  const sidebar = () => {
    let pageNav = $(".product__media-sublist__sidebar-nav");

    if (pageNav.length > 0) {
      let pageNavList = pageNav.find("a");
      let adminBarHeight = 0;

      let headings = [];
      for (let i = 0; i < pageNavList.length; i++) {
        headings[i] = $($(pageNavList[i]).attr("href"));
      }

      $(pageNavList[0]).parent().addClass("active");

      pageNavList.on("click", function (e) {
        e.preventDefault();

        const targetId = $(this).attr("href");
        const targetElement = $(targetId);

        if (targetElement.length) {
          $(".product-media-modal__dialog").animate(
            {
              scrollTop:
                targetElement.position().top +
                $(".product-media-modal__dialog").scrollTop(),
            },
            100
          );
        }
      });

      $(".product-media-modal__dialog").on("scroll", function () {
        for (let i = headings.length - 1; i >= 0; i--) {
          if ($(headings[i]).length > 0) {
            if (
              $(headings[i]).offset().top - 50 <=
              $(window).scrollTop() + adminBarHeight
            ) {
              if (!$(pageNavList[i]).parent().hasClass("active")) {
                let hasActiveItem = false;
                for (let j = i; j < headings.length; j++) {
                  if ($(pageNavList[j]).parent().hasClass("active")) {
                    hasActiveItem = true;
                  }
                }

                if (!hasActiveItem) {
                  $(pageNavList[i]).parent().addClass("active");
                }
              } else {
                for (let j = 0; j < i; j++) {
                  $(pageNavList[j]).parent().removeClass("active");
                }
              }
            } else {
              if (i !== 0) {
                $(pageNavList[i]).parent().removeClass("active");
              }
            }
          }
        }
      });
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    sidebar();
    document.addEventListener("shopify:section:load", function () {
      sidebar();
    });
  });
})();

if (navigator.userAgent.indexOf("iPhone") > -1) {
  document
    .querySelector("[name=viewport]")
    .setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1"
    );
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute("role", "button");
  summary.setAttribute("aria-expanded", "false");

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute(
      "aria-expanded",
      !event.currentTarget.closest("details").hasAttribute("open")
    );
  });

  if (summary.closest("header-drawer")) return;
  summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus && elementToFocus.focus();
}

function pauseAllMedia() {
  const mediaScopes = [
    ".product__media-list",
    ".product-media-modal__content",
    ".product-media-modal__dialog",
  ];

  const buildScopedSelector = (selector) =>
    mediaScopes.map((scope) => `${scope} ${selector}`).join(", ");

  document
    .querySelectorAll(buildScopedSelector(".js-youtube"))
    .forEach((video) => {
      video.contentWindow.postMessage(
        '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
        "*"
      );
    });
  document
    .querySelectorAll(buildScopedSelector(".js-vimeo"))
    .forEach((video) => {
      video.contentWindow.postMessage('{"method":"pause"}', "*");
    });
  document
    .querySelectorAll(buildScopedSelector("video"))
    .forEach((video) => video.pause());
  document
    .querySelectorAll(buildScopedSelector("product-model"))
    .forEach((model) => {
      if (model.modelViewerUI) model.modelViewerUI.pause();
    });
}

function isStaticAutoplayGalleryType(galleryType) {
  return [
    "static_multicolumns_aside",
    "static_column_aside",
    "two_column_aside",
  ].includes(galleryType);
}

function isVisibleStaticGallery(listElement) {
  if (
    !listElement ||
    !isStaticAutoplayGalleryType(listElement.dataset.galleryType)
  ) {
    return false;
  }

  const wrapper = listElement.closest(".product__media-wrapper");
  if (!wrapper || wrapper.offsetParent === null) {
    return false;
  }

  if (wrapper.classList.contains("main-product-mobile-section-wrapper")) {
    return window.innerWidth < 750;
  }

  if (wrapper.classList.contains("main-product-desktop-section-wrapper")) {
    return window.innerWidth >= 750;
  }

  return true;
}

function autoplayStaticGalleryVideo() {
  const staticGalleries = Array.from(
    document.querySelectorAll(
      '.product__media-list[data-enable-video-autoplay="true"]'
    )
  ).filter((gallery) => isVisibleStaticGallery(gallery));

  if (!staticGalleries.length) return;

  pauseAllMedia();

  staticGalleries.forEach((gallery) => {
    const firstVideoMedia = gallery.querySelector(
      ".product__media-item deferred-media"
    );

    if (firstVideoMedia) {
      playMedia(firstVideoMedia);
    }
  });
}

document.addEventListener("DOMContentLoaded", autoplayStaticGalleryVideo);

document.addEventListener("shopify:section:load", autoplayStaticGalleryVideo);

function playMedia(media) {
  if (!media) return;

  const mediaTarget = media.matches?.(
    "deferred-media, video, product-model, iframe, model-viewer"
  )
    ? media
    : media.querySelector?.(
        "deferred-media, video, product-model, iframe, model-viewer"
      );

  if (!mediaTarget) return;

  if (mediaTarget.tagName === "DEFERRED-MEDIA") {
    if (
      !mediaTarget.hasAttribute("loaded") &&
      typeof mediaTarget.loadContent === "function"
    ) {
      mediaTarget.loadContent();
    }

    return playMedia(
      mediaTarget.querySelector("video, product-model, iframe, model-viewer")
    );
  }

  const playableMedia =
    mediaTarget.tagName === "MODEL-VIEWER"
      ? mediaTarget.closest("product-model")
      : mediaTarget;

  if (!playableMedia) return;
  // YouTube iframe
  if (playableMedia.classList.contains("js-youtube")) {
    playableMedia.contentWindow.postMessage(
      '{"event":"command","func":"playVideo","args":""}',
      "*"
    );
  }
  // Vimeo iframe
  else if (playableMedia.classList.contains("js-vimeo")) {
    playableMedia.contentWindow.postMessage('{"method":"play"}', "*");
  }
  // HTML5 video
  else if (playableMedia.tagName === "VIDEO") {
    playableMedia.play()?.catch(() => {});
  }
  // Model Viewer
  else if (playableMedia.tagName === "PRODUCT-MODEL") {
    if (playableMedia.modelViewerUI) {
      playableMedia.modelViewerUI.play();
    }
  }
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus && !elementToFocus.classList.contains("card-focused"))
    elementToFocus.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });

    this.querySelectorAll("button").forEach((button) => {
      this.setMinimumDisable();

      button.addEventListener("click", this.onButtonClick.bind(this));
    });

    var eventList = ["paste", "input"];

    for (event of eventList) {
      this.input.addEventListener(event, function (e) {
        const value = e.currentTarget.value;
        const allowZero = e.currentTarget.dataset.allowZero === "true";
        const minimumValue = parseInt(
          e.currentTarget.getAttribute("min") || e.currentTarget.dataset.min || "1",
          10
        );
        const hasOnlyDigits = /^\d+$/.test(value);

        if (value !== "" && !hasOnlyDigits) {
          e.currentTarget.value = minimumValue;
        } else if (!allowZero && value === "0") {
          e.currentTarget.value = minimumValue;
        }

        const currentValue = parseInt(e.currentTarget.value || `${minimumValue}`, 10);

        if (e.currentTarget.value === "" || currentValue <= minimumValue) {
          this.previousElementSibling.classList.add("disabled");
        } else {
          this.previousElementSibling.classList.remove("disabled");
        }
      });
    }

    this.input.addEventListener("focusout", function (e) {
      if (e.currentTarget.value === "") {
        e.currentTarget.value = e.currentTarget.getAttribute("min") || e.currentTarget.dataset.min || 1;
      }
    });
  }

  setMinimumDisable() {
    const minimumValue = parseInt(
      this.input.getAttribute("min") || this.input.dataset.min || "1",
      10
    );

    if (parseInt(this.input.value || `${minimumValue}`, 10) <= minimumValue) {
      this.querySelector('button[name="minus"]').classList.add("disabled");
    } else {
      this.querySelector('button[name="minus"]').classList.remove("disabled");
    }
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);

    this.setMinimumDisable();
  }
}

customElements.define("quantity-input", QuantityInput);

class AnchoredPopoverComponent extends HTMLElement {
  constructor() {
    super();
    this.trigger = null;
    this.popover = null;
    this.hoverTimeout = null;
    this.interactionDelay = 200;
    this.onTriggerEnter = this.onTriggerEnter.bind(this);
    this.onTriggerLeave = this.onTriggerLeave.bind(this);
    this.onPopoverEnter = this.onPopoverEnter.bind(this);
    this.onPopoverLeave = this.onPopoverLeave.bind(this);
    this.onBeforeToggle = this.onBeforeToggle.bind(this);
    this.onResize = debounce(() => {
      if (this.popover?.matches(":popover-open")) {
        this.popover.hidePopover();
      }
    }, 100);
  }

  connectedCallback() {
    this.trigger = this.querySelector("[data-popover-trigger]");
    this.popover = this.querySelector("[data-popover-content]");

    if (!(this.trigger instanceof EventTarget) || !(this.popover instanceof EventTarget)) return;

    this.popover.addEventListener("beforetoggle", this.onBeforeToggle);

    if (this.dataset.hoverTriggered === "true") {
      this.trigger.addEventListener("pointerenter", this.onTriggerEnter);
      this.trigger.addEventListener("pointerleave", this.onTriggerLeave);
      this.popover.addEventListener("pointerenter", this.onPopoverEnter);
      this.popover.addEventListener("pointerleave", this.onPopoverLeave);
    }

    this.updatePosition();
  }

  disconnectedCallback() {
    const trigger = this.trigger;
    const popover = this.popover;

    if (!(trigger instanceof EventTarget) || !(popover instanceof EventTarget)) return;

    trigger.removeEventListener("pointerenter", this.onTriggerEnter);
    trigger.removeEventListener("pointerleave", this.onTriggerLeave);
    popover.removeEventListener("pointerenter", this.onPopoverEnter);
    popover.removeEventListener("pointerleave", this.onPopoverLeave);
    popover.removeEventListener("beforetoggle", this.onBeforeToggle);
    window.removeEventListener("resize", this.onResize);

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  onBeforeToggle(event) {
    this.updatePosition();

    const method = event.newState === "open" ? "addEventListener" : "removeEventListener";
    window[method]("resize", this.onResize);
  }

  onTriggerEnter() {
    if (!this.popover || this.popover.matches(":popover-open")) return;

    this.trigger.dataset.hoverActive = "true";
    this.hoverTimeout = window.setTimeout(() => {
      if (this.trigger?.dataset.hoverActive === "true") {
        this.updatePosition();
        this.popover.showPopover();
      }
    }, this.interactionDelay);
  }

  onTriggerLeave() {
    delete this.trigger.dataset.hoverActive;

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    if (this.popover?.matches(":popover-open")) {
      this.hoverTimeout = window.setTimeout(() => {
        this.popover?.hidePopover();
      }, this.interactionDelay);
    }
  }

  onPopoverEnter() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  onPopoverLeave() {
    this.hoverTimeout = window.setTimeout(() => {
      this.popover?.hidePopover();
    }, this.interactionDelay);
  }

  updatePosition() {
    if (!this.trigger || !this.popover) return;

    const triggerBounds = this.trigger.getBoundingClientRect();

    this.popover.style.setProperty("--anchor-top", `${triggerBounds.top}`);
    this.popover.style.setProperty("--anchor-bottom", `${triggerBounds.bottom}`);
    this.popover.style.setProperty("--anchor-left", `${triggerBounds.left}`);
    this.popover.style.setProperty("--anchor-right", `${window.innerWidth - triggerBounds.right}`);
    this.popover.style.setProperty("--anchor-height", `${triggerBounds.height}`);
    this.popover.style.setProperty("--anchor-width", `${triggerBounds.width}`);
  }
}

if (!customElements.get("anchored-popover-component")) {
  customElements.define("anchored-popover-component", AnchoredPopoverComponent);
}

class VolumePricingInfo extends HTMLElement {
  constructor() {
    super();
    this.quantityInput = null;
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
  }

  connectedCallback() {
    this.quantityInput =
      this.closest(".cart-item")?.querySelector(".quantity__input") ||
      this.closest(".quick-variant-item__quantity")?.querySelector(
        ".quantity__input"
      ) ||
      null;

    if (!this.quantityInput) return;

    this.quantityInput.addEventListener("input", this.handleQuantityChange);
    this.quantityInput.addEventListener("change", this.handleQuantityChange);
    this.updateActiveTier(parseInt(this.quantityInput.value || "0", 10));
  }

  disconnectedCallback() {
    if (!this.quantityInput) return;

    this.quantityInput.removeEventListener("input", this.handleQuantityChange);
    this.quantityInput.removeEventListener("change", this.handleQuantityChange);
  }

  handleQuantityChange(event) {
    const quantity = parseInt(event.target.value || "0", 10);
    this.updateActiveTier(quantity);
  }

  updateActiveTier(quantity) {
    const rows = this.querySelectorAll(".volume-pricing-info__row[data-quantity]");
    let activeRow = null;

    rows.forEach((row) => {
      row.classList.remove("volume-pricing-info__row--active");

      const rowQuantity = parseInt(row.dataset.quantity || "0", 10);
      if (quantity >= rowQuantity) {
        activeRow = row;
      }
    });

    activeRow?.classList.add("volume-pricing-info__row--active");
  }
}

if (!customElements.get("volume-pricing-info")) {
  customElements.define("volume-pricing-info", VolumePricingInfo);
}

class PricePerItem extends HTMLElement {
  constructor() {
    super();
    this.quantityInput = null;
    this.priceText = null;
    this.priceBreaks = [];
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
    this.handleCartChange = this.handleCartChange.bind(this);
  }

  connectedCallback() {
    this.priceText = this.querySelector("[data-price-per-item-text]");
    this.quantityInput =
      this.closest(".cart-item")?.querySelector(".quantity__input") ||
      this.closest(".product-form__quantity")?.querySelector(".quantity__input") ||
      null;
    this.parsePriceBreaks();

    if (!this.quantityInput || !this.priceText) return;

    this.quantityInput.addEventListener("input", this.handleQuantityChange);
    this.quantityInput.addEventListener("change", this.handleQuantityChange);
    document.addEventListener("cart:change", this.handleCartChange);
    this.updatePriceDisplay(parseInt(this.quantityInput.value || "0", 10));
  }

  disconnectedCallback() {
    if (this.quantityInput) {
      this.quantityInput.removeEventListener("input", this.handleQuantityChange);
      this.quantityInput.removeEventListener("change", this.handleQuantityChange);
    }

    document.removeEventListener("cart:change", this.handleCartChange);
  }

  parsePriceBreaks() {
    this.priceBreaks = [];

    const minQuantity = parseInt(this.dataset.minQuantity || "", 10) || 1;
    if (this.dataset.variantPrice) {
      this.priceBreaks.push({ quantity: minQuantity, price: this.dataset.variantPrice });
    }

    if (this.dataset.priceBreaks) {
      try {
        const breaks = JSON.parse(this.dataset.priceBreaks);
        breaks.forEach(({ quantity, price }) => {
          if (quantity && price) {
            this.priceBreaks.push({ quantity: parseInt(quantity, 10), price });
          }
        });
      } catch (error) {
        console.warn("[price-per-item] Failed to parse price breaks", error);
      }
    }

    this.priceBreaks.sort((a, b) => b.quantity - a.quantity);
  }

  handleQuantityChange(event) {
    this.updatePriceDisplay(this.getCurrentQuantity(event.target));
  }

  handleCartChange(event) {
    const cartItem = this.closest(".cart-item");

    if (cartItem || !this.quantityInput) {
      return;
    }

    const cart = event.detail?.cart;
    const cartQuantity = this.getCartQuantityForVariant(cart);

    this.quantityInput.dataset.cartQuantity = String(cartQuantity);
    this.updatePriceDisplay(this.getCurrentQuantity());
  }

  getCartQuantityForVariant(cart) {
    const variantId = parseInt(this.dataset.variantId || "", 10);

    if (!cart || !Array.isArray(cart.items) || Number.isNaN(variantId)) {
      return 0;
    }

    return cart.items.reduce((totalQuantity, item) => {
      if (item.variant_id === variantId) {
        return totalQuantity + (parseInt(item.quantity || "0", 10) || 0);
      }

      return totalQuantity;
    }, 0);
  }

  getCurrentQuantity(input = this.quantityInput) {
    if (!input) return 1;

    const inputQuantity = parseInt(input.value || "0", 10);
    const safeInputQuantity = Number.isNaN(inputQuantity) || inputQuantity < 1 ? 1 : inputQuantity;

    const cartItem = this.closest(".cart-item");
    if (cartItem) {
      return safeInputQuantity;
    }

    const cartQuantity = parseInt(input.dataset.cartQuantity || "0", 10);
    const safeCartQuantity = Number.isNaN(cartQuantity) ? 0 : cartQuantity;

    return safeCartQuantity + safeInputQuantity;
  }

  updatePriceDisplay(quantity) {
    if (!this.priceText || !this.priceBreaks.length) return;

    const safeQuantity = Number.isNaN(quantity) || quantity < 1 ? 1 : quantity;
    const matchedBreak =
      this.priceBreaks.find((priceBreak) => safeQuantity >= priceBreak.quantity) ||
      this.priceBreaks[this.priceBreaks.length - 1];

    if (!matchedBreak) return;

    this.priceText.textContent = `${this.dataset.atText}${matchedBreak.price}/${this.dataset.eachText}`;
  }
}

if (!customElements.get("price-per-item")) {
  customElements.define("price-per-item", PricePerItem);
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(func, delay) {
  let lastTime = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastTime >= delay) {
      func.apply(this, args);
      lastTime = now;
    }
  };
}

const serializeForm = (form) => {
  const obj = {};
  const formData = new FormData(form);
  for (const key of formData.keys()) {
    obj[key] = formData.get(key);
  }
  return JSON.stringify(obj);
};

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt?.getAttribute("data-provinces");
    var provinces = JSON.parse(raw || "{}");

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");
    const summaryElements = this.querySelectorAll("summary");
    this.addAccessibilityAttributes(summaryElements);

    if (navigator.platform === "iPhone")
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${window.innerHeight}px`
      );

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelectorAll("button").forEach((button) => {
      if (this.querySelector(".toggle-scheme-button") === button) return;
      if (this.querySelector(".header__localization-button") === button) return;
      if (this.querySelector("button.header__localization-button") === button)
        return;
      if (
        this.querySelector("button.header__localization-lang-button") === button
      )
        return;
      button.addEventListener("click", this.onCloseButtonClick.bind(this));
    });
  }

  addAccessibilityAttributes(summaryElements) {
    summaryElements.forEach((element) => {
      element.setAttribute("role", "button");
      element.setAttribute("aria-expanded", false);
      element.setAttribute("aria-controls", element.nextElementSibling.id);
    });
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(this.mainDetailsToggle.querySelector("summary"))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute("open");

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(summaryElement)
        : this.openMenuDrawer(summaryElement);
    } else {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );

      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
      });
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove("menu-opening");
      this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
        details.removeAttribute("open");
        details.classList.remove("menu-opening");
      });
      this.mainDetailsToggle
        .querySelector("summary")
        .setAttribute("aria-expanded", false);
      document.body.classList.remove(
        `overflow-hidden-${this.dataset.breakpoint}`
      );
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
      this.header =
        this.header || document.querySelector(".shopify-section-header");
      const headerWrapper = this.header.querySelector(".header-wrapper");
      const stickyHeaderBackgroundColorScheme =
        headerWrapper?.dataset.backgroundColorScheme || "color-background-1";
      const main = document.querySelector("main");
      if (
        main
          .querySelectorAll(".shopify-section")[0]
          ?.classList.contains("section--has-overlay") &&
        !this.header.classList.contains("animate")
      ) {
        this.header.classList.add(stickyHeaderBackgroundColorScheme, "color-background-2");
        this.header.dataset.headerOverlay = "true";
      }
      if (
        this.header.dataset.headerOverlay === "true" &&
        !this.header.classList.contains("shopify-section-header-sticky")
      ) {
        this.header.classList.add("color-background-2");
      }
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        //if (this.classList.contains("mobile-facets__wrapper"))
        //	this.closeMenuDrawer();
        //else this.closeMenuDrawer(event);
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove("menu-opening");
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header =
      this.header || document.querySelector(".shopify-section-header");
    this.borderOffset =
      this.borderOffset ||
      this.closest(".header-wrapper").classList.contains(
        "header-wrapper--border-bottom"
      )
        ? 1
        : 0;
    document.documentElement.style.setProperty(
      "--header-bottom-position",
      `${parseInt(
        this.header.getBoundingClientRect().bottom - this.borderOffset
      )}px`
    );

    if (
      this.header.classList.contains("color-background-2") &&
      !this.header.classList.contains("shopify-section-header-sticky")
    ) {
      this.header.classList.remove("color-background-2");
    }

    const main = document.querySelector("main");
    if (
      main
        .querySelectorAll(".shopify-section")[0]
        ?.classList.contains("section--has-overlay")
    ) {
      this.header.classList.remove("color-background-2");
    }

    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });

    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }
}

customElements.define("header-drawer", HeaderDrawer);

class SearchModal extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close()
    );
    this.querySelector("#SearchModal-Overlay").addEventListener(
      "click",
      this.close.bind(this)
    );

    this.querySelector("#search-modal-close").addEventListener(
      "click",
      this.close.bind(this)
    );
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    if (document.querySelector("#search-icon-open") != null) {
      const cartLink = document.querySelector("#search-icon-open");
      if (!cartLink) return;

      cartLink.setAttribute("role", "button");
      cartLink.setAttribute("aria-haspopup", "dialog");
      cartLink.addEventListener("click", (event) => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink.addEventListener("keydown", (event) => {
        if (event.code.toUpperCase() === "SPACE") {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    }
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    setTimeout(() => {
      this.classList.add("animate", "active");
    });

    this.addEventListener(
      "transitionend",
      () => {
        const containerToTrapFocusOn = document.getElementById("search-modal");
        const focusElement =
          this.querySelector('.header__search input:not([type="hidden"])') ||
          this.querySelector(".search__main") ||
          this.querySelector(".search__close");
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    if (!isSafari()) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.add("overflow-clip");
    }
  }

  close() {
    this.classList.remove("active");
    removeTrapFocus(this.activeElement);
    if (!isSafari()) {
      document.body.classList.remove("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-clip");
    }

    this.classList.add("hiding");

    setTimeout(() => this.classList.remove("hiding"), 700);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("search-modal", SearchModal);

class accountModal extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close()
    );
    this.querySelector("#accountModal-Overlay").addEventListener(
      "click",
      this.close.bind(this)
    );

    this.querySelector("#account-modal-close").addEventListener(
      "click",
      this.close.bind(this)
    );
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#account-icon-open");
    if (!cartLink) return;

    cartLink.setAttribute("role", "button");
    cartLink.setAttribute("aria-haspopup", "dialog");
    cartLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener("keydown", (event) => {
      if (event.code.toUpperCase() === "SPACE") {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    setTimeout(() => {
      this.classList.add("animate", "active");
    });

    this.addEventListener(
      "transitionend",
      () => {
        const containerToTrapFocusOn = document.getElementById("account-modal");
        const focusElement =
          this.querySelector(".account__main") ||
          this.querySelector(".account__close");
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add("overflow-hidden");
  }

  close() {
    this.classList.remove("active");
    removeTrapFocus(this.activeElement);
    document.body.classList.remove("overflow-hidden");

    this.classList.add("hiding");

    setTimeout(() => this.classList.remove("hiding"), 700);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("account-modal", accountModal);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.init();

    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (
          event.pointerType === "mouse" &&
          !event.target.closest("deferred-media, product-model")
        )
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  init() {
    const closeBtn = this.querySelector('[id^="ModalClose-"]');
    if (closeBtn) {
      const freshBtn = closeBtn.cloneNode(true);
      closeBtn.replaceWith(freshBtn);
      freshBtn.addEventListener("click", this.hide.bind(this, false));
    }

    const modalApplyClose = this.querySelector("#ModalApplyClose");
    if (modalApplyClose) {
      const freshApply = modalApplyClose.cloneNode(true);
      modalApplyClose.replaceWith(freshApply);
      freshApply.addEventListener("click", this.hide.bind(this, false));
    }
  }

  reinit() {
    this.init();
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    //window.pauseAllMedia();
  }

  hide(isProductPage = false) {
    let isOpen = false;

    this.removeAttribute("open");
    this.classList.add("hiding");

    if (!isProductPage) {
      removeTrapFocus(this.openedBy);
    }

    //window.pauseAllMedia();

    document.querySelectorAll("body > quick-add-modal").forEach((el) => {
      if (el.hasAttribute("open")) {
        isOpen = true;
      }
    });

    let CartDrawerNote = document.getElementById("CartDrawer-Note");
    let CartDrawerNoteAppla = document.getElementById("CartDrawer-Note-Applay");

    if (!isOpen) {
      document.body.classList.remove("overflow-hidden");
      document.body.dispatchEvent(new CustomEvent("modalClosed"));

      if (CartDrawerNote) {
        if (CartDrawerNote.value.trim() !== "") {
          CartDrawerNoteAppla.classList.add("show");
        } else {
          CartDrawerNoteAppla.classList.remove("show");
        }
      }
    }

    const images = document.querySelector(".product-media-modal__content");

    if (images) {
      images.classList.remove("zoom");
    }

    setTimeout(() => this.classList.remove("hiding"), 700);
  }
}

customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");
    const inlineDeferredMedia = this.getInlineDeferredMedia();

    if (!button) return;
    let dragStartX = 0;
    let dragStartY = 0;
    let wasDragged = false;
    const dragThreshold = 10;

    this.addEventListener(
      "pointerdown",
      (event) => {
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        wasDragged = false;

        if (event.pointerType === "mouse") {
          event.preventDefault();
        }
      },
      { passive: false }
    );

    this.addEventListener(
      "pointermove",
      (event) => {
        if (
          Math.abs(event.clientX - dragStartX) > dragThreshold ||
          Math.abs(event.clientY - dragStartY) > dragThreshold
        ) {
          wasDragged = true;
        }
      },
      { passive: true }
    );

    button.addEventListener("click", (event) => {
      if (wasDragged) {
        event.preventDefault();
        return;
      }

      if (inlineDeferredMedia) {
        event.preventDefault();
        window.playMedia(inlineDeferredMedia);
        return;
      }

      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) modal.show(button);
    });

    if (this.closest(".product-popup") != null) {
      this.addEventListener("click", () => {
        if (wasDragged) return;

        const modal = document.querySelector(this.getAttribute("data-modal"));
        if (modal) modal.show(button);
      });
    }
  }

  getInlineDeferredMedia() {
    const mediaItem = this.closest(".product__media-item--full");
    const gallery = this.closest(".product__media-list");

    if (
      !mediaItem ||
      gallery?.dataset?.galleryType !== "two_column_aside" ||
      !(
        this.classList.contains("product__modal-opener--video") ||
        this.classList.contains("product__modal-opener--external_video")
      )
    ) {
      return null;
    }

    return mediaItem.querySelector("deferred-media");
  }
}

customElements.define("modal-opener", ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="Deferred-Poster-"]')?.addEventListener(
      "click",
      this.loadContent.bind(this)
    );
  }

  loadContent() {
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      window.pauseAllMedia();
      const mediaEl = content.querySelector("video, model-viewer, iframe");
      this.appendChild(mediaEl).focus();

      const swiperEl = this.closest(".swiper");

      if (swiperEl) {
        const restoreSwipe = () => {
          mediaEl.blur();
          setTimeout(() => {
            if (swiperEl.swiper) swiperEl.swiper.allowTouchMove = true;
          }, 100);
        };

        if (mediaEl.tagName === "VIDEO") {
          mediaEl.play().catch(() => {});
          mediaEl.addEventListener("pause", restoreSwipe);
          mediaEl.addEventListener("ended", restoreSwipe);
          mediaEl.addEventListener("webkitendfullscreen", restoreSwipe);

          const swiper = swiperEl.swiper;
          const isHorizontal = swiper?.isHorizontal() ?? true;
          let startX = 0,
            startY = 0,
            isVideoGesture = false;

          this.addEventListener(
            "touchstart",
            (e) => {
              if (!mediaEl.contains(e.target)) return;
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;
              isVideoGesture = true;
              e.stopPropagation();
            },
            { passive: true }
          );

          this.addEventListener(
            "pointerdown",
            (e) => {
              if (mediaEl.contains(e.target)) e.stopPropagation();
            },
            { passive: true }
          );

          this.addEventListener(
            "touchmove",
            (e) => {
              if (!isVideoGesture) return;
              const dx = e.touches[0].clientX - startX;
              const dy = e.touches[0].clientY - startY;
              const absDx = Math.abs(dx);
              const absDy = Math.abs(dy);
              if (absDx < 5 && absDy < 5) return;

              if (absDx > absDy) {
                e.stopPropagation();
                e.preventDefault();
              } else if (!isHorizontal) {
                e.stopPropagation();
                e.preventDefault();
              }
            },
            { passive: false }
          );

          this.addEventListener(
            "touchend",
            (e) => {
              if (!isVideoGesture) return;
              isVideoGesture = false;
              const dx = e.changedTouches[0].clientX - startX;
              const dy = e.changedTouches[0].clientY - startY;
              const absDx = Math.abs(dx);
              const absDy = Math.abs(dy);
              if (isHorizontal && absDx > absDy * 1.5 && absDx > 40) {
                dx < 0 ? swiper?.slideNext() : swiper?.slidePrev();
              } else if (!isHorizontal && absDy > absDx * 1.5 && absDy > 40) {
                dy < 0 ? swiper?.slideNext() : swiper?.slidePrev();
              }
            },
            { passive: true }
          );
        } else if (mediaEl.tagName === "IFRAME") {
          this._onIframeMessage = (e) => {
            let data;
            try {
              data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
            } catch {
              return;
            }
            const isYTPaused =
              data?.event === "onStateChange" &&
              (data?.info === 0 || data?.info === 2);
            const isVimeoPaused =
              data?.event === "pause" || data?.event === "finish";
            if (isYTPaused || isVimeoPaused) restoreSwipe();
          };
          window.addEventListener("message", this._onIframeMessage);
        }
      }
    }
  }

  disconnectedCallback() {
    if (this._onIframeMessage) {
      window.removeEventListener("message", this._onIframeMessage);
      this._onIframeMessage = null;
    }
  }
}

customElements.define("deferred-media", DeferredMedia);

let variantSyncInProgress = false;

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
    this.isHighVariantNeedUpdate = false;
    this.isCombinedListingsNeedUpdate = false;
    this.combinedProductURL = "";
    this.infoBlocksList = [
      "Tags",
      "Desc",
      "Badges",
      "ColorName",
      "Vendor",
      "ProductModal",
      "price",
    ];
    // Blocks a merchant can add more than once. They have no section scoped id,
    // so they are matched by position within the product info wrapper.
    this.repeatableInfoBlocksList = [".product__additional-information"];
  }

  onVariantChange(event) {
    if (!this.contains(event.target)) return;

    const isSyncUpdate = event.detail?.sync === true;

    const selectedValuesIds = this.getSelectedValuesIds();

    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, "", false);

    this.isHighVariantNeedUpdate = false;

    if (
      (!this.currentVariant && this.dataset.isHighVariantProduct === "true") ||
      (!this.currentVariant && this.combinedProductURL)
    ) {
      this.highVariantRequestUrl = this.createRequestUrl({
        selectedValuesIds: selectedValuesIds,
        combinedProductURL: this.combinedProductURL,
      });
      if (this.highVariantRequestUrl) {
        this.isHighVariantNeedUpdate = true;
      }
      if (this.combinedProductURL) {
        this.isCombinedListingsNeedUpdate = true;
      }
    }

    if (this.isHighVariantNeedUpdate === false) {
      this.updatePickupAvailability();
      this.updateVariantStatuses();
    }

    this.resetErrorMessage();

    if (!this.currentVariant) {
      // -----
      // for high-variant products
      if (this.isHighVariantNeedUpdate) {
        this.classList.add("high-variant-loading");
        this.syncPairedVariantSelects();
        this.renderProductInfo(this.highVariantRequestUrl, isSyncUpdate);
        return;
      }
      // -----

      this.toggleAddButton(true, "", false, true);
      this.setUnavailable();
    } else {
      const shouldUpdateMedia =
        !this.closest("floated-form") &&
        (!this.closest(".featured-product") ||
          (this.currentVariant?.featured_media &&
            this.dataset?.variantMediaDisplay === "show_all"));

      this.updateVariantMediaGrouping();

      if (!isSyncUpdate && shouldUpdateMedia) {
        // If variant display != "show_all", the media gallery element is fully replaced inside updateElementsAfterFetch
        this.updateMedia();
      } else if (isSyncUpdate && shouldUpdateMedia) {
        this.updateMedia(true);
      }
      this.updateURL();
      this.updateVariantInput();
      this.updateFloatedProductImage(this.currentVariant);
      const requestUrl = this.createRequestUrl({
        currentVariantId: this.currentVariant.id,
        combinedProductURL: this.combinedProductURL,
      });
      this.renderProductInfo(requestUrl, isSyncUpdate);
    }

    if (this.currentVariant) {
      // dispatch variant:change
      document.dispatchEvent(
        new CustomEvent("variant:change", {
          detail: {
            variant: this.currentVariant,
            previousVariant: this.previousVariant || null,
            formElement: document.querySelector(`#${this.getAttribute("id")}`),
            sectionId: this.dataset.section,
          },
        })
      );
      // dispatch variant:change

      // Save the previous version
      this.previousVariant = this.currentVariant;

      this.syncPairedVariantSelects();
    }
  }

  getPairedVariantSelects() {
    const realSectionId = this.dataset.originalSection || this.dataset.section;

    if (this.closest("floated-form")) {
      const mainPicker = document.getElementById(
        `variant-radios-${realSectionId}`
      );
      return mainPicker && mainPicker !== this ? mainPicker : null;
    }

    const floatedForm = document.getElementById(`FloatedForm-${realSectionId}`);
    if (!floatedForm) return null;

    const floatedPicker = floatedForm.querySelector(
      "variant-radios, variant-selects"
    );
    return floatedPicker && floatedPicker !== this ? floatedPicker : null;
  }

  syncPairedVariantSelects() {
    if (variantSyncInProgress) return;

    const usingLiveValues =
      !this.currentVariant &&
      (!!this.combinedProductURL || this.dataset.isHighVariantProduct === "true");
    if (!this.currentVariant && !usingLiveValues) return;

    const paired = this.getPairedVariantSelects();
    if (!paired) return;
    if (!usingLiveValues && paired.currentVariant?.id === this.currentVariant.id)
      return;

    const ownControls = usingLiveValues
      ? [...this.querySelectorAll(".product-form__controls")].sort(
          (a, b) =>
            Number(a.dataset.optionPosition) - Number(b.dataset.optionPosition)
        )
      : null;

    const controls = [...paired.querySelectorAll(".product-form__controls")].sort(
      (a, b) =>
        Number(a.dataset.optionPosition) - Number(b.dataset.optionPosition)
    );

    let inputToDispatch = null;

    controls.forEach((control, index) => {
      const targetValue = usingLiveValues
        ? ownControls[index]?.querySelector('input[type="radio"]:checked')
            ?.value
        : this.currentVariant.options[index];
      if (targetValue === undefined) return;

      const targetInput = [
        ...control.querySelectorAll('input[type="radio"]'),
      ].find((input) => input.value === targetValue);

      if (targetInput && !targetInput.checked) {
        targetInput.checked = true;
        inputToDispatch = inputToDispatch || targetInput;

        if (control.classList.contains("product-form__controls--dropdown")) {
          const selectLabel = control.querySelector(".select-label");
          const selectLabelText = selectLabel?.querySelector("span");
          if (selectLabelText) {
            selectLabelText.textContent = targetValue;
            selectLabel.setAttribute("title", targetValue);
          }
        }
      }
    });

    if (inputToDispatch) {
      variantSyncInProgress = true;
      try {
        inputToDispatch.dispatchEvent(
          new CustomEvent("change", { bubbles: true, detail: { sync: true } })
        );
      } finally {
        variantSyncInProgress = false;
      }
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  getSelectedValuesIds() {
    const controls = [...this.querySelectorAll(".product-form__controls")];

    controls.sort((a, b) => {
      return (
        Number(a.dataset.optionPosition) - Number(b.dataset.optionPosition)
      );
    });

    return controls.map((control) => {
      const checkedInput = control.querySelector('input[type="radio"]:checked');

      if (checkedInput?.dataset?.productUrl) {
        this.combinedProductURL = checkedInput.dataset.productUrl;
      }

      return checkedInput?.dataset?.optionValueId
        ? checkedInput.dataset.optionValueId
        : null;
    });
  }

  createRequestUrl({
    combinedProductURL = "",
    currentVariantId = "",
    selectedValuesIds = [],
  }) {
    const productUrl = combinedProductURL || `${this.dataset.url}`;
    const sectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;

    if (currentVariantId) {
      return `${productUrl}?variant=${currentVariantId}&section_id=${sectionId}`;
    }

    // -----
    // for high-variant products
    // and if variant not found in liquid <script data-all-variants-no-high>
    if (selectedValuesIds.length) {
      const params = [];
      params.push(`section_id=${sectionId}`);
      params.push(`option_values=${selectedValuesIds.join(",")}`);
      return `${productUrl}?${params.join("&")}`;
    }
    // -----
  }

  // !!! Need to add for update data
  setCurrentVariantAfterFetch(html) {
    const sourceSectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;

    const variantPickerSource = html.getElementById(
      `variant-radios-${sourceSectionId}`
    );
    const variantPickerDestination = document.getElementById(
      `variant-radios-${this.dataset.section}`
    );
    if (!variantPickerSource) return;

    if (
      variantPickerSource.dataset.url != variantPickerDestination.dataset.url
    ) {
      this.dataset.url = variantPickerSource.dataset.url;
    }

    const newVariantDataEl = variantPickerSource.querySelector(
      "[data-selected-variant]"
    );
    if (!newVariantDataEl) return;

    const newVariantData = variantPickerSource.querySelector(
      "[data-selected-variant]"
    ).innerHTML;

    const selectedVariant = !!newVariantData
      ? JSON.parse(newVariantData)
      : null;

    this.currentVariant = selectedVariant;

    const oldEl = variantPickerDestination.querySelector(
      "[data-selected-variant]"
    );
    if (oldEl) {
      oldEl.innerHTML = newVariantData;
    }
  }

  updateMasterId() {
    if (this.variantData || this.querySelector("[data-all-variants-no-high]")) {
      this.currentVariant = this.getVariantData().find((variant) => {
        //this.options.sort();
        //variant.options.sort();

        return !variant.options
          .map((option, index) => {
            return this.options[index] === option;
          })
          .includes(false);
      });
    }
  }

  isHidden(elem) {
    const styles = window.getComputedStyle(elem);
    return styles.display === "none" || styles.visibility === "hidden";
  }

  isAltMediaGroupingActive() {
    // Featured product sections keep rebuilding their gallery from the fetched
    // section, they have no slider state to preserve.
    if (this.closest(".featured-product")) return false;

    return !!document.querySelector(
      `[data-alt-media-grouping="true"][data-media-grouping-section="${this.dataset.section}"]`
    );
  }

  updateVariantMediaGrouping() {
    if (this.closest("floated-form")) return;
    if (typeof window.updateVariantMediaDisplay !== "function") return;

    window.updateVariantMediaDisplay(this.dataset.section, this.currentVariant);
  }

  updateMedia(silent = false) {
    if (!this.currentVariant || !this.currentVariant?.featured_media) return;
    let swiperWrappers = document.querySelectorAll(".product__media-wrapper");
    if (window.__mainProductDifferentGallery) {
      if (window.innerWidth < 750) {
        swiperWrappers = document.querySelectorAll(
          ".main-product-mobile-section-wrapper.product__media-wrapper"
        );
      } else {
        swiperWrappers = document.querySelectorAll(
          ".main-product-desktop-section-wrapper.product__media-wrapper"
        );
      }
    }

    swiperWrappers.forEach((elem) => {
      if (!this.isHidden(elem)) {
        const newMediaElem = elem.querySelector(
          `[data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}"]`
        );
        const parent = newMediaElem?.parentElement;

        const swiperSelector = getSliderSelector();
        const swiperElem = elem.querySelector(swiperSelector);

        if (swiperElem) {
          if (!swiperElem?.swiper) {
            reinitSlider();
          }

          // The media of the selected variant can be filtered out of the
          // slider when it belongs to another color group.
          const targetIndex = swiperElem.swiper.slides.indexOf(newMediaElem);

          if (targetIndex > -1) {
            swiperElem.swiper.slideTo(targetIndex, silent ? 0 : undefined);

            if (!silent) {
              this.scrollToVariantMedia(swiperElem);
            }
          }
        } else if (parent) {
          // A static gallery moves the media of the selected variant to the
          // front. Grouping can filter that media out when its alt text points
          // at another color, and prepending it would leave a hidden element as
          // the first child, which is what the gallery layouts are built on.
          const isVariantHidden = newMediaElem.classList.contains(
            "product__media-item--variant-hidden"
          );

          if (!isVariantHidden) {
            parent.prepend(newMediaElem);
          }

          if (!silent) {
            if (!isVariantHidden) {
              this.scrollToVariantMedia(newMediaElem);
            }

            window.setTimeout(() => {
              parent.scroll(0, 0);
            });
          }
        }
      }
    });
  }

  // Brings the gallery back into view on mobile after a variant change, so the
  // shopper sees the selected variant media without scrolling up manually.
  scrollToVariantMedia(target) {
    if (!target || this.dataset.scrollToVariantMedia !== "true") return;
    if (window.innerWidth >= 750) return;
    if (this.closest("floated-form") || this.closest("quick-view-modal")) return;

    const headerWrapper = document.querySelector(".header-wrapper");
    const isHeaderSticky =
      !!headerWrapper && (headerWrapper.dataset.stickyType || "none") !== "none";
    const headerOffset = isHeaderSticky ? headerWrapper.offsetHeight : 0;

    // A gallery taller than the screen counts as visible once its top edge
    // sits in the upper half of the viewport.
    const { top, bottom } = target.getBoundingClientRect();
    const isInView =
      top >= headerOffset &&
      (bottom <= window.innerHeight || top <= window.innerHeight / 2);
    if (isInView) return;

    window.scrollTo({
      top: Math.max(top + window.scrollY - headerOffset, 0),
      behavior: "smooth",
    });
  }

  updateURL() {
    if (!this.classList.contains("featured-product-radios")) {
      if (!this.currentVariant || this.dataset.updateUrl === "false") return;
      window.history.replaceState(
        {},
        "",
        `${this.dataset.url}?variant=${this.currentVariant.id}`
      );
    }
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData?.filter(
      (variant) => this.querySelector(":checked").value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll(".product-form__controls")];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [
        ...option.querySelectorAll('input[type="radio"], option'),
      ];

      const previousOptionSelectedElement =
        inputWrappers[index - 1].querySelector(":checked");
      if (previousOptionSelectedElement?.value) {
        const previousOptionSelected = previousOptionSelectedElement.value;
        const availableOptionInputsValue = selectedOptionOneVariants
          ?.filter(
            (variant) =>
              variant.available &&
              variant[`option${index}`] === previousOptionSelected
          )
          .map((variantOption) => variantOption[`option${index + 1}`]);
        this.setInputAvailability(optionInputs, availableOptionInputsValue);
      }
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        if (input.tagName === "OPTION") {
          input.innerText = input.getAttribute("value");
        } else if (input.tagName === "INPUT") {
          input.classList.remove("disabled");
        }
      } else {
        if (input.tagName === "OPTION") {
          input.innerText =
            window.variantStrings.unavailable_with_option.replace(
              "[value]",
              input.getAttribute("value")
            );
        } else if (input.tagName === "INPUT") {
          input.classList.add("disabled");
        }
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("pickup-availability");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }

  resetErrorMessage() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}, #sticky-bar-product-form-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const parentEl = productForm.closest("product-form");
      if (parentEl) {
        const errorWrapperEl = parentEl.querySelector(
          ".product-form__error-message-wrapper"
        );
        const errorTextEl = errorWrapperEl?.querySelector(
          ".product-form__error-message"
        );
        if (!errorWrapperEl || !errorTextEl) return;
        errorWrapperEl.setAttribute("hidden", true);
        errorTextEl.textContent = "";
      }
    });
  }

  renderProductInfo(requestUrl, isSyncUpdate = false) {
    this.abortController?.abort();
    this.abortController = new AbortController();

    // abort() only stops a fetch that hasn't resolved yet — it can't stop an
    // already-arrived response from being processed if this method is
    // called again before that response's .then() callback has run. Track
    // the latest request explicitly so a stale, late-arriving response can
    // never overwrite state from a newer one, regardless of which order
    // they actually arrive over the network.
    this.renderRequestId = (this.renderRequestId || 0) + 1;
    const requestId = this.renderRequestId;

    fetch(requestUrl, { signal: this.abortController.signal })
      .then((response) => response.text())
      .then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if (requestId !== this.renderRequestId) return;

        const html = new DOMParser().parseFromString(responseText, "text/html");

        try {
          this.setCurrentVariantAfterFetch(html);
        } catch (err) {
          console.log(err);
        }

        // -----
        // for high-variant products
        // and if variant not found in liquid <script data-all-variants-no-high>
        // but it was found after a request with the option_values parameter
        if (this.isHighVariantNeedUpdate) {
          try {
            this.updateURL();
            this.updatePickupAvailability();
            this.updatePickerInnerHtml(html);
            if (this.currentVariant) {
              this.updateVariantInput();

              const shouldUpdateMediaHighVariant =
                !this.closest("floated-form") &&
                this.currentVariant.featured_media &&
                this.dataset?.variantMediaDisplay === "show_all";

              this.updateVariantMediaGrouping();

              if (!isSyncUpdate && shouldUpdateMediaHighVariant) {
                this.updateMedia();
              } else if (isSyncUpdate && shouldUpdateMediaHighVariant) {
                this.updateMedia(true);
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
        // -----
        this.updateElementsAfterFetch(html, isSyncUpdate);

        if (!this.currentVariant) {
          this.toggleAddButton(true, "", false, true);
          this.setUnavailable();
        } else {
          this.toggleAddButton(
            !this.currentVariant?.available,
            window.variantStrings.soldOut
          );
        }
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          console.info("Fetch aborted by user");
        } else {
          console.error(error);
        }
      })
      .finally(() => {
        this.classList.remove("high-variant-loading");
      });
  }

  updatePickerInnerHtml(html) {
    // attr data-original-section use for Quick view modal
    const currentSectionId = this.dataset.section;
    const sourceSectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;

    const variantPickerSource = html.getElementById(
      `variant-radios-${sourceSectionId}`
    );
    const variantPickerDestination = document.getElementById(
      `variant-radios-${currentSectionId}`
    );
    if (variantPickerSource && variantPickerDestination) {
      const quickViewModal = this.closest("quick-view-modal");
      const quicAddModal = this.closest("quick-add-modal");

      let preSel = "quickview";
      if (quicAddModal) {
        preSel = "quickadd";
      }

      if (quickViewModal || quicAddModal) {
        variantPickerDestination.innerHTML =
          variantPickerSource.innerHTML.replaceAll(
            sourceSectionId,
            `${preSel}-${sourceSectionId}`
          );
      } else if (sourceSectionId !== currentSectionId) {
        variantPickerDestination.innerHTML =
          variantPickerSource.innerHTML.replaceAll(
            sourceSectionId,
            currentSectionId
          );
      } else {
        variantPickerDestination.innerHTML = variantPickerSource.innerHTML;
      }
    }
  }

  updateElementsAfterFetch(html, isSyncUpdate = false) {
    const skuSource = html.getElementById(
      `Sku-${
        this.dataset.originalSection
          ? this.dataset.originalSection
          : this.dataset.section
      }`
    );
    const skuDestination = document.getElementById(
      `Sku-${this.dataset.section}`
    );

    if (skuSource && skuDestination) {
      skuDestination.innerHTML = skuSource.innerHTML;
      skuDestination.classList.toggle(
        "visibility-hidden",
        skuSource.classList.contains("visibility-hidden")
      );
    }

    // inventory
    const inventorySource = html.getElementById(
      `Inventory-${
        this.dataset.originalSection
          ? this.dataset.originalSection
          : this.dataset.section
      }`
    );
    const inventoryDestination = document.getElementById(
      `Inventory-${this.dataset.section}`
    );
    if (inventorySource && inventoryDestination) {
      inventoryDestination.innerHTML = inventorySource.innerHTML;
      inventoryDestination.classList.toggle(
        "visibility-hidden",
        inventorySource.innerText === ""
      );
    }

    // Update Info blocks and Modals
    this.updateProductInfoBlocks(html);
    // Update Product Buttons
    this.updateProductButtons(html);

    const price = document.getElementById(`price-${this.dataset.section}`);

    if (price) price.classList.remove("visibility-hidden");

    const sourceSectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;
    const currentSectionId = this.dataset.section;

    if (this.currentVariant?.id) {
      this.updateFloatedProductImage(this.currentVariant);
    }

    // variant image swatches
    if (!isSyncUpdate && this.isHighVariantNeedUpdate !== true) {
      const variantSwatchesSource = html.querySelector(
        `#variant-radios-${sourceSectionId} [data-is-variant-image-swatch="true"]`
      );
      const variantSwatchesDestination = document.querySelector(
        `#variant-radios-${currentSectionId} [data-is-variant-image-swatch="true"]`
      );

      if (variantSwatchesSource && variantSwatchesDestination) {
        const quickViewModal = this.closest("quick-view-modal");
        if (quickViewModal) {
          variantSwatchesDestination.innerHTML =
            variantSwatchesSource.innerHTML.replaceAll(
              sourceSectionId,
              `quickview-${sourceSectionId}`
            );
        } else if (sourceSectionId !== currentSectionId) {
          variantSwatchesDestination.innerHTML =
            variantSwatchesSource.innerHTML.replaceAll(
              sourceSectionId,
              currentSectionId
            );
        } else {
          variantSwatchesDestination.innerHTML =
            variantSwatchesSource.innerHTML;
        }
      }
    }

    // product media
    // With media grouping on, every media stays in the DOM and is filtered in
    // place, so the gallery must not be replaced on a variant change. Combined
    // listings still swap in the media of the sibling product.
    const shouldUpdateProductMedia =
      !this.closest("floated-form") &&
      ((this.dataset?.variantMediaDisplay !== "show_all" &&
        !this.isAltMediaGroupingActive()) ||
        this.isCombinedListingsNeedUpdate);

    if (!isSyncUpdate && shouldUpdateProductMedia) {
      this.applyProductMediaUpdate(html, sourceSectionId, currentSectionId);
    } else if (isSyncUpdate && shouldUpdateProductMedia) {
      this.applyProductMediaUpdate(html, sourceSectionId, currentSectionId, true);
    }
    if (this.isCombinedListingsNeedUpdate) {
      const newVariantData = html.querySelector(
        "[data-selected-variant]"
      ).innerHTML;

      const selectedVariant = !!newVariantData
        ? JSON.parse(newVariantData)
        : null;

      let productTitle = selectedVariant?.name?.replace(
        `- ${selectedVariant?.title}`,
        ""
      );

      if (!productTitle) {
        productTitle = html.querySelector(".product__title")?.innerHTML
          ? html.querySelector(".product__title")?.innerHTML.trim()
          : "";
      }

      // product title
      const titleDestination = document.querySelectorAll(".product__title");
      if (titleDestination) {
        titleDestination.forEach((titleElem) => {
          titleElem.innerText = productTitle || "";
        });
      }

      //breadcrumb
      const breadcrumbDestination = document.querySelector(".breadcrumb span");
      if (breadcrumbDestination) {
        breadcrumbDestination.innerText = productTitle || "";
      }

      // text
      const textDestination = document.querySelector(
        ".product .product__info-wrapper .product__text"
      );

      if (textDestination) {
        textDestination.innerHTML =
          html.querySelector(".product .product__info-wrapper .product__text")
            ?.innerHTML || "";
      }

      // about
      const aboutDestination = document.querySelector(
        ".product .product__outer .about"
      );

      if (aboutDestination) {
        aboutDestination.innerHTML =
          html.querySelector(".product .product__outer .about")?.innerHTML ||
          "";
      }

      // product buttons
      const buttonsDestination = document.querySelectorAll(
        ".product .product__outer .product-form .form"
      );
      if (buttonsDestination) {
        buttonsDestination.forEach((titleElem) => {
          titleElem.innerHTML =
            html.querySelector(".product .product__outer .product-form .form")
              ?.innerHTML || "";
        });
      }

    }

    if (this.dataset.pickerType === "dropdown") {
      window._selectDropDown();
    }
  }

  applyProductMediaUpdate(html, sourceSectionId, currentSectionId, silent = false) {
    const mediaSources = html.querySelectorAll(
      `[data-section="product-media-${sourceSectionId}"]`
    );
    const mediaDestinations = document.querySelectorAll(
      `[data-section="product-media-${currentSectionId}"]`
    );

    const mediaFeaturedSources = html.querySelectorAll(
      `[data-featured-section="product-media-${sourceSectionId}"]`
    );
    const mediaFeaturedDestinations = document.querySelectorAll(
      `[data-featured-section="product-media-${currentSectionId}"]`
    );

    if (mediaFeaturedDestinations[0] && mediaFeaturedSources[0]) {
      mediaFeaturedDestinations[0].innerHTML =
        mediaFeaturedSources[0].innerHTML;

      if (mediaFeaturedDestinations[1] && mediaFeaturedSources[1]) {
        mediaFeaturedDestinations[1].innerHTML =
          mediaFeaturedSources[1].innerHTML;
      }
    }

    if (mediaDestinations[0] && mediaSources[0]) {
      mediaDestinations[0].innerHTML = mediaSources[0].innerHTML;

      if (mediaDestinations[1] && mediaSources[1]) {
        mediaDestinations[1].innerHTML = mediaSources[1].innerHTML;
      }

      const parentQuickView = this.closest("quick-view-modal");
      if (parentQuickView) {
        if (typeof parentQuickView.removeDOMElements === "function") {
          parentQuickView.removeDOMElements(mediaDestination);
        }
        if (typeof parentQuickView.initSlider === "function") {
          parentQuickView.initSlider();
        }
      } else {
        const section = document.getElementById(
          `shopify-section-${currentSectionId}`
        );

        if (section && typeof initProductPage === "function") {
          initProductPage(section);
        }
      }

      const sliderSelector = getSliderSelector();
      let scrollTarget = null;

      if (document.querySelector(sliderSelector)) {
        // mediaDestinations[0].innerHTML above replaced the slider's own
        // root element (it's a descendant of the swapped wrapper), so
        // there's no existing Swiper instance left to just .update() here —
        // it has to be (re)constructed either way, silent or not.
        if (currentSectionId.includes("quickadd")) {
          quickAddsliderInit(true);
        } else {
          subSliderInit(true);
          sliderInit(true);

          if (document.querySelector(".js-media-mobile-list")) {
            reinitSlider();
          }
        }

        const sliderElem = document.querySelector(sliderSelector);
        const targetSlide =
          sliderElem?.swiper && this.currentVariant?.featured_media
            ? sliderElem.querySelector(
                `[data-media-id="${currentSectionId}-${this.currentVariant.featured_media.id}"]`
              )
            : null;
        const targetIndex = targetSlide
          ? sliderElem.swiper.slides.indexOf(targetSlide)
          : -1;

        if (targetIndex > -1) {
          sliderElem.swiper.slideTo(targetIndex, silent ? 0 : undefined);
          scrollTarget = sliderElem;
        }
      } else if (this.currentVariant?.featured_media) {
        const mediaSelector = `[data-media-id="${currentSectionId}-${this.currentVariant.featured_media.id}"]`;

        scrollTarget =
          Array.from(mediaDestinations)
            .map((destination) => destination.querySelector(mediaSelector))
            .find((media) => media && media.getClientRects().length > 0) ||
          null;
      }

      if (typeof window.updateVariantMediaDisplay === "function") {
        window.updateVariantMediaDisplay(currentSectionId, this.currentVariant);
      }

      if (!silent) {
        this.scrollToVariantMedia(scrollTarget);
      }
    }
  }

  updateProductButtons(html) {
    const productButtonsSource = html.querySelector(
      ".product .product__outer .product-form .product-form__buttons"
    );

    const currentSectionId = this.dataset.section;
    const sourceSectionId = this.dataset.originalSection || currentSectionId;
    const productForm = document.getElementById(
      `product-form-${currentSectionId}`
    );
    const productButtonsDestinations = productForm
      ? productForm.querySelectorAll(".product-form__buttons")
      : [];

    if (!productButtonsSource || !productButtonsDestinations.length) {
      return;
    }

    const sourceHasQuantityPricing =
      productButtonsSource.dataset.hasQuantityPricing === "true";

    const remapSectionIds = (markup) =>
      sourceSectionId === currentSectionId
        ? markup
        : markup.replaceAll(sourceSectionId, currentSectionId);

    productButtonsDestinations.forEach((buttonsWrapper) => {
      const destHadQuantityPricing =
        buttonsWrapper.dataset.hasQuantityPricing === "true";

      if (!sourceHasQuantityPricing && !destHadQuantityPricing) {
        return;
      }

      if (sourceHasQuantityPricing) {
        buttonsWrapper.dataset.hasQuantityPricing = "true";
      } else {
        buttonsWrapper.removeAttribute("data-has-quantity-pricing");
      }

      const sourceB2bEl = productButtonsSource.querySelector(
        ".product-b2b-elements"
      );
      const destB2bEl = buttonsWrapper.querySelector(".product-b2b-elements");

      if (sourceB2bEl && destB2bEl) {
        destB2bEl.innerHTML = remapSectionIds(sourceB2bEl.innerHTML);
      } else if (sourceB2bEl && !destB2bEl) {
        buttonsWrapper.insertAdjacentHTML(
          "afterbegin",
          remapSectionIds(sourceB2bEl.outerHTML)
        );
      } else if (!sourceB2bEl && destB2bEl) {
        destB2bEl.remove();
      }

      const sourceQuantityWrapper = productButtonsSource.querySelector(
        ".product-form__quantity"
      );
      const destQuantityWrapper = buttonsWrapper.querySelector(
        ".product-form__quantity"
      );

      if (sourceQuantityWrapper && destQuantityWrapper) {
        destQuantityWrapper.innerHTML = remapSectionIds(
          sourceQuantityWrapper.innerHTML
        );
      }
    });
  }

  updateProductInfoBlocks(html) {
    const sourceId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;
    const destId = this.dataset.section;

    this.infoBlocksList.forEach((block) => {
      const blockSource = html.getElementById(`${block}-${sourceId}`);

      const blockDestination = document.getElementById(`${block}-${destId}`);

      if (blockDestination) {
        blockDestination.innerHTML = blockSource?.innerHTML || "";

        // Check if the modal element exists and reinitialize it
        const isDialog = blockDestination.querySelector('[role="dialog"]');
        if (isDialog && typeof blockDestination?.reinit === "function") {
          blockDestination.reinit();
        }
      }
    });

    this.updateRepeatableInfoBlocks(html, sourceId, destId);
  }

  updateRepeatableInfoBlocks(html, sourceId, destId) {
    const source = html.getElementById(`ProductInfo-${sourceId}`);
    const destination = document.getElementById(`ProductInfo-${destId}`);

    if (!source || !destination) return;

    this.repeatableInfoBlocksList.forEach((selector) => {
      const blockSources = source.querySelectorAll(selector);

      destination
        .querySelectorAll(selector)
        .forEach((blockDestination, index) => {
          blockDestination.innerHTML = blockSources[index]?.innerHTML || "";
        });
    });
  }

  toggleAddButton(
    disable = true,
    text,
    modifyClass = true,
    isUnavailable = false
  ) {
    const productForm = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    const notifyButton = document.getElementById(
      `notify-button-${this.dataset.section}`
    );

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute("disabled", "disabled");

      if (text) addButtonText.textContent = text;
      if (text) notifyButton?.setAttribute("disabled", "disabled");
    } else {
      addButton.removeAttribute("disabled");
      notifyButton?.removeAttribute("disabled");
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    notifyButton?.classList?.remove("notify-unavailable");
    if (isUnavailable) {
      notifyButton?.classList?.add("notify-unavailable");
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const addButton = button.querySelector('[name="add"]');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(
      `Inventory-${this.dataset.section}`
    );
    const sku = document.getElementById(`Sku-${this.dataset.section}`);

    if (!addButton) return;
    this.toggleAddButton(true, window.variantStrings.unavailable, true, true);
    if (price) price.classList.add("visibility-hidden");
    if (inventory) inventory.classList.add("visibility-hidden");
    if (sku) sku.classList.add("visibility-hidden");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  updateFloatedProductImage(variant) {
    const sectionId = this.dataset.originalSection || this.dataset.section;

    const floatedProductInfoImg = document.querySelector(
      `#FloatedProductInfo-${sectionId} .product_info img`
    );
    const floatedProductInfoNoImg = document.querySelector(
      `#FloatedProductInfo-${sectionId} .product_info .no-image`
    );
    if (!floatedProductInfoImg) return;

    const imageSrc =
      variant?.featured_image?.src ||
      variant?.featured_media?.preview_image?.src ||
      "";

    if (imageSrc) {
      floatedProductInfoImg.src = imageSrc;
      floatedProductInfoImg.srcset = imageSrc;
      if (floatedProductInfoNoImg) {
        floatedProductInfoNoImg.style.display = "none";
      }
    } else if (floatedProductInfoNoImg) {
      floatedProductInfoNoImg.style.display = "block";
    }
  }
}

customElements.define("variant-selects", VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        input.classList.remove("disabled");
      } else {
        input.classList.add("disabled");
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      const checkedField = Array.from(fieldset.querySelectorAll("input")).find(
        (radio) => radio.checked
      );

      if (checkedField) {
        return checkedField.value;
      }
    });
  }
}

customElements.define("variant-radios", VariantRadios);

class PasswordViewer {
  constructor() {
    const passwordField = document.querySelectorAll(".field--pass");

    passwordField.forEach((el) => {
      const input = el.querySelector("input");
      const btnWrapper = el.querySelector(".button-pass-visibility");
      const btnOpen =
        el.querySelector(".icon-eye-close") !== null
          ? el.querySelector(".icon-eye-close")
          : el.querySelector(".pass-hide");
      const btnClose =
        el.querySelector(".icon-eye") !== null
          ? el.querySelector(".icon-eye")
          : el.querySelector(".pass-show");

      input.addEventListener("input", () => {
        input.value !== ""
          ? (btnWrapper.style.display = "block")
          : (btnWrapper.style.display = "none");
      });

      btnOpen.addEventListener("click", () => {
        input.type = "text";
        btnOpen.style.display = "none";
        btnClose.style.display = "block";
      });

      btnClose.addEventListener("click", () => {
        input.type = "password";
        btnOpen.style.display = "block";
        btnClose.style.display = "none";
      });
    });
  }
}

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();

    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector("product-recommendations");
          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          /* Color swatches */
          const generateSrcset = (image, widths = []) => {
            const imageUrl = new URL(image["src"]);
            return widths
              .filter((width) => width <= image["width"])
              .map((width) => {
                imageUrl.searchParams.set("width", width.toString());
                return `${imageUrl.href} ${width}w`;
              })
              .join(", ");
          };

          const createImageElement = (image, classes, sizes, productTitle) => {
            const previewImage = image["preview_image"];
            const newImage = new Image(
              previewImage["width"],
              previewImage["height"]
            );
            newImage.className = classes;
            newImage.alt = image["alt"] || productTitle;
            newImage.sizes = sizes;
            newImage.src = previewImage["src"];
            newImage.srcset = generateSrcset(
              previewImage,
              [165, 360, 533, 720, 940, 1066]
            );
            newImage.loading = "lazy";
            return newImage;
          };

          const checkSwatches = () => {
            document
              .querySelectorAll(".js-color-swatches-wrapper")
              .forEach((wrapper) => {
                wrapper
                  .querySelectorAll(".js-color-swatches input")
                  .forEach((input) => {
                    input.addEventListener("click", (event) => {
                      const primaryImage =
                        wrapper.querySelector(".media--first");
                      const secondaryImage =
                        wrapper.querySelector(".media--second");
                      const handleProduct = wrapper.dataset.product;

                      if (event.currentTarget.checked && primaryImage) {
                        wrapper
                          .querySelector(".js-color-swatches-link")
                          .setAttribute(
                            "href",
                            event.currentTarget.dataset.variantLink
                          );
                        if (
                          wrapper.querySelector(
                            '.card__add-to-cart button[name="add"]'
                          )
                        ) {
                          wrapper
                            .querySelector(
                              '.card__add-to-cart button[name="add"]'
                            )
                            .setAttribute("aria-disabled", false);
                          if (
                            wrapper.querySelector(
                              '.card__add-to-cart button[name="add"] > span'
                            )
                          ) {
                            wrapper
                              .querySelector(
                                '.card__add-to-cart button[name="add"] > span'
                              )
                              .classList.remove("hidden");
                            wrapper
                              .querySelector(
                                '.card__add-to-cart button[name="add"] .sold-out-message'
                              )
                              .classList.add("hidden");
                          }
                          wrapper.querySelector(
                            '.card__add-to-cart input[name="id"]'
                          ).value = event.currentTarget.dataset.variantId;
                        }
                        const currentColor = event.currentTarget.value;

                        jQuery.getJSON(
                          window.Shopify.routes.root +
                            `products/${handleProduct}.js`,
                          function (product) {
                            const variant = product.variants.filter(
                              (item) =>
                                item.featured_media != null &&
                                item.options.includes(currentColor)
                            )[0];

                            if (variant) {
                              const newPrimaryImage = createImageElement(
                                variant["featured_media"],
                                primaryImage.className,
                                primaryImage.sizes,
                                product.title
                              );

                              if (newPrimaryImage.src !== primaryImage.src) {
                                let flag = false;
                                if (secondaryImage) {
                                  const secondaryImagePathname = new URL(
                                    secondaryImage.src
                                  ).pathname;
                                  const newPrimaryImagePathname = new URL(
                                    newPrimaryImage.src
                                  ).pathname;

                                  if (
                                    secondaryImagePathname ==
                                    newPrimaryImagePathname
                                  ) {
                                    primaryImage.remove();
                                    secondaryImage.classList.remove(
                                      "media--second"
                                    );
                                    secondaryImage.classList.add(
                                      "media--first"
                                    );
                                    flag = true;
                                  }
                                }
                                if (flag == false) {
                                  primaryImage.animate(
                                    { opacity: [1, 0] },
                                    {
                                      duration: 200,
                                      easing: "ease-in",
                                      fill: "forwards",
                                    }
                                  ).finished;
                                  setTimeout(function () {
                                    primaryImage.replaceWith(newPrimaryImage);
                                    newPrimaryImage.animate(
                                      { opacity: [0, 1] },
                                      { duration: 200, easing: "ease-in" }
                                    );
                                    if (secondaryImage) {
                                      secondaryImage.remove();
                                    }
                                  }, 200);
                                }
                              }
                            }
                          }
                        );
                      }
                    });
                  });
              });
          };

          checkSwatches();

          const calcTop = (section) => {
            const imageWrapper = section.querySelectorAll(".card__inner");
            let top = 0;

            if (imageWrapper) {
              top = imageWrapper[0]?.offsetHeight / 2;
            } else {
              top = 50;
            }

            return top;
          };

          const initSlider = () => {
            document
              .querySelectorAll(".js-recommendation-swiper")
              .forEach((elem, index) => {
                let mobileLayout = 1;
                if (elem.dataset.mobileLayout) {
                  mobileLayout = elem.dataset.mobileLayout;
                }
                let slider = new Swiper(elem, {
                  slidesPerView: mobileLayout,
                  spaceBetween: 8,
                  speed: 600,
                  navigation: {
                    nextEl: elem.querySelector(
                      ".product-recommendations__slider-nav .swiper-button-next"
                    ),
                    prevEl: elem.querySelector(
                      ".product-recommendations__slider-nav .swiper-button-prev"
                    ),
                  },
                  breakpoints: {
                    576: {
                      slidesPerView: 2,
                    },
                  },
                });
              });
          };

          const initSection = () => {
            const section = this;

            const sectionResizeObserver = new ResizeObserver((entries) => {
              const [entry] = entries;
              let top = calcTop(section);
              if (section.querySelector(".product-recommendations__slider-nav"))
                section.querySelector(
                  ".product-recommendations__slider-nav"
                ).style.top = top + "px";
            });

            sectionResizeObserver.observe(section);

            initSlider();
          };

          const initProductSlider = () => {
            // Reuse the shared product card slider init (see product-card-slider.js).
            // If it is not loaded yet, it initializes these cards itself on load.
            if (typeof loadeMoreSlider_G !== "function") return;

            loadeMoreSlider_G(this);
          };

          initProductSlider();

          initSection();
        })
        .catch((e) => {
          console.error(e);
        });
    };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 200px 0px",
    }).observe(this);
  }
}

customElements.define("product-recommendations", ProductRecommendations);

(function () {
  const initHeaderOverlay = () => {
    const main = document.getElementById("MainContent");
    const bodyEl = document.querySelector(".template-index");
    const sections = main.querySelectorAll(".shopify-section");
    if (sections.length > 0) {
      const sectionFirstChild = sections[0].querySelector(
        ".section--has-overlay"
      );
      const headerGroupSections = document.querySelectorAll(
        ".shopify-section-group-header-group"
      );
      const header = document.querySelector(".shopify-section-header");
      const headerWrapper = document.querySelector(".header-wrapper");
      const stickyHeaderBackgroundColorScheme =
        headerWrapper?.dataset.backgroundColorScheme || "color-background-1";

      if (sectionFirstChild && header) {
        header.classList.add('overlay-initialized');
        if (sectionFirstChild.classList.contains("section--has-overlay")) {
          if (headerGroupSections[headerGroupSections.length - 1] === header) {
            sections[0].classList.remove("not-margin");
            header.classList.add(stickyHeaderBackgroundColorScheme, "color-background-2");
            header.dataset.headerOverlay = "true";
          } else {
            sections[0].classList.add("not-margin");
            header.classList.remove(stickyHeaderBackgroundColorScheme, "color-background-2");
            delete header.dataset.headerOverlay;
          }
        } else {
          sections[0].classList.remove("not-margin");
          header.classList.remove(stickyHeaderBackgroundColorScheme, "color-background-2");
          delete header.dataset.headerOverlay;
        }
      }
      if (header && stickyHeaderBackgroundColorScheme !== 'color-background-1' && !bodyEl) {
        header.classList.add(stickyHeaderBackgroundColorScheme);
      }
    }
  };

  initHeaderOverlay();

  document.addEventListener("shopify:section:load", function () {
    initHeaderOverlay();
  });

  document.addEventListener("shopify:section:unload", function () {
    initHeaderOverlay();
  });

  document.addEventListener("shopify:section:reorder", function () {
    initHeaderOverlay();
  });
})();

function formatMoney(cents, format = "") {
  if (typeof cents === "string") {
    cents = cents.replace(".", "");
  }

  cents = parseInt(cents, 10);
  let value = "";
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || theme.moneyFormat;

  function formatWithDelimiters(
    number,
    precision = 2,
    thousands = ",",
    decimal = "."
  ) {
    if (isNaN(number) || number == null) {
      return "0";
    }

    number = (number / 100.0).toFixed(precision);

    const parts = number.split(".");
    const dollarsAmount = parts[0].replace(
      /(\d)(?=(\d{3})+(?!\d))/g,
      `$1${thousands}`
    );
    const centsAmount = precision > 0 ? decimal + parts[1] : "";

    return dollarsAmount + centsAmount;
  }

  const match = formatString.match(placeholderRegex);
  const formatType = match ? match[1] : "amount";

  switch (formatType) {
    case "amount":
      value = formatWithDelimiters(cents, 2, ",", ".");
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0, ",", ".");
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
    case "amount_with_apostrophe_separator":
      value = formatWithDelimiters(cents, 2, "'", ".");
      break;
    case "amount_no_decimals_with_space_separator":
      value = formatWithDelimiters(cents, 0, " ", ".");
      break;
    case "amount_with_space_separator":
      value = formatWithDelimiters(cents, 2, " ", ",");
      break;
    case "amount_with_period_and_space_separator":
      value = formatWithDelimiters(cents, 2, " ", ".");
      break;
    default:
      value = formatWithDelimiters(cents, 2, ",", ".");
  }

  return formatString.replace(placeholderRegex, value);
}

class LocalizationForm extends HTMLElement {
  constructor() {
    super();
    this.elements = {
      input: this.querySelector(
        'input[name="locale_code"], input[name="country_code"]'
      ),
      button: this.querySelector(".disclosure__button-modal"),
      panel: this.querySelector("ul"),
      buttonSave: this.querySelector(".button-save"),
      buttonSpan: this.querySelector(
        ".disclosure__button-modal span:last-of-type"
      ),
    };

    // Example usage:
    const targetElement = this.elements.button;
    const excludeElement = this.elements.panel;

    this.elements.button?.addEventListener(
      "click",
      this.openSelector.bind(this)
    );
    this.addEventListener("keyup", this.onContainerKeyUp.bind(this));

    this.querySelectorAll("a").forEach((item) =>
      item.addEventListener("click", this.onItemClick.bind(this))
    );

    this.elements.buttonSave?.addEventListener(
      "click",
      this.onClickSave.bind(this)
    );

    this.handleClickOutside(targetElement, excludeElement);
  }

  hidePanel() {
    this.elements.button.setAttribute("aria-expanded", "false");
    this.elements.panel.setAttribute("hidden", true);
  }

  handleClickOutside(target, exclude) {
    document.addEventListener("click", (event) => {
      if (
        !target.contains(event.target) &&
        (!exclude || !exclude.contains(event.target))
      ) {
        this.hidePanel();
      }
    });
  }

  onContainerKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    this.hidePanel();
    this.elements.button.focus();
  }

  onItemClick(event) {
    event.preventDefault();
    this.elements.input.value = event.currentTarget.dataset.value;
    if (
      document.querySelectorAll(".region_language_dropdown_type").length > 0
    ) {
      this.querySelector("form")?.submit();
    } else {
      let itemValue = event.currentTarget.dataset.valuesave;
      this.elements.buttonSpan.textContent = event.currentTarget.textContent;

      const flag = this.querySelector(
        ".disclosure__button-modal .currency-flag"
      );

      if (flag) {
        flag.style.display = "none";
      }

      this.elements.button.setAttribute("data-value", itemValue);
      this.hidePanel();
    }
  }

  onClickSave() {
    this.querySelector("form")?.submit();
  }

  openSelector() {
    this.elements.button.focus();
    this.elements.panel.toggleAttribute("hidden");
    this.elements.button.setAttribute(
      "aria-expanded",
      (
        this.elements.button.getAttribute("aria-expanded") === "false"
      ).toString()
    );
    document.body.classList.add("region-open");
  }

  closeSelector(event) {
    if (!this.contains(event.relatedTarget)) {
      this.hidePanel();
    }
  }
}

customElements.define("localization-form", LocalizationForm);

(function () {
  const imagesnumber = () => {
    $(document).scroll(scrolled);
    $(document).ready(scrolled);

    const scroll_line = 32;

    function scrolled() {
      const images = $(".img-responsive:visible");
      for (var i = 2; i < images.length; i++) {
        let pos = images.eq(i).offset().top - $(document).scrollTop();
        if (pos > scroll_line) {
          break;
        }
      }
      let current_image = i;

      $("#image_number .first_number").html(
        current_image > 10 ? current_image : "0" + current_image
      );
    }
  };
  document.addEventListener("DOMContentLoaded", function () {
    imagesnumber();
    document.addEventListener("shopify:section:load", function () {
      imagesnumber();
    });
  });
})();

(function () {
  const selectDropDown = () => {
    $(document)
      .off("click.dropdownItem")
      .on("click.dropdownItem", ".dropdown-select ul li", function () {
        const $li = $(this);
        const $dropdown = $li.closest(".product-form__controls--dropdown");
        const $elItem = $dropdown.find(".dropdown-select ul");
        const $selectedText = $dropdown.find(".dropdown-select .select-label");

        $selectedText
          .find("span")
          .text($li.find("label").text().trim())
          .attr("title", $li.find("label").text().trim());

        $elItem.removeClass("active");
      });

    $(document)
      .off("click.dropdownToggle")
      .on(
        "click.dropdownToggle",
        ".dropdown-select .select-label",
        function (e) {
          e.stopPropagation();
          const $dropdown = $(this).closest(
            ".product-form__controls--dropdown"
          );
          const $elItem = $dropdown.find(".dropdown-select ul");

          $(".dropdown-select ul").not($elItem).removeClass("active");

          $elItem.toggleClass("active");
        }
      );

    $(document)
      .off("click.dropdownClose")
      .on("click.dropdownClose", function () {
        $(".dropdown-select ul").removeClass("active");
      });
  };

  window._selectDropDown = selectDropDown;

  document.addEventListener("DOMContentLoaded", function () {
    selectDropDown();
    document.addEventListener("shopify:section:load", function () {
      selectDropDown();
    });
  });
})();

function isSafari() {
  const userAgent = navigator.userAgent;
  return (
    /Safari/.test(userAgent) &&
    !/Chrome/.test(userAgent) &&
    !/Edge/.test(userAgent)
  );
}

function isiPad() {
  return (
    navigator.userAgent.includes("iPad") ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// CART REFRESH EVENT
// -----------------------------------------------------------------------------

document.documentElement.addEventListener("cart:refresh", () => {
  const sectionsToUpdate = [
    { id: "cart-count-bubble", selector: "#cart-icon-bubble" },
    { id: "cart-drawer", selector: "#CartDrawer" },
    { id: "main-cart-items", selector: ".cart-items-wrapper" },
    { id: "main-cart-footer", selector: ".cart__footer" },
    { id: "main-cart-shipping", selector: ".cart-shipping" },
  ];

  sectionsToUpdate.forEach((section) => {
    fetch(`${routes.cart_url}?section_id=${section.id}`)
      .then((response) => response.text())
      .then((html) => {
        const parsedHTML = new DOMParser().parseFromString(html, "text/html");
        const sourceSection = parsedHTML.querySelector(section.selector);
        const destinationSection = document.querySelector(section.selector);
        if (sourceSection && destinationSection) {
          destinationSection.innerHTML = sourceSection.innerHTML;
        }
      })
      .catch((e) => console.error(`Error updating ${section.id}:`, e));
  });
});

// CART REFRESH EVENT END
// -----------------------------------------------------------------------------
