// ============================================================
// BANDEAU COOKIES — Consentement RGPD / CNIL
// ============================================================
//
// Ce script affiche un bandeau de consentement cookies
// conforme aux recommandations de la CNIL.
//
// FONCTIONNEMENT :
//   - Si l'utilisateur n'a pas encore fait de choix → bandeau affiché
//   - "Accepter" → charge les scripts de tracking (Google Analytics, etc.)
//   - "Refuser" → aucun cookie de tracking n'est déposé
//   - Le choix est mémorisé 6 mois dans le localStorage
//
// POUR AJOUTER GOOGLE ANALYTICS :
//   Remplace 'G-XXXXXXXXXX' par ton vrai ID de mesure dans la
//   fonction loadTrackingScripts() ci-dessous.
//
// ============================================================

(function () {
  'use strict';

  var CONSENT_KEY = 'djiam_cookie_consent';
  var CONSENT_DURATION = 180; // jours (≈ 6 mois, recommandation CNIL)

  // ----------------------------------------------------------
  // Vérifie si un consentement valide existe
  // ----------------------------------------------------------
  function getConsent() {
    try {
      var data = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (!data || !data.date) return null;
      var age = (Date.now() - data.date) / (1000 * 60 * 60 * 24);
      if (age > CONSENT_DURATION) {
        localStorage.removeItem(CONSENT_KEY);
        return null;
      }
      return data.value; // 'accepted' ou 'refused'
    } catch (e) {
      return null;
    }
  }

  function saveConsent(value) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      value: value,
      date: Date.now()
    }));
  }

  // ----------------------------------------------------------
  // Charge les scripts de tracking (après consentement)
  // ----------------------------------------------------------
  function loadTrackingScripts() {
    // ---- Google Analytics ----
    // TODO : Remplace 'G-XXXXXXXXXX' par ton ID Google Analytics
    var GA_ID = 'G-XXXXXXXXXX';
    if (GA_ID === 'G-XXXXXXXXXX') return; // Ne rien charger tant que l'ID n'est pas configuré

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  // ----------------------------------------------------------
  // Crée et affiche le bandeau
  // ----------------------------------------------------------
  function showBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Gestion des cookies');
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<p class="cookie-banner-text">' +
          'Ce site utilise des cookies. ' +
          'Aucun cookie publicitaire n\'est utilisé. ' +
          '<a href="/mentions-legales#cookies">En savoir plus</a>' +
        '</p>' +
        '<div class="cookie-banner-buttons">' +
          '<button type="button" class="cookie-btn cookie-btn-refuse" id="cookieRefuse">Refuser</button>' +
          '<button type="button" class="cookie-btn cookie-btn-accept" id="cookieAccept">Accepter</button>' +
        '</div>' +
      '</div>';

    // -- Styles du bandeau --
    var style = document.createElement('style');
    style.textContent =
      '#cookieBanner {' +
        'position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;' +
        'background: rgba(42, 31, 48, 0.97);' +
        'color: #FAF7F2;' +
        'padding: 1rem 1.5rem;' +
        'font-family: "Outfit", "Inter", system-ui, sans-serif;' +
        'font-size: 0.9rem;' +
        'line-height: 1.5;' +
        'backdrop-filter: blur(8px);' +
        'box-shadow: 0 -2px 20px rgba(0,0,0,0.3);' +
        'transform: translateY(100%);' +
        'animation: cookieSlideUp 0.4s ease forwards;' +
      '}' +
      '@keyframes cookieSlideUp {' +
        'to { transform: translateY(0); }' +
      '}' +
      '.cookie-banner-inner {' +
        'max-width: 1100px; margin: 0 auto;' +
        'display: flex; align-items: center; gap: 1.5rem;' +
        'flex-wrap: wrap; justify-content: space-between;' +
      '}' +
      '.cookie-banner-text {' +
        'flex: 1; min-width: 280px; margin: 0;' +
      '}' +
      '.cookie-banner-text a {' +
        'color: #C47A2E; text-decoration: underline;' +
      '}' +
      '.cookie-banner-buttons {' +
        'display: flex; gap: 0.75rem; flex-shrink: 0;' +
      '}' +
      '.cookie-btn {' +
        'padding: 0.6rem 1.4rem; border: none; border-radius: 6px;' +
        'font-family: inherit; font-size: 0.85rem; font-weight: 600;' +
        'cursor: pointer; transition: opacity 0.2s, transform 0.2s;' +
      '}' +
      '.cookie-btn:hover { opacity: 0.85; transform: translateY(-1px); }' +
      '.cookie-btn-accept {' +
        'background: #C47A2E; color: #fff;' +
      '}' +
      '.cookie-btn-refuse {' +
        'background: transparent; color: #FAF7F2;' +
        'border: 1px solid rgba(250,247,242,0.4);' +
      '}' +
      '@media (max-width: 600px) {' +
        '#cookieBanner { padding: 1rem; }' +
        '.cookie-banner-inner { flex-direction: column; text-align: center; gap: 1rem; }' +
        '.cookie-banner-buttons { width: 100%; justify-content: center; }' +
      '}';

    document.head.appendChild(style);
    document.body.appendChild(banner);

    document.getElementById('cookieAccept').addEventListener('click', function () {
      saveConsent('accepted');
      closeBanner(banner);
      loadTrackingScripts();
    });

    document.getElementById('cookieRefuse').addEventListener('click', function () {
      saveConsent('refused');
      closeBanner(banner);
    });
  }

  function closeBanner(banner) {
    banner.style.animation = 'none';
    banner.style.transition = 'transform 0.3s ease';
    banner.style.transform = 'translateY(100%)';
    setTimeout(function () { banner.remove(); }, 350);
  }

  // ----------------------------------------------------------
  // Initialisation
  // ----------------------------------------------------------
  var consent = getConsent();

  if (consent === 'accepted') {
    loadTrackingScripts();
  } else if (consent === null) {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
  // Si 'refused' → ne rien faire
})();
