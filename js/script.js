/* ==========================================================================
   ClearMetric — script.js

   Scope: mobile navigation, contact-form validation, mock submission.

   ⚠️  THE CONTACT FORM DOES NOT SEND ANYTHING.
   Submitting shows a success message and discards the data. Wire
   submitEnquiry() to a real endpoint (see the notes above it) before this
   site goes live, or enquiries will silently disappear.
   ========================================================================== */
(function () {
  'use strict';

  // Tells the CSS that JavaScript is available, so the small-screen
  // navigation can safely collapse behind the toggle.
  document.documentElement.classList.add('js');


  /* ----------------------------------------------------------------------
     1. Mobile navigation
     -------------------------------------------------------------------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');

  if (toggle && nav) {
    var isOpen = function () {
      return toggle.getAttribute('aria-expanded') === 'true';
    };

    var setMenu = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', function () {
      setMenu(!isOpen());
    });

    // Close once a destination has been chosen.
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) { setMenu(false); }
    });

    // Escape closes the menu and returns focus to the toggle.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setMenu(false);
        toggle.focus();
      }
    });

    // A click anywhere outside also closes it.
    document.addEventListener('click', function (event) {
      if (!isOpen()) { return; }
      if (!nav.contains(event.target) && !toggle.contains(event.target)) {
        setMenu(false);
      }
    });

    // Reset the state if the viewport grows back to the desktop layout,
    // otherwise the menu would stay flagged as open behind the scenes.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && isOpen()) { setMenu(false); }
    });
  }


  /* ----------------------------------------------------------------------
     2. Contact form validation
     -------------------------------------------------------------------- */
  var form = document.getElementById('enquiryForm');
  var success = document.getElementById('formSuccess');
  var status = document.getElementById('formStatus');
  var resetBtn = document.getElementById('formReset');

  // Deliberately permissive: catches obvious typos without rejecting valid
  // but unusual addresses.
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var RULES = {
    name: {
      message: 'Please enter your name.'
    },
    company: {
      message: 'Please enter your company name.'
    },
    email: {
      message: 'Please enter your email address.',
      test: function (value) { return EMAIL_PATTERN.test(value); },
      invalidMessage: 'Please enter a valid email address, for example name@company.co.uk'
    }
  };

  var showError = function (field, message) {
    var errorEl = document.getElementById(field.id + '-error');
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      field.setAttribute('aria-describedby', errorEl.id);
    }
  };

  var clearError = function (field) {
    var errorEl = document.getElementById(field.id + '-error');
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
      field.removeAttribute('aria-describedby');
    }
  };

  var clearAllErrors = function () {
    if (!form) { return; }
    Object.keys(RULES).forEach(function (name) {
      var field = form.elements[name];
      if (field) { clearError(field); }
    });
    if (status) { status.textContent = ''; }
  };

  var validateField = function (field) {
    var rule = RULES[field.name];
    if (!rule) { return true; }

    var value = field.value.trim();

    if (!value) {
      showError(field, rule.message);
      return false;
    }
    if (rule.test && !rule.test(value)) {
      showError(field, rule.invalidMessage);
      return false;
    }

    clearError(field);
    return true;
  };

  if (form) {
    // Validate when a field is left, then clear the error as it is corrected.
    Object.keys(RULES).forEach(function (name) {
      var field = form.elements[name];
      if (!field) { return; }

      // Skip validation once the form has been swapped for the success
      // panel: resetting the fields and moving focus fires a blur that would
      // otherwise re-raise an error against a deliberately emptied field.
      field.addEventListener('blur', function () {
        if (form.hidden) { return; }
        validateField(field);
      });
      field.addEventListener('input', function () {
        if (field.classList.contains('is-invalid')) { validateField(field); }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstInvalid = null;

      Object.keys(RULES).forEach(function (name) {
        var field = form.elements[name];
        if (!field) { return; }
        if (!validateField(field) && !firstInvalid) { firstInvalid = field; }
      });

      if (firstInvalid) {
        if (status) { status.textContent = 'Please check the highlighted fields.'; }
        firstInvalid.focus();
        return;
      }

      if (status) { status.textContent = ''; }

      var payload = {
        name:         form.elements.name.value.trim(),
        company:      form.elements.company.value.trim(),
        email:        form.elements.email.value.trim(),
        phone:        form.elements.phone.value.trim(),
        dataLocation: form.elements.dataLocation.value,
        budget:       form.elements.budget.value,
        message:      form.elements.message.value.trim()
      };

      submitEnquiry(payload);
    });
  }


  /* ----------------------------------------------------------------------
     3. Submission — MOCK ONLY
     -------------------------------------------------------------------- */

  /**
   * Pretends to send the enquiry.
   *
   * This is the single integration seam. To go live, replace the body with a
   * real request — the payload is already assembled and showFailure() is
   * already written:
   *
   *   fetch('https://formspree.io/f/YOUR_FORM_ID', {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
   *     body: JSON.stringify(payload)
   *   })
   *     .then(function (response) {
   *       if (!response.ok) { throw new Error('Request failed'); }
   *       showSuccess();
   *     })
   *     .catch(showFailure);
   *
   * Nothing else on the page needs to change.
   */
  function submitEnquiry(payload) {
    void payload; // The mock does not use it.
    showSuccess();
  }

  function showSuccess() {
    if (!form || !success) { return; }
    form.reset();
    clearAllErrors();
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  // Used by the real integration once submitEnquiry() sends anything.
  // eslint-disable-next-line no-unused-vars
  function showFailure() {
    if (status) {
      status.textContent = 'Sorry, something went wrong. Please try again shortly.';
    }
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (!form || !success) { return; }
      success.hidden = true;
      form.hidden = false;

      // Belt and braces — nothing should be left over, but a visitor must
      // never land on a fresh form that is already showing errors.
      clearAllErrors();

      if (form.elements.name) { form.elements.name.focus(); }
    });
  }


  /* ----------------------------------------------------------------------
     4. Footer year
     -------------------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) { year.textContent = String(new Date().getFullYear()); }
})();
