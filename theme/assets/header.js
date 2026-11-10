(function () {
  const DESKTOP_MIN_WIDTH = 1100;
  const OVERLAY_CLASS = "color-background-2";
  const OVERLAY_BACKGROUND_CLASS = "have-background";
  const STICKY_CLASS = "shopify-section-header-sticky";
  const ENTERING_SECTION_CLASS = "entering-section";
  let teardown = [];

  const initHeader = () => {
    teardown.forEach((remove) => remove());
    teardown = [];

    const header = document.querySelector(".shopify-section-header");
    if (!header) return;

    const headerAlways = document.querySelector(".header-always");
    const headerWrapper = document.querySelector(".header-wrapper");
    const headerBackgroundColorScheme =
      headerWrapper?.dataset.backgroundColorScheme || "color-background-1";
    const stickyType = headerWrapper?.dataset.stickyType || "none";

    if (headerAlways) {
      header.classList.add("always-show");
    }

    const menu = document.querySelector(".list-menu--inline");
    const menuLinks = document.querySelectorAll(".list-menu-item");
    const search = document.querySelector(".header__search");

    const onKeydown = (e) => {
      if (e.code === "Escape" && search?.isOpen) {
        search.close();
      }
    };

    header.addEventListener("keydown", onKeydown);
    teardown.push(() => header.removeEventListener("keydown", onKeydown));

    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);

    const annBar = document.querySelector(".section-announcement");
    if (annBar) {
      const annBarObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;

        if (entry.isIntersecting) {
          document.documentElement.style.setProperty(
            "--ann-height",
            `${entry.intersectionRect.height}px`
          );
        } else {
          document.documentElement.style.setProperty("--ann-height", `0px`);
        }
      });

      annBarObserver.observe(annBar);
      teardown.push(() => annBarObserver.disconnect());
    }

    //menuLinks &&
    //	menuLinks.forEach((link) => {
    //		link.addEventListener("mouseenter", (e) => {
    //			if (link.classList.contains("list-menu--megamenu")) {
    //				link.classList.add("list-menu--megamenu-visible");
    //				if (
    //					header.classList.contains("color-background-2") &&
    //					!header.classList.contains("shopify-section-header-sticky")
    //				) {
    //					header.classList.remove("color-background-2");
    //				}

    //				menuLinks.forEach((el) => {
    //					if (el !== link) {
    //						el.classList.remove("list-menu--megamenu-visible");
    //					}
    //				});
    //			} else {
    //				menuLinks.forEach((el) => {
    //					el.classList.remove("list-menu--megamenu-visible");
    //				});
    //			}
    //		});
    //	});
    //menu &&
    //	menu.addEventListener("mouseleave", (e) => {
    //		menuLinks.forEach((link) => {
    //			link.classList.remove("list-menu--megamenu-visible");
    //		});
    //	});

    let isHovered = false;
    let isFocused = false;
    let hoverChanges = null;

    const isDrawerOpen = () =>
      document.querySelector(".overflow-hidden-drawer") !== null;

    const isModalOpen = () => document.querySelector(".overflow-hidden") !== null;

    const stickyOwnsBackground = () => {
      if (!header.classList.contains(STICKY_CLASS)) return false;
      return header.dataset.headerOverOverlay !== "true";
    };

    const syncOverlayBackground = () => {
      if (header.dataset.headerOverlay !== "true") return;
      if (hoverChanges) return;

      if (stickyOwnsBackground()) {
        header.classList.remove(OVERLAY_CLASS);
      } else {
        header.classList.add(OVERLAY_CLASS);
      }
    };

    const addBackground = () => {
      if (hoverChanges) return;
      if (isDrawerOpen()) return;
      if (header.classList.contains("always-show")) return;
      if (stickyOwnsBackground()) return;
      if (header.clientWidth < DESKTOP_MIN_WIDTH) return;

      hoverChanges = {
        overlayRemoved: header.classList.contains(OVERLAY_CLASS),
        backgroundAdded:
          header.classList.contains("section--has-overlay") &&
          !header.classList.contains(OVERLAY_BACKGROUND_CLASS),
      };

      header.dataset.headerHovered = "true";

      if (hoverChanges.overlayRemoved) {
        header.classList.remove(OVERLAY_CLASS);
      }

      if (hoverChanges.backgroundAdded) {
        header.classList.add(OVERLAY_BACKGROUND_CLASS);
      }
    };

    const removeBackground = () => {
      if (!hoverChanges) return;

      if (isDrawerOpen() || isModalOpen()) {
        hoverChanges = null;
        delete header.dataset.headerHovered;
        return;
      }

      const changes = hoverChanges;
      hoverChanges = null;
      delete header.dataset.headerHovered;

      if (changes.backgroundAdded) {
        header.classList.remove(OVERLAY_BACKGROUND_CLASS);
      }

      if (changes.overlayRemoved && !stickyOwnsBackground()) {
        header.classList.add(OVERLAY_CLASS);
      }
    };

    const syncBackground = () => {
      if (isHovered || isFocused) {
        addBackground();
      } else {
        removeBackground();
      }
    };

    const onMouseEnter = () => {
      isHovered = true;
      syncBackground();
    };

    const onMouseLeave = () => {
      isHovered = false;
      syncBackground();
    };

    const onFocusIn = () => {
      isFocused = true;
      syncBackground();
    };

    const onFocusOut = (event) => {
      if (event.relatedTarget && header.contains(event.relatedTarget)) return;
      isFocused = false;
      syncBackground();
    };

    header.addEventListener("mouseenter", onMouseEnter);
    header.addEventListener("mouseleave", onMouseLeave);
    header.addEventListener("focusin", onFocusIn);
    header.addEventListener("focusout", onFocusOut);

    teardown.push(() => {
      header.removeEventListener("mouseenter", onMouseEnter);
      header.removeEventListener("mouseleave", onMouseLeave);
      header.removeEventListener("focusin", onFocusIn);
      header.removeEventListener("focusout", onFocusOut);
    });

    const firstSection = document.querySelector(
      "main .shopify-section:first-child:not(.not-margin) .section--has-overlay:not(.article-template__header)"
    );

    if (firstSection) {
      let isSectionVisible = false;

      const sectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isSectionVisible) {
            isSectionVisible = true;
            header.classList.add(ENTERING_SECTION_CLASS);
          } else if (!entry.isIntersecting && isSectionVisible) {
            isSectionVisible = false;
            header.classList.remove(ENTERING_SECTION_CLASS);
          }
        },
        { threshold: 0.15 }
      );

      sectionObserver.observe(firstSection);
      teardown.push(() => sectionObserver.disconnect());

      let overlapObserver = null;

      const observeOverlap = () => {
        if (overlapObserver) overlapObserver.disconnect();

        const headerHeight = Math.round(header.getBoundingClientRect().height);
        const topInset = Math.max(headerHeight - 1, 0);
        const bottomInset = Math.max(window.innerHeight - headerHeight, 0);

        overlapObserver = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              header.dataset.headerOverOverlay = "true";
            } else {
              delete header.dataset.headerOverOverlay;
            }
            syncOverlayBackground();
          },
          { rootMargin: `-${topInset}px 0px -${bottomInset}px 0px` }
        );

        overlapObserver.observe(firstSection);
      };

      observeOverlap();
      teardown.push(() => overlapObserver?.disconnect());

      let resizeFrame = null;
      const onResize = () => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(observeOverlap);
      };

      window.addEventListener("resize", onResize);
      teardown.push(() => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        window.removeEventListener("resize", onResize);
      });

      const onScroll = () => {
        if (isSectionVisible) header.classList.add(ENTERING_SECTION_CLASS);
        syncOverlayBackground();
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      teardown.push(() => window.removeEventListener("scroll", onScroll));
    }

    //const megaMenuListLinks = () => {
    //	const megaMenuLinkWithSubmenu = document.querySelector(
    //		".mega-menu__list-item--children"
    //	);
    //	const megaMenuLinks = document.querySelectorAll(".mega-menu__list-item");
    //	if (megaMenuLinkWithSubmenu) {
    //		megaMenuLinks.forEach((link) => {
    //			link.classList.add("mega-menu__list-item--opacity");
    //		});
    //		megaMenuLinkWithSubmenu.classList.remove(
    //			"mega-menu__list-item--opacity"
    //		);
    //		megaMenuLinkWithSubmenu.classList.add("mega-menu__list-item--visible");
    //	}
    //	$(".mega-menu__list-item").mouseenter(function (event) {
    //		if (megaMenuLinkWithSubmenu) {
    //			megaMenuLinkWithSubmenu.classList.remove(
    //				"mega-menu__list-item--visible"
    //			);
    //		}
    //		$(this).removeClass("mega-menu__list-item--opacity");
    //		$(this).siblings().addClass("mega-menu__list-item--opacity");
    //		$(this).mouseleave(() => {
    //			$(this).siblings().removeClass("mega-menu__list-item--opacity");
    //		});
    //	});
    //	$(".mega-menu__list-item").focus(function (event) {
    //		if (megaMenuLinkWithSubmenu) {
    //			megaMenuLinkWithSubmenu.classList.remove(
    //				"mega-menu__list-item--visible"
    //			);
    //		}
    //		$(this).removeClass("mega-menu__list-item--opacity");
    //		$(this).siblings().addClass("mega-menu__list-item--opacity");
    //		$(this).mouseleave(() => {
    //			$(this).siblings().removeClass("mega-menu__list-item--opacity");
    //		});
    //	});
    //};

    //const megaMenuSublinks = () => {
    //	$(".mega-menu--list .mega-menu__submenu-item").mouseenter(function (
    //		event
    //	) {
    //		$(this).removeClass("mega-menu__submenu-item--opacity");
    //		$(this)
    //			.parent()
    //			.siblings()
    //			.find(".mega-menu__submenu-item")
    //			.addClass("mega-menu__submenu-item--opacity");
    //		$(this).mouseleave(() => {
    //			$(this)
    //				.parent()
    //				.siblings()
    //				.find(".mega-menu__submenu-item")
    //				.removeClass("mega-menu__submenu-item--opacity");
    //		});
    //	});
    //	$(".mega-menu--list .mega-menu__submenu-item").focusin(function (event) {
    //		$(this).removeClass("mega-menu__submenu-item--opacity");
    //		$(this)
    //			.parent()
    //			.siblings()
    //			.find(".mega-menu__submenu-item")
    //			.addClass("mega-menu__submenu-item--opacity");
    //		$(this).focusout(() => {
    //			$(this)
    //				.parent()
    //				.siblings()
    //				.find(".mega-menu__submenu-item")
    //				.removeClass("mega-menu__submenu-item--opacity");
    //		});
    //	});
    //};
    //megaMenuListLinks();
    //megaMenuSublinks();

    const initSubmenuMedia = () => {
      document
        .querySelectorAll(".header__submenu--with-media")
        .forEach((submenu) => {
          if (submenu.dataset.submenuMediaBound) return;
          submenu.dataset.submenuMediaBound = "true";

          const media = submenu.querySelector("[data-submenu-media]");
          const image = submenu.querySelector("[data-submenu-media-image]");
          if (!media || !image) return;

          const showImage = (link) => {
            const src = link.dataset.submenuMediaSrc;
            if (!src) {
              media.classList.add("is-hidden");
              return;
            }
            image.src = src;
            image.alt = link.dataset.submenuMediaAlt || "";
            media.classList.remove("is-hidden");
          };

          const hideImage = () => {
            media.classList.add("is-hidden");
          };

          submenu
            .querySelectorAll("[data-submenu-media-link]")
            .forEach((link) => {
              link.addEventListener("mouseenter", () => showImage(link));
              link.addEventListener("focus", () => showImage(link));
            });

          const menuItem = submenu.closest(".list-menu-item");
          if (menuItem) {
            menuItem.addEventListener("mouseleave", hideImage);
            menuItem.addEventListener("focusout", (e) => {
              if (!menuItem.contains(e.relatedTarget)) hideImage();
            });
          }
        });
    };

    initSubmenuMedia();

    const main = document.querySelector("main");
    const breadcrumbs = document.querySelector(".breadcrumbs-wrapper");
    const firstMainSection = main?.querySelectorAll(".shopify-section")[0];
    if (
      firstMainSection?.classList.contains("section--has-overlay") &&
      !firstMainSection.classList.contains("not-margin")
    ) {
      header.classList.add(headerBackgroundColorScheme, OVERLAY_CLASS);
      header.dataset.headerOverlay = "true";
      if (breadcrumbs) {
        breadcrumbs.classList.add(OVERLAY_CLASS);
      }
    }
  };

  initHeader();

  document.addEventListener("shopify:section:load", initHeader);
  document.addEventListener("shopify:section:unload", initHeader);
  document.addEventListener("shopify:section:reorder", initHeader);
})();
