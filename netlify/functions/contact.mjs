/*
  ============================================================
  CONTACT.MJS — Fonction Netlify (fallback du formulaire)
  ============================================================

  CE FICHIER :
    - Même rôle que contact.php mais hébergé sur Netlify Functions
    - Sert de SECOURS si le serveur PHP (LWS) ne répond pas
    - js/contact.js essaie d'abord contact.php, puis bascule ici

  FLUX : contact.html → js/contact.js → contact.php (LWS)
                                       ↘ contact.mjs (Netlify, fallback)
                                       → API Systeme.io

  NE PAS MODIFIER sans comprendre l'API Systeme.io.
  ============================================================
*/
const API_KEY = 'dlkosuwvs2hsn8enp6ed7bzvoyctsef2po65nwk0hpogw8b9vw6pz3ik09i5s299';
const API = 'https://api.systeme.io/api';

async function systeme(method, path, data, contentType = 'application/json') {
  const opts = {
    method,
    headers: { 'X-API-Key': API_KEY, 'Content-Type': contentType },
  };
  if (method !== 'GET' && data) opts.body = JSON.stringify(data);
  const res = await fetch(`${API}${path}`, opts);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

export async function handler(event) {
  const jsonHeaders = { 'Content-Type': 'application/json' };

  // CORS : autoriser les requêtes depuis le site
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...jsonHeaders, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let b;
  try {
    b = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'JSON invalide', detail: err.message }) };
  }
  if (!b.email) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Email requis' }) };
  }

  try {
    // Slugs identiques à ceux de contact.php (doivent correspondre aux champs custom Systeme.io)
    const FIELD_KEYS = ['first_name', 'last_name', 'phone_number', 'city', 'levelDJ', 'levelEspaces', 'originUser', 'subject', 'motivation_usr', 'messageUser', 'newsletter_chk'];

    const allFields = FIELD_KEYS
      .filter(key => b[key])
      .map(key => ({ slug: key, value: String(b[key]) }));

    const payload = { email: b.email, locale: 'fr', fields: allFields };

    // Créer le contact
    let res = await systeme('POST', '/contacts', payload);
    let contact = null;

    if (res.status === 201 || res.status === 200) {
      contact = res.body;
    } else if (res.status === 422) {
      // 422 peut signifier "email déjà existant" OU "champs invalides"
      const list = await systeme('GET', `/contacts?email=${encodeURIComponent(b.email)}`);
      const existing = list.body.items && list.body.items[0];
      if (existing) {
        // Contact existe → mise à jour
        const updatePayload = { locale: 'fr', fields: allFields };
        const upd = await systeme('PATCH', `/contacts/${existing.id}`, updatePayload, 'application/merge-patch+json');
        contact = upd.body;
        if (!contact.id) contact.id = existing.id;
      } else {
        // Pas un doublon — vraie erreur de validation
        // Réessai avec seulement les champs garantis
        const safeFields = allFields.filter(f => ['first_name', 'last_name'].includes(f.slug));
        const retry = await systeme('POST', '/contacts', { email: b.email, locale: 'fr', fields: safeFields });
        if (retry.status === 201 || retry.status === 200) {
          contact = retry.body;
        } else {
          return { statusCode: 502, headers: jsonHeaders, body: JSON.stringify({ error: 'Erreur Systeme.io', detail: res.body, retry: retry.body }) };
        }
      }
    } else {
      return { statusCode: 502, headers: jsonHeaders, body: JSON.stringify({ error: 'Erreur Systeme.io', detail: res.body }) };
    }

    // Tags
    if (contact && contact.id) {
      const tagsToAssign = ['formsite'];
      if (b.newsletter_chk && b.newsletter_chk !== 'false') tagsToAssign.push('newsletter');
      if (b.subject === 'dj-holistique') tagsToAssign.push('PDF_formation');
      else if (b.subject === 'danses-48') tagsToAssign.push('Atelier');

      const tagsRes = await systeme('GET', '/tags');
      const allTags = tagsRes.body.items || [];

      for (const name of tagsToAssign) {
        const tag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (tag) {
          await systeme('POST', `/contacts/${contact.id}/tags`, { tagId: tag.id });
        }
      }
    }

    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Erreur inattendue dans contact.mjs:', err);
    return { statusCode: 500, headers: jsonHeaders, body: JSON.stringify({ error: 'Erreur serveur', detail: err.message }) };
  }
}
