if (!customElements.get('collection-room-toggle')) {
  /**
   * Collection "Products / Room" switch (Figma PLP toolbar).
   * The state lives on <html> (class "collection-room-view") so it survives the
   * filter / sort / pagination re-renders of the product grid, and is
   * remembered for the visit (sessionStorage).
   */
  const STORAGE_KEY = 'collection-room-view';
  const ROOT_CLASS = 'collection-room-view';

  const readState = () => {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (error) {
      return false;
    }
  };

  const writeState = (isRoom) => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, isRoom ? '1' : '0');
    } catch (error) {
      /* storage unavailable: the toggle still works for this page */
    }
  };

  class CollectionRoomToggle extends HTMLElement {
    connectedCallback() {
      this.switch = this.querySelector('.facets__room-toggle-switch');
      if (!this.switch) return;

      this.onClick = () => this.setRoom(!document.documentElement.classList.contains(ROOT_CLASS));
      this.switch.addEventListener('click', this.onClick);

      // Clicking a label also switches to that view
      this.querySelector('.facets__room-toggle-label--products')?.addEventListener('click', () => this.setRoom(false));
      this.querySelector('.facets__room-toggle-label--room')?.addEventListener('click', () => this.setRoom(true));

      this.setRoom(readState(), false);
    }

    disconnectedCallback() {
      this.switch?.removeEventListener('click', this.onClick);
    }

    setRoom(isRoom, persist = true) {
      document.documentElement.classList.toggle(ROOT_CLASS, isRoom);
      document.querySelectorAll('.facets__room-toggle-switch').forEach((button) => {
        button.setAttribute('aria-checked', isRoom ? 'true' : 'false');
      });
      if (persist) writeState(isRoom);
    }
  }

  customElements.define('collection-room-toggle', CollectionRoomToggle);
}
