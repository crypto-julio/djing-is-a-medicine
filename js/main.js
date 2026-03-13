// ==========================================
// SCROLL REVEAL (IntersectionObserver)
// ==========================================
var revealObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15, rootMargin: '0px 0px -120px 0px' });

document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

// Grid stagger reveals — observe grids, trigger all children at once
var gridSelectors = [
  { grid: '.identify-grid', items: '.identify-item' },
  { grid: '.ed-principes-grid', items: '.ed-principe-card' }
];
gridSelectors.forEach(function (cfg) {
  var grid = document.querySelector(cfg.grid);
  if (!grid) return;
  var gridObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(cfg.items).forEach(function (item) {
          item.classList.add('visible');
        });
        gridObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -100px 0px' });
  gridObserver.observe(grid);
});

// Timeline items — observe each individually for scroll-driven reveal
var timelineObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      timelineObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3, rootMargin: '0px 0px -100px 0px' });

document.querySelectorAll('.timeline-item').forEach(function (el) {
  timelineObserver.observe(el);
});

// ==========================================
// NAV SCROLL BEHAVIOR (passive, no throttle needed — already cheap)
// ==========================================
var nav = document.getElementById('nav');
var scrollProgress = document.getElementById('scrollProgress');

window.addEventListener('scroll', function () {
  var y = window.scrollY;
  if (y > 80) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
  var docH = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollProgress && docH > 0) {
    scrollProgress.style.width = (y / docH * 100) + '%';
  }
}, { passive: true });

// ==========================================
// MOBILE MENU
// ==========================================
var hamburger = document.getElementById('hamburger');
var mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });
}

// Global closeMobile for onclick handlers in HTML
window.closeMobile = function () {
  if (!hamburger || !mobileMenu) return;
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
};

// ==========================================
// SMOOTH ANCHOR SCROLL
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (href === '#') return;
    var target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ==========================================
// 3D TILT — Event delegation (single listener)
// ==========================================
(function () {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  var TILT_MAX = 8;
  var TILT_SELECTOR = '.pillar, .identify-item, .date-card, .testimonial-card, .ed-principe-card, .ed-expr-card, .ed-timeline-content, .f-inclus-card';

  document.addEventListener('mousemove', function (e) {
    var card = e.target.closest(TILT_SELECTOR);
    if (!card) return;
    var rect = card.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width;
    var y = (e.clientY - rect.top) / rect.height;
    var rotateY = (x - 0.5) * TILT_MAX * 2;
    var rotateX = (0.5 - y) * TILT_MAX * 2;
    card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
    card.style.transition = 'transform 0.1s ease-out';
  });

  document.addEventListener('mouseout', function (e) {
    var card = e.target.closest(TILT_SELECTOR);
    if (!card) return;
    // Only reset if we're leaving the card (not entering a child)
    if (card.contains(e.relatedTarget)) return;
    card.style.transform = '';
    card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  });
})();

// ==========================================
// CUSTOM CURSOR + MAGNETIC BUTTONS
// Optimized: skips frames when cursor hasn't moved
// ==========================================
(function () {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  var cursor = document.getElementById('cursor');
  var glow = document.getElementById('cursorGlow');
  if (!cursor || !glow) return;

  var mx = -100, my = -100;
  var cx = -100, cy = -100;
  var gx = -100, gy = -100;
  var hasMoved = false;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    hasMoved = true;
  });

  document.addEventListener('mouseleave', function () {
    cursor.style.opacity = '0';
    glow.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    cursor.style.opacity = '1';
    glow.style.opacity = '1';
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    // Only update DOM if cursor has actually moved or is still interpolating
    if (hasMoved || Math.abs(cx - mx) > 0.5 || Math.abs(gx - mx) > 0.5) {
      cx = lerp(cx, mx, 0.2);
      cy = lerp(cy, my, 0.2);
      gx = lerp(gx, mx, 0.08);
      gy = lerp(gy, my, 0.08);
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      glow.style.left = gx + 'px';
      glow.style.top = gy + 'px';
      hasMoved = false;
    }
    requestAnimationFrame(tick);
  }
  tick();

  // Hover detection — event delegation
  var interactives = 'a, button, [data-magnetic], .pillar-card, .identify-item, .date-card, .testimonial-card, .ed-principe-card, .ed-expr-card, .ed-timeline-content, .f-inclus-card, .social-card, .media-block, .timeline-item';

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(interactives)) {
      cursor.classList.add('hover');
      glow.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(interactives)) {
      cursor.classList.remove('hover');
      glow.classList.remove('hover');
    }
  });

  // Magnetic effect
  document.querySelectorAll('[data-magnetic]').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      var deltaX = e.clientX - (rect.left + rect.width / 2);
      var deltaY = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = 'translate(' + (deltaX * 0.35) + 'px, ' + (deltaY * 0.35) + 'px)';
      el.style.transition = 'transform 0.2s ease-out';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
      el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });
})();
