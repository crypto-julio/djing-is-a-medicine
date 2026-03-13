// ==========================================
// FORMATION — Sticky section navigator
// ==========================================
(function () {
  var sideNav = document.getElementById('sideNav');
  if (!sideNav) return;

  var dots = sideNav.querySelectorAll('.sidenav-dot');
  var currentLabel = document.getElementById('sidenavCurrent');
  var prevBtn = document.getElementById('sidenavPrev');
  var nextBtn = document.getElementById('sidenavNext');

  // Build sections list from dots
  var sections = [];
  dots.forEach(function (dot) {
    var id = dot.getAttribute('data-section');
    var el = document.getElementById(id);
    if (el) {
      sections.push({
        id: id,
        el: el,
        dot: dot,
        label: dot.getAttribute('data-label'),
      });
    }
  });

  if (!sections.length) return;

  var activeIndex = 0;

  // Show/hide sidenav based on scroll position (visible after hero)
  function updateVisibility() {
    var scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 200) {
      sideNav.classList.add('visible');
    } else {
      sideNav.classList.remove('visible');
    }
  }

  // Determine which section is currently in view
  function updateActive() {
    var scrollY = window.scrollY || window.pageYOffset;
    var windowH = window.innerHeight;
    var newIndex = 0;

    for (var i = sections.length - 1; i >= 0; i--) {
      var rect = sections[i].el.getBoundingClientRect();
      if (rect.top <= windowH * 0.4) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== activeIndex) {
      activeIndex = newIndex;
      dots.forEach(function (d) { d.classList.remove('active'); });
      sections[activeIndex].dot.classList.add('active');

      // Update mobile label
      if (currentLabel) {
        currentLabel.textContent = sections[activeIndex].label;
      }

      // Update mobile arrows
      updateArrows();
    }
  }

  function updateArrows() {
    if (prevBtn) prevBtn.disabled = activeIndex === 0;
    if (nextBtn) nextBtn.disabled = activeIndex === sections.length - 1;
  }

  // Smooth scroll to section
  function scrollTo(index) {
    if (index < 0 || index >= sections.length) return;
    sections[index].el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Click on dots
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function (e) {
      e.preventDefault();
      scrollTo(i);
    });
  });

  // Mobile arrows
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      scrollTo(activeIndex - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      scrollTo(activeIndex + 1);
    });
  }

  // Listen to scroll
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateVisibility();
        updateActive();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Init
  updateVisibility();
  updateActive();
  updateArrows();
})();
