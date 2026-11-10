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
  const newImage = new Image(previewImage["width"], previewImage["height"]);
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
  document.querySelectorAll(".js-color-swatches-wrapper").forEach((wrapper) => {
    wrapper.querySelectorAll(".js-color-swatches input").forEach((input) => {
      if (input.dataset.swatchBound === "true") return;
      input.dataset.swatchBound = "true";

      input.addEventListener("click", (event) => {
        const primaryImage = wrapper.querySelector(".media--first");
        const secondaryImage = wrapper.querySelector(".media--second");
        const handleProduct = wrapper.dataset.product;

        if (event.currentTarget.checked && primaryImage) {
          if (wrapper.querySelector(".js-color-swatches-link")) {
            wrapper
              .querySelector(".js-color-swatches-link")
              .setAttribute("href", event.currentTarget.dataset.variantLink);
          }
          if (wrapper.querySelector('.card__add-to-cart button[name="add"]')) {
            wrapper
              .querySelector('.card__add-to-cart button[name="add"]')
              .setAttribute("aria-disabled", false);
            if (
              wrapper.querySelector(
                '.card__add-to-cart button[name="add"] > span'
              )
            ) {
              wrapper
                .querySelector('.card__add-to-cart button[name="add"] > span')
                .classList.remove("hidden");
              wrapper
                .querySelector(
                  '.card__add-to-cart button[name="add"] .sold-out-message'
                )
                .classList.add("hidden");
            }
            wrapper.querySelector('.card__add-to-cart input[name="id"]').value =
              event.currentTarget.dataset.variantId;
          }

          const currentColor = event.currentTarget.value;

          jQuery.getJSON(
            window.Shopify.routes.root + `products/${handleProduct}.js`,
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
                    const secondaryImagePathname = new URL(secondaryImage.src)
                      .pathname;
                    const newPrimaryImagePathname = new URL(newPrimaryImage.src)
                      .pathname;

                    if (secondaryImagePathname == newPrimaryImagePathname) {
                      primaryImage.remove();
                      secondaryImage.classList.remove("media--second");
                      secondaryImage.classList.add("media--first");
                      flag = true;
                    }
                  }
                  if (flag == false) {
                    primaryImage.animate(
                      { opacity: [1, 0] },
                      { duration: 200, easing: "ease-in", fill: "forwards" }
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

/* Linked products */
const LINKED_PRODUCT_OPTION_SELECTOR = ".linked-products__option";
const LINKED_PRODUCTS_CARD_SELECTOR =
  ".card-wrapper[data-linked-products='true']";

const parseLinkedProductsData = (wrapper) => {
  const dataElement = wrapper.querySelector("[data-linked-products-data]");
  if (!dataElement) return null;

  const content = dataElement.textContent?.trim();
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

const setActiveLinkedOption = (wrapper, option) => {
  wrapper
    .querySelectorAll(LINKED_PRODUCT_OPTION_SELECTOR)
    .forEach((element) => {
      element.classList.remove("active");
      element.removeAttribute("aria-current");
    });

  option.classList.add("active");
  option.setAttribute("aria-current", "true");
};

const swapLinkedProduct = (wrapper, data) => {
  const cardInner = wrapper.querySelector(".card__inner");
  if (cardInner && data.media_html != null) {
    const slider = cardInner.querySelector(".product-card-js");
    if (slider?.swiper) slider.swiper.destroy(true, false);
    cardInner.innerHTML = data.media_html;
  }

  const informationInner = wrapper.querySelector(".card-information__inner");
  if (informationInner && data.info_html != null) {
    informationInner.innerHTML = data.info_html;
  }

  const parameters = wrapper.querySelector(".product-parameters");
  if (parameters) {
    parameters.innerHTML = `${data.options_html || ""}${
      data.quick_add_html || ""
    }`;
  }

  if (data.url) {
    wrapper
      .querySelectorAll(":scope > .card-wrapper__link--overlay")
      .forEach((link) => link.setAttribute("href", data.url));
  }

  if (data.handle) wrapper.dataset.product = data.handle;

  const hiddenTitle = wrapper.querySelector(":scope > .visually-hidden");
  if (hiddenTitle && data.title != null) hiddenTitle.textContent = data.title;

  if (typeof loadeMoreSlider_G === "function" && loadeMoreSlider_G != null) {
    loadeMoreSlider_G();
  }
  checkSwatches();
};

const onLinkedProductClick = (event) => {
  const option = event.target.closest(LINKED_PRODUCT_OPTION_SELECTOR);
  if (!option) return;

  const wrapper = option.closest(LINKED_PRODUCTS_CARD_SELECTOR);
  if (!wrapper) return;

  event.preventDefault();
  event.stopPropagation();

  if (option.classList.contains("active")) return;

  const linkedProductId = option.dataset.linkedProductId;
  if (!linkedProductId) return;

  const linkedProducts = parseLinkedProductsData(wrapper);
  const data = linkedProducts?.find(
    (item) => String(item.id) === String(linkedProductId)
  );
  if (!data) return;

  setActiveLinkedOption(wrapper, option);
  swapLinkedProduct(wrapper, data);
};

function colorSwatches() {
  checkSwatches();

  document.addEventListener("shopify:section:load", function () {
    checkSwatches();
  });
}

(function () {
  colorSwatches();
  document.addEventListener("click", onLinkedProductClick);
})();
