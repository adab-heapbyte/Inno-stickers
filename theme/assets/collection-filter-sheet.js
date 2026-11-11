/**
 * Collection "Catalog" style - Filter / Sort sheets (Figma PLP bottom sheets).
 *
 * The filter panel itself is the theme's facets drawer (facets.js opens it and
 * applies every change). This file adds what the design needs on top:
 * - "Show N results" and the close icon close the filter drawer,
 * - the Sort sheet (radio list named sort_by inside the facets form; facets.js
 *   submits it on change) opens / closes, and closes after a choice,
 * - "+N more" in long checkbox groups,
 * - Escape closes whichever sheet is open.
 * Uses event delegation because facets.js re-renders the filter groups.
 */
(() => {
  if (window.collectionFilterSheetReady) return;
  window.collectionFilterSheetReady = true;

  const body = document.body;

  const closeFilterDrawer = () => {
    document.querySelectorAll('.collection-wrapper--catalog .facets__container.active').forEach((container) => {
      container.classList.remove('active');
    });
    body.classList.remove('overflow-hidden');
    setTimeout(() => body.classList.remove('filter-open'), 700);
    document.querySelectorAll('.collection-wrapper--catalog .facets__button-show').forEach((button) => {
      button.querySelector('.label-hide')?.classList.remove('hidden');
      button.querySelector('.label-show')?.classList.add('hidden');
    });
  };

  const openSortSheet = (sheet) => {
    if (!sheet) return;
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('is-open'));
    // same page state the theme uses for the filter drawer (lifts the section above the header)
    body.classList.add('overflow-hidden', 'filter-open');
    (sheet.querySelector('input:checked') || sheet.querySelector('input'))?.focus({ preventScroll: true, focusVisible: false });
  };

  const closeSortSheet = (sheet) => {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('is-open');
    body.classList.remove('overflow-hidden');
    setTimeout(() => {
      sheet.hidden = true;
      if (!document.querySelector('.facets__container.active')) body.classList.remove('filter-open');
    }, 300);
  };

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (target.closest('[data-filter-sheet-close]')) {
      event.preventDefault();
      closeFilterDrawer();
      return;
    }

    const sortOpen = target.closest('[data-sort-sheet-open]');
    if (sortOpen) {
      event.preventDefault();
      const id = sortOpen.getAttribute('aria-controls');
      openSortSheet(id ? document.getElementById(id) : sortOpen.closest('form')?.querySelector('[data-sort-sheet]'));
      return;
    }

    if (target.closest('[data-sort-sheet-close]')) {
      event.preventDefault();
      closeSortSheet(target.closest('[data-sort-sheet]'));
      return;
    }

    const more = target.closest('[data-facet-more]');
    if (more) {
      event.preventDefault();
      more.closest('.catalog-sheet__group')?.classList.toggle('is-expanded');
    }
  });

  // A sort choice applies (facets.js listens to the form "input" event) and closes the sheet
  document.addEventListener('change', (event) => {
    if (!event.target.matches('.catalog-sort-sheet__input')) return;
    setTimeout(() => closeSortSheet(event.target.closest('[data-sort-sheet]')), 150);
  });

  document.addEventListener('keyup', (event) => {
    if (event.code !== 'Escape') return;
    document.querySelectorAll('[data-sort-sheet].is-open').forEach(closeSortSheet);
    if (document.querySelector('.collection-wrapper--catalog .facets__container.active')) closeFilterDrawer();
  });
})();
