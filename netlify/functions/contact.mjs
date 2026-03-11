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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const b = JSON.parse(event.body || '{}');
  if (!b.email) {
    return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'Email requis' }) };
  }

  const allFields = ['first_name', 'last_name', 'phone_number', 'city', 'levelDJ', 'levelEspaces', 'originUser', 'subject', 'messageUser', 'newsletter_chk']
    .filter(k => b[k])
    .map(k => ({ slug: k, value: String(b[k]) }));

  const payload = { email: b.email, locale: 'fr', fields: allFields };

  // Créer le contact
  let res = await systeme('POST', '/contacts', payload);
  let contact = null;

  if (res.status === 201 || res.status === 200) {
    contact = res.body;
  } else if (res.status === 422) {
    // Contact existant → rechercher et mettre à jour
    const list = await systeme('GET', `/contacts?email=${encodeURIComponent(b.email)}`);
    const existing = list.body.items && list.body.items[0];
    if (existing) {
      const updatePayload = { locale: 'fr', fields: allFields };
      const upd = await systeme('PATCH', `/contacts/${existing.id}`, updatePayload, 'application/merge-patch+json');
      contact = upd.body;
      if (!contact.id) contact.id = existing.id;
    }
  } else {
    return { statusCode: 502, headers: jsonHeaders, body: JSON.stringify({ error: 'Erreur Systeme.io', detail: res.body }) };
  }

  // Tags
  if (contact && contact.id) {
    const tagsToAssign = ['formsite'];
    if (b.newsletter_chk && b.newsletter_chk !== 'false') tagsToAssign.push('newsletter');

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
}
