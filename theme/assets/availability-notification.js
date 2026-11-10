if (!customElements.get("availability-notification")) {
  customElements.define(
    "availability-notification",
    class AvailabilityNotification extends HTMLElement {
      constructor() {
        super();
        this.onVariantChange = this.onVariantChange.bind(this);
        this.onOpenButtonClick = this.onOpenButtonClick.bind(this);
        this.restoreSubmittedState = this.restoreSubmittedState.bind(this);
      }

      connectedCallback() {
        this.sectionId = this.dataset.sectionId;
        this.openButton = this.querySelector(
          "[data-availability-notification-open]"
        );

        this.removeStaleModals();
        this.openButton?.addEventListener("click", this.onOpenButtonClick);
        document.addEventListener("variant:change", this.onVariantChange);

        if (document.readyState === "loading") {
          document.addEventListener(
            "DOMContentLoaded",
            this.restoreSubmittedState,
            {
              once: true,
            }
          );
        } else {
          this.restoreSubmittedState();
        }
      }

      disconnectedCallback() {
        this.openButton?.removeEventListener("click", this.onOpenButtonClick);
        document.removeEventListener("variant:change", this.onVariantChange);
        document.removeEventListener(
          "DOMContentLoaded",
          this.restoreSubmittedState
        );
      }

      // The modal moves itself to the end of the body once connected, so it is
      // always looked up from the document instead of from this element.
      get modal() {
        return document.getElementById(
          `AvailabilityNotificationModal-${this.sectionId}`
        );
      }

      // Because the modal is moved out of the section, reloading the section in
      // the theme editor leaves the previous copy behind. The freshly rendered
      // modal is always the last one appended to the body.
      removeStaleModals() {
        const modals = document.querySelectorAll(
          `[id="AvailabilityNotificationModal-${this.sectionId}"]`
        );
        if (modals.length < 2) return;

        Array.from(modals)
          .slice(0, -1)
          .forEach((modal) => modal.remove());
      }

      onVariantChange(event) {
        if (event.detail?.sectionId !== this.sectionId) return;

        this.resetStatus();
        this.syncVariantInfo();
      }

      onOpenButtonClick() {
        this.syncVariantInfo();
      }

      // Keeps the variant shown inside the modal, the submitted product options
      // and the return URL in sync with the currently selected variant.
      syncVariantInfo() {
        const modal = this.modal;
        if (!modal) return;

        const selectedOptions = this.getSelectedOptions();

        if (selectedOptions !== null) {
          const optionsElement = modal.querySelector(
            "[data-availability-notification-options]"
          );
          const optionsInput = modal.querySelector(
            "[data-availability-notification-options-input]"
          );

          if (optionsElement) optionsElement.textContent = selectedOptions;
          if (optionsInput) optionsInput.value = selectedOptions;
        }

        const variantId = this.getSelectedVariantId();
        const returnInput = modal.querySelector(
          "[data-availability-notification-return]"
        );

        if (variantId && returnInput) {
          returnInput.value = returnInput.value.replace(
            /variant=\d+/,
            `variant=${variantId}`
          );
        }
      }

      // Reads the selected option values straight from the variant picker so that
      // products with a large number of variants and unavailable option
      // combinations are handled the same way as regular products.
      getSelectedOptions() {
        const picker = document.querySelector(
          `variant-radios[data-section="${this.sectionId}"], variant-selects[data-section="${this.sectionId}"]`
        );
        if (!picker) return null;

        const fieldsets = Array.from(picker.querySelectorAll("fieldset"));
        const values = fieldsets.length
          ? fieldsets.map(
              (fieldset) =>
                Array.from(
                  fieldset.querySelectorAll('input[type="radio"]')
                ).find((radio) => radio.checked)?.value
            )
          : Array.from(
              picker.querySelectorAll("select"),
              (select) => select.value
            );

        return values.filter(Boolean).join(" / ");
      }

      getSelectedVariantId() {
        const productForm = document.getElementById(
          `product-form-${this.sectionId}`
        );
        return productForm?.querySelector('input[name="id"]')?.value || "";
      }

      resetStatus() {
        this.removeAttribute("data-status");
        this.modal
          ?.querySelectorAll("[data-availability-notification-message]")
          .forEach((message) => message.remove());
      }

      // The contact form reloads the product page on submit, so the success state
      // is restored from the URL left behind by the redirect.
      restoreSubmittedState() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("contact_posted") !== "true") return;

        const hash = window.location.hash;
        const belongsToThisForm =
          hash === "" || hash.startsWith("#AvailabilityNotificationForm-");
        const hasSuccessMessage = !!this.modal?.querySelector(
          "[data-availability-notification-success]"
        );

        if (belongsToThisForm && hasSuccessMessage) {
          this.setAttribute("data-status", "success");
        }
      }
    }
  );
}
