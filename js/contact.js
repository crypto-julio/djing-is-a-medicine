// ==========================================
// contact.js — Envoi du formulaire de contact vers Systeme.io
// ==========================================
//
// Ce fichier gère la soumission du formulaire de contact.
// Il envoie les données d'abord via contact.php (hébergement LWS),
// et si ça échoue, il utilise une fonction Netlify en secours.
//
// NE PAS MODIFIER ce fichier — il est technique et fragile.
// En cas de besoin, demande à Julien.
//
// ==========================================
(function () {
  var contactForm = document.getElementById('contactForm');
  var contactSubmit = document.getElementById('contactSubmit');
  var formStatus = document.getElementById('formStatus');
  if (!contactForm) return;

  function sendToProxy(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (res) {
      var ct = res.headers.get('Content-Type') || '';
      if (res.ok && ct.includes('application/json')) return true;
      throw new Error('Proxy error');
    });
  }

  // Motivation DJ : affichage conditionnel + selection
  var subjectSelect = contactForm.querySelector('[name="subject"]');
  var motivationField = document.getElementById('motivationField');
  var motivationInput = document.getElementById('motivationDJ');

  if (subjectSelect && motivationField) {
    subjectSelect.addEventListener('change', function () {
      motivationField.style.display = subjectSelect.value === 'dj-holistique' ? 'block' : 'none';
      if (subjectSelect.value !== 'dj-holistique') motivationInput.value = '';
    });
  }

  document.querySelectorAll('.motivation-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.motivation-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      motivationInput.value = btn.dataset.value;
    });
  });

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    formStatus.textContent = '';
    formStatus.className = 'newsletter-form-status';

    var formData = new FormData(contactForm);
    var data = Object.fromEntries(formData.entries());

    // Champs toujours requis
    if (!data.first_name || !data.last_name || !data.email || !data.phone || !data.subject || !data.messageUser) {
      formStatus.textContent = 'Merci de remplir tous les champs obligatoires.';
      formStatus.classList.add('error');
      return;
    }

    // Champs du formulaire complet (index + formation)
    var isFullForm = !!contactForm.querySelector('[name="city"]');
    if (isFullForm) {
      if (!data.city || !data.levelDJ || !data.levelEspaces || !data.originUser) {
        formStatus.textContent = 'Merci de remplir tous les champs obligatoires.';
        formStatus.classList.add('error');
        return;
      }
    }

    if (data.subject === 'dj-holistique' && !data.motivationDJ) {
      formStatus.textContent = "Merci d'indiquer ton degré de motivation.";
      formStatus.classList.add('error');
      return;
    }

    var originalText = contactSubmit.textContent;
    contactSubmit.disabled = true;
    contactSubmit.textContent = 'Envoi en cours\u2026';

    var payload = {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone,
      subject: data.subject,
      messageUser: data.messageUser,
      newsletter_chk: data.newsletter_chk ? 'true' : 'false',
    };
    if (data.city) payload.city = data.city;
    if (data.levelDJ) payload.levelDJ = data.levelDJ;
    if (data.levelEspaces) payload.levelEspaces = data.levelEspaces;
    if (data.originUser) payload.originUser = data.originUser;
    if (data.motivationDJ) payload.motivation_usr = data.motivationDJ;

    sendToProxy('/contact.php', payload).catch(function () {
      return sendToProxy('/.netlify/functions/contact', payload);
    }).then(function () {
      // Cacher le formulaire et tous les éléments de la section
      contactForm.reset();
      contactForm.style.display = 'none';
      var nlContent = document.querySelector('.newsletter-content');
      var nlDisclaimer = nlContent && nlContent.querySelector('.newsletter-disclaimer');
      if (nlDisclaimer) nlDisclaimer.style.display = 'none';

      if (isFullForm) {
        // Pages formation / index : masquer label, titre, sous-titre, rewards
        var rewards = nlContent && nlContent.querySelector('.rewards');
        var nlText = nlContent && nlContent.querySelector('.newsletter-text');
        var nlLabel = nlContent && nlContent.querySelector('.section-label');
        var nlTitle = nlContent && nlContent.querySelector('.newsletter-title');
        if (rewards) rewards.style.display = 'none';
        if (nlText) nlText.style.display = 'none';
        if (nlLabel) nlLabel.style.display = 'none';
        if (nlTitle) nlTitle.style.display = 'none';
      } else {
        // Page contact : masquer le paragraphe d'intro
        var introText = nlContent && nlContent.querySelector('.section-text');
        if (introText) introText.style.display = 'none';
      }

      // Afficher le message de succès (hors du form caché)
      var successMsg = document.createElement('div');
      successMsg.className = 'newsletter-form-status success success-big';
      successMsg.setAttribute('role', 'alert');
      successMsg.innerHTML = isFullForm
        ? '<span class="success-emoji">&#10024;</span>Bravo pour ce premier pas !<br>Check tes emails, peut-être dans le dossier SPAM.'
        : '<span class="success-emoji">&#10024;</span>Merci !<br>On te répond très vite.';
      if (nlContent) nlContent.appendChild(successMsg);
    }).catch(function () {
      formStatus.textContent = 'Erreur de connexion. Vérifie ta connexion internet et réessaie.';
      formStatus.classList.add('error');
    }).finally(function () {
      contactSubmit.disabled = false;
      contactSubmit.textContent = originalText;
    });
  });
})();
