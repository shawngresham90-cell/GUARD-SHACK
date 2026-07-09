/* Shared interactions: mobile nav toggle, Netlify form submit, active-link on scroll */
(function () {
  // Mobile nav toggle
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-nav-toggle]');
    if (t) {
      var links = document.querySelector('[data-nav-links]');
      if (links) links.classList.toggle('open');
    }
    // close on link tap (mobile)
    if (e.target.closest('[data-nav-links] a')) {
      var l = document.querySelector('[data-nav-links]');
      if (l) l.classList.remove('open');
    }
  });

  // Netlify form submit via AJAX. Netlify logs the email (backup list), then
  // the driver is sent to the form's data-redirect (the Stan Store free-guide
  // page, which delivers the guide and captures the email into Stan).
  // Falls back to a native POST (→ /thanks.html) if fetch fails.
  document.querySelectorAll('form[data-capture]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // honeypot
      var hp = form.querySelector('.hp input');
      if (hp && hp.value) return;
      var btn = form.querySelector('button[type="submit"], .btn');
      if (btn) btn.disabled = true;
      var body;
      try {
        body = new URLSearchParams(new FormData(form)).toString();
      } catch (err) {
        form.submit();
        return;
      }
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).then(function (res) {
        if (!res.ok) throw new Error('submit failed');
        // Hand off to the Stan Store (or wherever data-redirect points).
        var dest = form.getAttribute('data-redirect');
        if (dest) { window.location.href = dest; return; }
        var ok = form.querySelector('[data-ok]');
        if (ok) ok.classList.add('show');
        form.querySelectorAll('input, textarea, select').forEach(function (el) {
          if (el.type !== 'hidden' && !el.closest('.hp')) el.value = '';
        });
        if (btn) btn.disabled = false;
      }).catch(function () {
        if (btn) btn.disabled = false;
        form.removeAttribute('data-capture');
        form.submit();
      });
    });
  });

  // Active section highlight on scroll (anchor nav only)
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav-links] a[href^="#"]'));
  if (navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('active'); });
          var a = map[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
})();
