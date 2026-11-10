class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);

    const facetForm = this.querySelector("form");
    facetForm.addEventListener("input", FacetFiltersForm.syncFacetInputs);
    facetForm.addEventListener("input", this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector(".facets__wrapper");
    if (facetWrapper) facetWrapper.addEventListener("keyup", onKeyUpEscape);

    const facetButton = this.querySelector(".facets__button-show");
    const sidebarToggleButton = this.querySelector(".modal-sidebar-toggle-button");

    if (sidebarToggleButton) {
      const sidebarInner = sidebarToggleButton.closest(
        ".collection-sidebar__inner"
      );

      sidebarToggleButton.addEventListener("click", function() {
        if (!sidebarInner) {
          this.classList.toggle("active");
          return;
        }

        // Capture the current width before the state change.
        const startWidth = sidebarInner.offsetWidth;

        this.classList.toggle("active");
        sidebarInner.classList.toggle(
          "collection-sidebar__inner--collapsed",
          !this.classList.contains("active")
        );

        sidebarInner.style.width = "";
        const targetWidth = sidebarInner.offsetWidth;

        sidebarInner.style.width = `${startWidth}px`;
        void sidebarInner.offsetWidth; // force reflow to lock the start width
        sidebarInner.style.width = `${targetWidth}px`;

        sidebarInner.addEventListener(
          "transitionend",
          (event) => {
            if (event.propertyName !== "width") return;
            sidebarInner.style.width = "";
          },
          { once: true }
        );
      });
    }

    const facetsContainer = this.querySelector(".facets__container");
    if (facetsContainer) {
      setTimeout(() => {
        facetsContainer.style.display = "flex";
      }, 600);
    }

    if (facetButton) {
      facetButton.onclick = (event) => {
        let labelHide = event.currentTarget.querySelector(".label-hide");
        let labelShow = event.currentTarget.querySelector(".label-show");

        labelHide.classList.toggle("hidden");
        labelShow.classList.toggle("hidden");

        let container = labelHide
          .closest("form")
          .querySelector(".facets__container");

        if (!container) {
          return;
        }

        container.classList.toggle("active");
        document.body.classList.toggle(`overflow-hidden`);
        document.body.classList.toggle("filter-open");

        if (
          document.querySelector(
            ".facets__container--horizontal:not(.active)"
          ) != null
        ) {
          let horizontalFilters = document.querySelector(
            ".facets__container--horizontal:not(.active)"
          );
          horizontalFilters.classList.add("visible_container");

          setTimeout(
            () => horizontalFilters.classList.remove("visible_container"),
            600
          );
        }

        container.addEventListener("click", (event) => {
          if (!event.target.closest(".facets__wrapper")) {
            container.classList.remove("active");
            document.body.classList.remove(`overflow-hidden`);

            setTimeout(
              () => document.body.classList.remove(`filter-open`),
              700
            );
          }
        });
      };

      if (document.getElementById("SortBy") != null) {
        let select = document.getElementById("SortBy");
        select.addEventListener("click", () => select.classList.toggle("open"));
        select.addEventListener("blur", () => select.classList.remove("open"));
      }

      const facetCloseButton = this.querySelector(".facets-modal__close");
      facetCloseButton?.addEventListener("click", () => {
        let container = facetCloseButton.closest(".facets__container");
        container.classList.remove("active");
        document.body.classList.remove(`overflow-hidden`);
        setTimeout(() => document.body.classList.remove(`filter-open`), 700);
      });

      const collectionGridSection =
        document.querySelector(".collection-grid-section") ||
        document.querySelector(".section-search");
      let prevWidth = 0;
      const sectionResizeObserver = new ResizeObserver((entries) => {
        const [entry] = entries;
      });
      sectionResizeObserver.observe(collectionGridSection);
    }

    const checkboxes = document.querySelectorAll(
      '#FacetFiltersFormMobile .js-filter input[type="checkbox"]'
    );
    const removebtn = document.querySelector(
      "#FacetFiltersFormMobile .facets-tag-wrapper"
    );
    const allChecked = Array.from(checkboxes).some(
      (checkbox) => checkbox.checked
    );

    if (allChecked) {
      removebtn?.classList.remove("active");
    } else {
      removebtn?.classList.add("active");
    }
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state
        ? event.state.searchParams
        : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener("popstate", onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll(".js-facet-remove").forEach((element) => {
      element.classList.toggle("disabled", disable);
    });
  }

  static syncFacetInputs(event) {
    const source = event.target;
    if (!source || !source.name) return;

    const sourceForm = source.closest("form");
    const forms = document.querySelectorAll("facet-filters-form form");

    forms.forEach((form) => {
      if (form === sourceForm) return;

      if (source.type === "checkbox" || source.type === "radio") {
        form
          .querySelectorAll(
            `input[name="${CSS.escape(source.name)}"][value="${CSS.escape(
              source.value
            )}"]`
          )
          .forEach((target) => {
            if (target.checked !== source.checked) {
              target.checked = source.checked;
            }
          });
      } else {
        form
          .querySelectorAll(`[name="${CSS.escape(source.name)}"]`)
          .forEach((target) => {
            if (target !== source && target.value !== source.value) {
              target.value = source.value;
            }
          });
      }
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById("ProductCount");
    const countContainerDesktop = document.getElementById(
      "ProductCountDesktop"
    );
    const countContainerSidebar = document.getElementById(
      "ProductCountSidebar"
    );
    document
      .getElementById("ProductGridContainer")
      .querySelector(".collection")
      .classList.add("loading");
    if (countContainer) {
      countContainer.classList.add("loading");
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add("loading");
    }
    if (countContainerSidebar) {
      countContainerSidebar.classList.add("loading");
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [
          ...FacetFiltersForm.filterData,
          { html, url },
        ];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);

        FacetFiltersForm.rerenderProductSliders();
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    FacetFiltersForm.rerenderProductSliders();
  }

  static renderProductGridContainer(html) {
    document.getElementById("ProductGridContainer").innerHTML = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("ProductGridContainer").innerHTML;
    if (
      document.querySelector(".js-load-more") ||
      document.querySelector(".js-infinite-scroll")
    )
      loadMore();

    colorSwatches();
  }

  static renderProductCount(html) {
    const count = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("ProductCount").innerHTML;
    const container = document.getElementById("ProductCount");
    const containerDesktop = document.getElementById("ProductCountDesktop");
    const containerSidebar = document.getElementById("ProductCountSidebar");
    if (container) {
      container.innerHTML = count;
      container.classList.remove("loading");
    }
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove("loading");
    }
    if (containerSidebar) {
      containerSidebar.innerHTML = count;
      containerSidebar.classList.remove("loading");
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, "text/html");

    const jsFilter = event ? event.target.closest(".js-filter") : undefined;
    const interactedIndex = jsFilter ? jsFilter.dataset.index : null;

    const facetFormIds = [
      "FacetFiltersForm",
      "FacetFiltersFormSidebar",
      "FacetFiltersFormMobile",
      "FacetFiltersPillsForm",
    ];
    facetFormIds.forEach((formId) => {
      const parsedForm = parsedHTML.getElementById(formId);
      const liveForm = document.getElementById(formId);
      if (!parsedForm || !liveForm) return;

      parsedForm.querySelectorAll(".js-filter").forEach((parsedFilter) => {
        const index = parsedFilter.dataset.index;
        if (index === interactedIndex) return;
        const liveFilter = liveForm.querySelector(
          `.js-filter[data-index="${index}"]`
        );
        if (liveFilter) liveFilter.innerHTML = parsedFilter.innerHTML;
      });
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (interactedIndex && jsFilter) {
      const countsToRender = parsedHTML.querySelector(
        `.js-filter[data-index="${interactedIndex}"]`
      );
      if (countsToRender) FacetFiltersForm.renderCounts(countsToRender, jsFilter);
    }

    const checkboxes = document.querySelectorAll(
      '#FacetFiltersFormMobile .js-filter input[type="checkbox"]'
    );
    const removebtn = document.querySelector(
      "#FacetFiltersFormMobile .facets-tag-wrapper"
    );
    const allChecked = Array.from(checkboxes).some(
      (checkbox) => checkbox.checked
    );

    if (allChecked) {
      removebtn?.classList.remove("active");
    } else {
      removebtn?.classList.add("active");
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = [
      ".active-facets-mobile",
      ".active-facets-desktop",
    ];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelectorAll(selector).forEach((el) => {
        el.innerHTML = activeFacetsElement.innerHTML;
      });
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = [
      ".mobile-facets__open",
      ".mobile-facets__count",
      ".sorting",
    ];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML =
        html.querySelector(selector).innerHTML;
    });
  }

  static renderCounts(source, target) {
    const targetElement = target.querySelector(".facets__selected");
    const sourceElement = source.querySelector(".facets__selected");

    const targetElementAccessibility = target.querySelector(".facets__summary");
    const sourceElementAccessibility = source.querySelector(".facets__summary");

    if (sourceElement && targetElement) {
      target.querySelector(".facets__selected").outerHTML =
        source.querySelector(".facets__selected").outerHTML;
    }

    if (targetElementAccessibility && sourceElementAccessibility) {
      target.querySelector(".facets__summary").outerHTML =
        source.querySelector(".facets__summary").outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState(
      { searchParams },
      "",
      `${window.location.pathname}${searchParams && "?".concat(searchParams)}`
    );
  }

  static getSections() {
    return [
      {
        section: document.getElementById("product-grid").dataset.id,
      },
    ];
  }

  static rerenderProductSliders() {
    // Reuse the shared product card slider init (see product-card-slider.js)
    if (typeof loadeMoreSlider_G !== "function") return;

    loadeMoreSlider_G(document.getElementById("ProductGridContainer"));
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll(
      "facet-filters-form form"
    );
    if (event.srcElement.className == "mobile-facets__checkbox") {
      const searchParams = this.createSearchParams(
        event.target.closest("form")
      );
      this.onSubmitForm(searchParams, event);
    } else {
      const facetFormIds = [
        "FacetSortForm",
        "FacetFiltersForm",
        "FacetFiltersFormSidebar",
        "FacetFiltersFormMobile",
        "FacetSortDrawerForm",
      ];

      document
        .querySelectorAll(".no-js-list")
        .forEach((el) => el.remove());

      const mergedParams = new URLSearchParams();
      const singleValueKeys = new Set(["sort_by", "q", "options[prefix]"]);
      const seen = new Set();

      sortFilterForms.forEach((form) => {
        if (!facetFormIds.includes(form.id)) return;
        new FormData(form).forEach((value, key) => {
          if (singleValueKeys.has(key)) {
            mergedParams.set(key, value);
            return;
          }
          const signature = `${key}=${value}`;
          if (seen.has(signature)) return;
          seen.add(signature);
          mergedParams.append(key, value);
        });
      });

      this.onSubmitForm(mergedParams.toString(), event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf("?") == -1
        ? ""
        : event.currentTarget.href.slice(
            event.currentTarget.href.indexOf("?") + 1
          );
    FacetFiltersForm.renderPage(url);

    // const checkboxes = document.querySelectorAll('#FacetFiltersFormMobile .js-filter input[type="checkbox"]');
    const removebtn = document.querySelector(
      "#FacetFiltersFormMobile .facets-tag-wrapper"
    );
    // const allChecked = Array.from(checkboxes).every(checkbox => !checkbox.checked);
    removebtn?.classList.add("active");

    // if (allChecked) {
    // 	console.log("All checkboxes are checked.");
    // } else {
    // 	console.log("Not all checkboxes are checked.");
    // }
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define("facet-filters-form", FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll("input").forEach((element) =>
      element.addEventListener("change", this.onRangeChange.bind(this))
    );
    this.setMinAndMaxValues();
    this.controlSlider();
    this.controlInput();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll("input");
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute("max", maxInput.value);
    if (minInput.value) maxInput.setAttribute("min", minInput.value);
    if (minInput.value === "") maxInput.setAttribute("min", 0);
    if (maxInput.value === "")
      minInput.setAttribute("max", maxInput.getAttribute("max"));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute("min"));
    const max = Number(input.getAttribute("max"));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }

  fillSlider() {
    const inputRangeWrappers = document.querySelectorAll(
      ".facets__price .facets__range"
    );
    inputRangeWrappers.forEach((inputWrapper) => {
      const inputsRange = inputWrapper.querySelectorAll(".field__range");
      const inputRangeFrom = inputsRange[0];
      const inputRangeTo = inputsRange[1];

      const range = inputRangeTo.max - inputRangeTo.min;
      const fromCurrent = inputRangeFrom.value - inputRangeTo.min;
      const toCurrent = inputRangeTo.value - inputRangeTo.min;
      const minRange = (fromCurrent / range) * 100;
      const maxRange = (toCurrent / range) * 100;

      inputWrapper.setAttribute(
        "style",
        `--range-min: ${minRange}%; --range-max: ${maxRange}%`
      );
    });
  }

  controlSlider() {
    const inputRangeWrappers = document.querySelectorAll(
      ".facets__price .facets__range"
    );
    const inputNumberWrappers = document.querySelectorAll(
      ".facets__price .facets__price-wrapper"
    );

    inputRangeWrappers.forEach((inputWrapper, index) => {
      const inputsRange = inputWrapper.querySelectorAll(".field__range");
      const inputRangeFrom = inputsRange[0];
      const inputRangeTo = inputsRange[1];
      const inputNumberFrom =
        inputNumberWrappers[index].querySelectorAll(".field__input")[0];
      const inputNumberTo =
        inputNumberWrappers[index].querySelectorAll(".field__input")[1];

      inputRangeFrom.oninput = () => {
        const from = parseInt(inputRangeFrom.value, 10);
        const to = parseInt(inputRangeTo.value, 10);
        if (from > to) {
          inputRangeFrom.value = to;
          inputNumberFrom.value = to;
        } else {
          inputNumberFrom.value = from;
        }

        this.fillSlider();
      };

      if (Number(inputRangeTo.value) <= 0) {
        inputRangeTo.style.zIndex = 2;
      } else {
        inputRangeTo.style.zIndex = 0;
      }

      inputRangeTo.oninput = () => {
        const from = parseInt(inputRangeFrom.value, 10);
        const to = parseInt(inputRangeTo.value, 10);
        if (from <= to) {
          inputRangeTo.value = to;
          inputNumberTo.value = to;
        } else {
          inputNumberTo.value = from;
          inputRangeTo.value = from;
        }

        if (Number(inputRangeTo.value) <= 0) {
          inputRangeTo.style.zIndex = 2;
        } else {
          inputRangeTo.style.zIndex = 0;
        }

        this.fillSlider();
      };
    });
  }

  controlInput() {
    const inputRangeWrappers = document.querySelectorAll(
      ".facets__price .facets__range"
    );
    const inputNumberWrappers = document.querySelectorAll(
      ".facets__price .facets__price-wrapper"
    );

    inputNumberWrappers.forEach((inputWrapper, index) => {
      const inputsNumber = inputWrapper.querySelectorAll(".field__input");
      const inputNumberFrom = inputsNumber[0];
      const inputNumberTo = inputsNumber[1];
      const inputRangeFrom =
        inputRangeWrappers[index].querySelectorAll(".field__range")[0];
      const inputRangeTo =
        inputRangeWrappers[index].querySelectorAll(".field__range")[1];

      inputNumberFrom.oninput = () => {
        const from = parseInt(inputNumberFrom.value, 10);
        const to = parseInt(inputNumberTo.value, 10);
        if (!isNaN(from)) {
          inputRangeFrom.value = !isNaN(to) && from > to ? to : from;
        }

        this.fillSlider();
      };

      inputNumberTo.oninput = () => {
        const from = parseInt(inputNumberFrom.value, 10);
        const to = parseInt(inputNumberTo.value, 10);
        if (!isNaN(to)) {
          inputRangeTo.value = !isNaN(from) && to < from ? from : to;
        }

        this.fillSlider();
      };
    });
  }
}

customElements.define("price-range", PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector("a");
    facetLink.setAttribute("role", "button");
    facetLink.addEventListener("click", this.closeFilter.bind(this));
    facetLink.addEventListener("keyup", (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === "SPACE") this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form =
      this.closest("facet-filters-form") ||
      document.querySelector("facet-filters-form");
    form.onActiveFilterClick(event);
  }
}

customElements.define("facet-remove", FacetRemove);
