(function () {
  const multicolumnSlider = () => {
    const multicolumnSliders = document.querySelectorAll(
      ".featured-products.swiper"
    );

    if (
      document.querySelectorAll(".featured-products:not(.swiper)").length > 0
    ) {
      document
        .querySelectorAll(".featured-products:not(.swiper)")
        .forEach((item) => {
          if (item.querySelectorAll(".observe-me").length > 0) {
            function createObserver() {
              function handleIntersect(entries, observer) {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    entry.target.classList.add("is-inview");
                    observer.unobserve(entry.target); // Unobserve the element after the first intersection
                  }
                });
              }

              let options = {
                root: null,
                rootMargin: "0px",
                threshold: 0.1,
              };

              let observer = new IntersectionObserver(handleIntersect, options);

              let targets = item.querySelectorAll(".observe-me");

              targets.forEach((target, index) => {
                observer.observe(target);
                target.style.setProperty("--delay", `${index / 4}s`);
              });
            }

            createObserver();
          }
        });
    }

    if (multicolumnSliders.length === 0) return;

    multicolumnSliders.forEach((slider) => {
      let slides_count = slider.dataset.slidesCount;
      const sectionId = slider.dataset.id;
      const perRow = slider.dataset.perRow;
      const speed = slider.dataset.speed * 1000;
      const autoplay = toBoolean(slider.dataset.autoplay);
      const stopAutoplaySlider = toBoolean(slider.dataset.stopAutoplay);
      const enablenNavigation = toBoolean(slider.dataset.navigation);
      let autoplayParm = {};

      if (autoplay) {
        autoplayParm = {
          autoplay: {
            delay: 0,
            disableOnInteraction: false,
          },
        };
      }

      if (slides_count > 3) {
        if (
          slider.querySelectorAll(".featured-products__image-wrapper").length >
          0
        ) {
          slider
            .querySelectorAll(".featured-products__image-wrapper")
            .forEach((item) => item.classList.remove("observe-me"));
        }

        let multiple = slides_count > 3;

        const productsSlider = new Swiper(`#${sectionId} .swiper`, {
          loop: true,
          longSwipesRatio: 0.1,
          allowTouchMove: true,
          speed: speed,
          ...autoplayParm,
          breakpoints: {
            0: {
              slidesPerView: 1,
              slidesPerGroup: 1,
            },
            576: {
              slidesPerView: +perRow - multiple ? 2 : perRow > 2 ? 1 : 0 + 0.2,
            },
            990: {
              slidesPerView: +perRow - (multiple ? 1 : 0) + 0.2,
            },
          },
        });
        if (autoplay && stopAutoplaySlider) {
          let duration;
          let distanceRatio;
          let startTimer;
          let navigationDirection = 1;
          let navigationLock = false;
          let navigationUnlockTimer;
          let dragInteractionActive = false;
          let pendingDragStart = false;
          let dragPointerId = null;
          let dragStartX = 0;
          let dragStartY = 0;
          let isSliderHovered = false;
          let hoverPausedAutoplay = false;
          let resumeAutoplayAfterNavigation = false;

          const syncAutoplayDirection = (direction = navigationDirection) => {
            navigationDirection = direction;

            if (!productsSlider.params.autoplay) return;

            productsSlider.params.autoplay.reverseDirection = direction < 0;

            if (productsSlider.originalParams?.autoplay) {
              productsSlider.originalParams.autoplay.reverseDirection =
                direction < 0;
            }
          };

          const freezeSlider = () => {
            const currentTranslate = productsSlider.getTranslate();

            productsSlider.setTransition(0);
            productsSlider.setTranslate(currentTranslate);
            productsSlider.updateProgress(currentTranslate);
            productsSlider.updateActiveIndex();
            productsSlider.updateSlidesClasses();

            if (productsSlider.animating) {
              productsSlider.wrapperEl.dispatchEvent(
                new CustomEvent("transitionend", {
                  bubbles: true,
                  cancelable: true,
                })
              );
            }
          };

          syncAutoplayDirection();

          const stopAutoplay = () => {
            if (startTimer) clearTimeout(startTimer);

            freezeSlider();

            const currentSlideWidth =
              productsSlider.slides[productsSlider.activeIndex].offsetWidth;
            distanceRatio = Math.abs(
              (currentSlideWidth * productsSlider.activeIndex +
                productsSlider.getTranslate()) /
                currentSlideWidth
            );

            duration = productsSlider.params.speed * distanceRatio;
            productsSlider.autoplay.stop();
          };

          const startAutoplay = (delay = duration) => {
            startTimer = setTimeout(() => {
              productsSlider.autoplay.start();
            }, delay);
          };

          const pauseAutoplayForHover = () => {
            if (startTimer) clearTimeout(startTimer);

            if (
              !productsSlider.autoplay?.running ||
              productsSlider.autoplay.paused
            ) {
              hoverPausedAutoplay = false;
              return;
            }

            hoverPausedAutoplay = true;
            productsSlider.autoplay.pause();
          };

          const clearNavigationUnlockTimer = () => {
            if (navigationUnlockTimer) {
              clearTimeout(navigationUnlockTimer);
              navigationUnlockTimer = null;
            }
          };

          const resumeAutoplay = () => {
            if (hoverPausedAutoplay && productsSlider.autoplay?.paused) {
              hoverPausedAutoplay = false;
              productsSlider.autoplay.resume();
              return;
            }

            hoverPausedAutoplay = false;
            startAutoplay();
          };

          const releaseNavigationLock = () => {
            clearNavigationUnlockTimer();
            navigationLock = false;

            if (isSliderHovered) {
              resumeAutoplayAfterNavigation = false;
              hoverPausedAutoplay = false;
              return;
            }

            if (resumeAutoplayAfterNavigation) {
              resumeAutoplayAfterNavigation = false;
              resumeAutoplay();
            }
          };

          const releaseDragInteraction = () => {
            clearNavigationUnlockTimer();
            dragInteractionActive = false;
            pendingDragStart = false;
            dragPointerId = null;
            productsSlider.allowTouchMove = true;
            hoverPausedAutoplay = false;
            resumeAutoplayAfterNavigation = false;
          };

          const waitForNavigationComplete = (attempt = 0) => {
            clearNavigationUnlockTimer();

            navigationUnlockTimer = setTimeout(
              () => {
                const currentTranslate = productsSlider.getTranslate();
                const expectedTranslate =
                  typeof productsSlider.translate === "number"
                    ? productsSlider.translate
                    : currentTranslate;

                if (
                  productsSlider.animating ||
                  Math.abs(currentTranslate - expectedTranslate) > 0.5
                ) {
                  waitForNavigationComplete(attempt + 1);
                  return;
                }

                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    if (productsSlider.animating && attempt < 10) {
                      waitForNavigationComplete(attempt + 1);
                      return;
                    }

                    releaseNavigationLock();
                  });
                });
              },
              attempt === 0 ? 0 : 32
            );
          };

          const waitForDragComplete = (attempt = 0) => {
            clearNavigationUnlockTimer();

            navigationUnlockTimer = setTimeout(
              () => {
                if (productsSlider.animating) {
                  waitForDragComplete(attempt + 1);
                  return;
                }

                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    if (productsSlider.animating && attempt < 10) {
                      waitForDragComplete(attempt + 1);
                      return;
                    }

                    releaseDragInteraction();
                  });
                });
              },
              attempt === 0 ? 0 : 32
            );
          };

          const resetPendingDrag = () => {
            pendingDragStart = false;
            dragPointerId = null;
          };

          const startDragInteraction = () => {
            if (dragInteractionActive || navigationLock) return;

            resumeAutoplayAfterNavigation = false;
            hoverPausedAutoplay = false;
            dragInteractionActive = true;
            stopAutoplay();
          };

          const settleDraggedPosition = () => {
            if (startTimer) clearTimeout(startTimer);

            const currentTranslate = productsSlider.getTranslate();
            productsSlider.autoplay.stop();
            productsSlider.setTransition(0);
            productsSlider.setTranslate(currentTranslate);
            productsSlider.updateProgress(currentTranslate);
            productsSlider.updateActiveIndex();
            productsSlider.updateSlidesClasses();
          };

          const finishDragInteraction = () => {
            resetPendingDrag();

            if (!dragInteractionActive) {
              productsSlider.allowTouchMove = true;
              return;
            }

            settleDraggedPosition();

            waitForDragComplete();
          };

          slider.addEventListener("mouseenter", function () {
            isSliderHovered = true;
            resumeAutoplayAfterNavigation = false;

            if (navigationLock || dragInteractionActive) return;

            pauseAutoplayForHover();
          });

          slider.addEventListener("mouseleave", function () {
            isSliderHovered = false;

            if (navigationLock) {
              resumeAutoplayAfterNavigation = true;
              return;
            }

            if (dragInteractionActive) return;

            resumeAutoplay();
          });

          if (enablenNavigation) {
            const switchSpeed = 1000;

            const performSwitch = (direction) => {
              syncAutoplayDirection(direction);

              if (direction > 0) {
                return productsSlider.slideNext(switchSpeed);
              } else {
                return productsSlider.slidePrev(switchSpeed);
              }
            };

            const handleSwitch = (direction) => {
              if (navigationLock || dragInteractionActive) return;

              stopAutoplay();
              navigationLock = true;
              const didSwitch = performSwitch(direction);

              if (didSwitch === false) {
                releaseNavigationLock();
                return;
              }

              waitForNavigationComplete();
            };

            productsSlider.on("transitionEnd", () => {
              if (!navigationLock) return;
              waitForNavigationComplete();
            });

            slider.addEventListener("pointerdown", function (event) {
              const isPrimaryButton =
                event.pointerType !== "mouse" || event.button === 0;
              const isButtonInteraction =
                !!event.target.closest(".products__buttons");

              productsSlider.allowTouchMove =
                !navigationLock && !isButtonInteraction;

              if (!isPrimaryButton || navigationLock || isButtonInteraction) {
                resetPendingDrag();
                return;
              }

              pendingDragStart = true;
              dragPointerId = event.pointerId;
              dragStartX = event.clientX;
              dragStartY = event.clientY;
            });

            document.addEventListener("pointermove", function (event) {
              if (
                !pendingDragStart ||
                dragInteractionActive ||
                event.pointerId !== dragPointerId
              ) {
                return;
              }

              const deltaX = Math.abs(event.clientX - dragStartX);
              const deltaY = Math.abs(event.clientY - dragStartY);

              if (Math.max(deltaX, deltaY) < 8) return;

              startDragInteraction();
            });

            document.addEventListener("pointerup", function (event) {
              if (dragPointerId !== null && event.pointerId !== dragPointerId)
                return;

              finishDragInteraction();
            });

            document.addEventListener("pointercancel", function (event) {
              if (dragPointerId !== null && event.pointerId !== dragPointerId)
                return;

              finishDragInteraction();
            });

            const dir = document.querySelector("html").getAttribute("dir");
            let nextEl = `#${sectionId} .products-button-next`;
            let prevEl = `#${sectionId} .products-button-prev`;
            if (dir === "rtl") {
              [nextEl, prevEl] = [prevEl, nextEl];
            }

            document.querySelector(nextEl).addEventListener(
              "click",
              function () {
                handleSwitch(1);
              },
              false
            );

            document.querySelector(prevEl).addEventListener(
              "click",
              function () {
                handleSwitch(-1);
              },
              false
            );

            const cursor = document.getElementById(`${sectionId}-cursor`);

            const animateCursor = (e) => {
              const x = e.clientX - cursor.offsetWidth / 2,
                y = e.clientY - cursor.offsetHeight / 2;

              const keyframes = {
                transform: `translate(${x}px, ${y}px) `,
              };

              cursor.animate(keyframes, {
                duration: 100,
                fill: "forwards",
              });
            };

            const getCursorClass = (type) => {
              switch (type) {
                case "next":
                  return "cursor-icon next button button--simple";
                case "prev":
                  return "cursor-icon prev button button--simple";
                default:
                  return "cursor-icon button button--simple";
              }
            };

            document.querySelector(
              `#${sectionId} .products-cursor`
            ).onmousemove = (e) => {
              const interactable = e.target.closest(".products__buttons"),
                interacting = interactable !== null;

              const icon = document.getElementById(`${sectionId}-cursor-icon`);

              if (e.target.closest(".products__buttons") != null) {
                animateCursor(e);
              }

              cursor.dataset.type = interacting
                ? interactable.dataset.type
                : "";

              if (interacting) {
                icon.className = getCursorClass(interactable.dataset.type);
              }
            };
          }
        }
      }
      //else {
      //	function createObserver() {
      //		function handleIntersect(entries, observer) {
      //			entries.forEach(entry => {
      //				if (entry.isIntersecting) {
      //					entry.target.classList.add("is-inview");
      //					observer.unobserve(entry.target); // Unobserve the element after the first intersection
      //				}
      //			});
      //		}

      //		let options = {
      //			root: null,
      //			rootMargin: "0px",
      //			threshold: 0.1
      //		};

      //		let observer = new IntersectionObserver(handleIntersect, options);

      //		let targets = document.querySelectorAll(".observe-me");

      //		targets.forEach((target, index) => {
      //			observer.observe(target);
      //			target.style.setProperty('--delay', `${index / 4}s`);
      //		});
      //	}

      //	createObserver();
      //}
    });
  };
  function toBoolean(string) {
    return string === "true" ? true : false;
  }
  document.addEventListener("DOMContentLoaded", function () {
    multicolumnSlider();
    document.addEventListener("shopify:section:load", function () {
      multicolumnSlider();
    });
  });
})();
