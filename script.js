/* =========================================================
   Book Haven Bookstore - script.js

   Handles all dynamic behaviour for the site:
     - Subscribe button in the footer of every page      -> alert
     - Add to Cart on the Gallery page                   -> sessionStorage + alert
     - View Cart modal window                            -> reads sessionStorage
     - Clear Cart / Process Order inside the modal       -> clears sessionStorage + alert
     - Feedback / Custom Order form on About Us          -> localStorage + alert

   Storage keys:
     sessionStorage "bookHavenCart"          - array of {title, price}
     localStorage   "bookHavenCustomOrders"  - array of submitted form objects
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ================= Subscribe feature (footer of every page) ================= */
  var subscribeForm = document.getElementById('subscribe-form');
  if (subscribeForm) {
    // Using the submit event means the browser runs its own validation on the
    // required email field first; the alert only fires once the value is valid.
    subscribeForm.addEventListener('submit', function (event) {
      event.preventDefault();
      alert('Thank you for subscribing.');
      subscribeForm.reset();
    });
  }

  /* ================= Gallery page: shopping cart ================= */
  var addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  var cartCountEl = document.getElementById('cart-count');
  var cartTotalEl = document.getElementById('cart-total');
  var viewCartBtn = document.getElementById('view-cart-btn');
  var clearCartBtn = document.getElementById('clear-cart-btn');
  var processOrderBtn = document.getElementById('process-order-btn');
  var cartModal = document.getElementById('cart-modal');
  var cartItemsList = document.getElementById('cart-items-list');
  var modalCloseBtn = document.getElementById('modal-close-btn');

  var CART_KEY = 'bookHavenCart';

  // Read the cart array back out of sessionStorage.
  function getCart() {
    var stored = sessionStorage.getItem(CART_KEY);
    if (!stored) {
      return [];
    }
    try {
      return JSON.parse(stored);
    } catch (error) {
      // If the stored value is somehow corrupted, start from an empty cart
      // rather than letting the whole page script fail.
      sessionStorage.removeItem(CART_KEY);
      return [];
    }
  }

  function saveCart(cart) {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // Convert "$14.99" to the number 14.99 so the modal can show a running total.
  function priceToNumber(price) {
    var cleaned = String(price).replace(/[^0-9.]/g, '');
    var value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  }

  // Keep the on-page counter in step with sessionStorage.
  function refreshCartCount() {
    if (cartCountEl) {
      cartCountEl.textContent = getCart().length;
    }
  }

  // Rebuild the list inside the modal window from whatever is in sessionStorage.
  function renderCart() {
    if (!cartItemsList) {
      return;
    }
    var cart = getCart();
    cartItemsList.innerHTML = '';

    if (cart.length === 0) {
      var emptyItem = document.createElement('li');
      emptyItem.className = 'cart-empty';
      emptyItem.textContent = 'Your cart is currently empty.';
      cartItemsList.appendChild(emptyItem);
    } else {
      cart.forEach(function (item) {
        var listItem = document.createElement('li');

        var titleSpan = document.createElement('span');
        titleSpan.textContent = item.title;

        var priceSpan = document.createElement('span');
        priceSpan.textContent = item.price;

        listItem.appendChild(titleSpan);
        listItem.appendChild(priceSpan);
        cartItemsList.appendChild(listItem);
      });
    }

    if (cartTotalEl) {
      var total = cart.reduce(function (sum, item) {
        return sum + priceToNumber(item.price);
      }, 0);
      cartTotalEl.textContent = '$' + total.toFixed(2);
    }
  }

  function openModal() {
    if (!cartModal) {
      return;
    }
    renderCart();
    cartModal.classList.add('open');
    cartModal.setAttribute('aria-hidden', 'false');
    if (modalCloseBtn) {
      modalCloseBtn.focus();
    }
  }

  function closeModal() {
    if (!cartModal) {
      return;
    }
    cartModal.classList.remove('open');
    cartModal.setAttribute('aria-hidden', 'true');
    if (viewCartBtn) {
      viewCartBtn.focus();
    }
  }

  // --- Add to Cart -------------------------------------------------------
  if (addToCartButtons.length) {
    addToCartButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var cart = getCart();
        cart.push({
          title: button.getAttribute('data-title'),
          price: button.getAttribute('data-price')
        });
        saveCart(cart);
        refreshCartCount();
        alert('Item added to the cart.');
      });
    });
  }

  // --- View Cart ---------------------------------------------------------
  if (viewCartBtn) {
    viewCartBtn.addEventListener('click', openModal);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  // Clicking the dimmed background, or pressing Escape, also closes the modal.
  if (cartModal) {
    cartModal.addEventListener('click', function (event) {
      if (event.target === cartModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && cartModal && cartModal.classList.contains('open')) {
      closeModal();
    }
  });

  // --- Clear Cart (inside the modal window) ------------------------------
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function () {
      sessionStorage.removeItem(CART_KEY);
      refreshCartCount();
      renderCart();
      alert('Cart cleared.');
    });
  }

  // --- Process Order (inside the modal window) ---------------------------
  if (processOrderBtn) {
    processOrderBtn.addEventListener('click', function () {
      // Nothing to process if the cart is already empty, so tell the customer
      // instead of confirming an order that does not exist.
      if (getCart().length === 0) {
        alert('Your cart is empty. Please add an item before processing an order.');
        return;
      }
      sessionStorage.removeItem(CART_KEY);
      refreshCartCount();
      renderCart();
      alert('Thank you for your order.');
      closeModal();
    });
  }

  refreshCartCount();

  /* ================= About Us page: feedback + custom order form ================= */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    // The submit event fires only after the browser has checked the required
    // attributes on the name, email and message fields, so empty submissions
    // are blocked before this handler ever runs.
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        message: document.getElementById('message').value.trim(),
        customOrder: document.getElementById('custom-order').value.trim(),
        quantity: document.getElementById('quantity').value,
        submittedAt: new Date().toISOString()
      };

      // localStorage keeps the request after the browser is closed, which is
      // what a real custom order record would need to do.
      var existingOrders;
      try {
        existingOrders = JSON.parse(localStorage.getItem('bookHavenCustomOrders')) || [];
      } catch (error) {
        existingOrders = [];
      }
      existingOrders.push(formData);
      localStorage.setItem('bookHavenCustomOrders', JSON.stringify(existingOrders));

      alert('Thank you for your message.');
      contactForm.reset();
    });
  }

});
