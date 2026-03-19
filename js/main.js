// ==========================================
// main.js — Interactions visuelles du site
// ==========================================
//
// Ce fichier gère TOUTES les animations et interactions visuelles :
//   - Apparition des éléments au scroll (scroll reveal)
//   - Comportement du menu au scroll (transparence, barre de progression)
//   - Menu mobile (ouverture / fermeture)
//   - Défilement fluide vers les ancres (#)
//   - Effet 3D au survol des cartes (tilt)
//   - Curseur personnalisé + effet magnétique sur les boutons
//
// NE PAS MODIFIER ce fichier — il est technique et fragile.
// En cas de besoin, demande à Julien.
//
// ==========================================

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
  hamburger.focus();
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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
// CUSTOM CURSOR + MAGNETIC BUTTONS — désactivé pour la performance
// ==========================================
