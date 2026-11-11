/*
 * Cart page - "Figma" style
 * 1. Quantity list (Figma 7:2251): custom listbox over the native select.
 *    Picking an option sets the select and fires "change", so cart.js
 *    (CartItems) updates the cart exactly as before.
 * 2. Sticky checkout bar on mobile (Figma 7:2424): shown while the summary
 *    checkout button is below the screen.
 * Listeners are delegated, so they keep working after cart.js re-renders.
 */
(function () {
  if (window.cartFigmaInit) return;
  window.cartFigmaInit = true;

  /* ---------- 1. Quantity list */
  function closeAll(except) {
    document.querySelectorAll('[data-cart-qty].is-open').forEach(function (wrap) {
      if (wrap === except) return;
      wrap.classList.remove('is-open');
      var button = wrap.querySelector('[data-cart-qty-toggle]');
      var list = wrap.querySelector('.cart-figma__qty-list');
      if (button) button.setAttribute('aria-expanded', 'false');
      if (list) list.hidden = true;
    });
  }

  function open(wrap) {
    closeAll(wrap);
    var button = wrap.querySelector('[data-cart-qty-toggle]');
    var list = wrap.querySelector('.cart-figma__qty-list');
    if (!list) return;
    wrap.classList.add('is-open');
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    var selected = list.querySelector('[aria-selected="true"]') || list.querySelector('[role="option"]');
    if (selected) {
      selected.focus({ preventScroll: true });
      list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2;
    }
  }

  function choose(option) {
    var wrap = option.closest('[data-cart-qty]');
    var select = wrap && wrap.querySelector('select');
    var button = wrap && wrap.querySelector('[data-cart-qty-toggle]');
    closeAll();
    if (!select) return;
    if (button) button.focus({ preventScroll: true });
    if (select.value === option.dataset.value) return;
    select.value = option.dataset.value;
    wrap.querySelector('.cart-figma__select-value').textContent = option.textContent.trim();
    wrap.querySelectorAll('[role="option"]').forEach(function (item) {
      item.setAttribute('aria-selected', item === option ? 'true' : 'false');
    });
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-cart-qty-toggle]');
    if (toggle) {
      var wrap = toggle.closest('[data-cart-qty]');
      if (wrap.classList.contains('is-open')) closeAll();
      else open(wrap);
      return;
    }
    var option = event.target.closest('.cart-figma__qty-option');
    if (option) {
      choose(option);
      return;
    }
    if (!event.target.closest('[data-cart-qty]')) closeAll();
  });

  document.addEventListener('keydown', function (event) {
    var wrap = event.target.closest && event.target.closest('[data-cart-qty]');
    if (!wrap) return;
    var isOpen = wrap.classList.contains('is-open');
    var options = Array.prototype.slice.call(wrap.querySelectorAll('[role="option"]'));
    var index = options.indexOf(document.activeElement);

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeAll();
      wrap.querySelector('[data-cart-qty-toggle]').focus();
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !isOpen) {
      event.preventDefault();
      open(wrap);
    } else if (event.key === 'ArrowDown' && isOpen) {
      event.preventDefault();
      (options[index + 1] || options[options.length - 1]).focus();
    } else if (event.key === 'ArrowUp' && isOpen) {
      event.preventDefault();
      (options[index - 1] || options[0]).focus();
    } else if ((event.key === 'Enter' || event.key === ' ') && index > -1) {
      event.preventDefault();
      choose(options[index]);
    } else if (event.key === 'Tab' && isOpen) {
      closeAll();
    }
  });

  /* ---------- 2. Sticky checkout bar (mobile) */
  var mobile = window.matchMedia('(max-width: 989px)');
  var ticking = false;

  function updateSticky() {
    ticking = false;
    var bar = document.querySelector('[data-cart-sticky]');
    if (!bar) return;
    var footer = document.getElementById('main-cart-footer');
    var ctas = footer && footer.querySelector('.cart-figma__ctas');
    var empty = !footer || footer.classList.contains('is-empty');
    var show = false;
    if (mobile.matches && ctas && !empty) {
      // visible while the summary checkout button is still below the screen
      show = ctas.getBoundingClientRect().top > window.innerHeight;
    }
    bar.classList.toggle('is-visible', show);
    bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (show) bar.removeAttribute('inert');
    else bar.setAttribute('inert', '');
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateSticky);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  if (mobile.addEventListener) mobile.addEventListener('change', requestUpdate);
  document.addEventListener('cart:change', function () {
    window.setTimeout(requestUpdate, 100);
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', requestUpdate);
  } else {
    requestUpdate();
  }
})();
