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
      formStatus.textContent = isFullForm
        ? 'Merci ! Tu vas recevoir la brochure par email.'
        : 'Merci ! On te répond très vite.';
      formStatus.classList.add('success');
      contactForm.reset();
    }).catch(function () {
      formStatus.textContent = 'Erreur de connexion. Verifie ta connexion internet et reessaie.';
      formStatus.classList.add('error');
    }).finally(function () {
      contactSubmit.disabled = false;
      contactSubmit.textContent = originalText;
    });
  });
})();
