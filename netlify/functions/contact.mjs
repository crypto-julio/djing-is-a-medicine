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

  const fields = ['levelDJ', 'levelEspaces', 'originUser', 'subject', 'messageUser', 'newsletter_chk']
    .filter(k => b[k])
    .map(k => ({ slug: k, value: String(b[k]) }));

  const payload = { email: b.email, locale: 'fr', fields };
  if (b.first_name)   payload.firstName   = b.first_name;
  if (b.last_name)    payload.lastName    = b.last_name;
  if (b.phone_number) payload.phoneNumber = b.phone_number;

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
      const updatePayload = { locale: 'fr', fields };
      if (b.first_name)   updatePayload.firstName   = b.first_name;
      if (b.last_name)    updatePayload.lastName    = b.last_name;
      if (b.phone_number) updatePayload.phoneNumber = b.phone_number;
      const upd = await systeme('PATCH', `/contacts/${existing.id}`, updatePayload, 'application/merge-patch+json');
      contact = upd.body;
      if (!contact.id) contact.id = existing.id;
    }
  } else {
    return { statusCode: 502, headers: jsonHeaders, body: JSON.stringify({ error: 'Erreur Systeme.io', detail: res.body }) };
  }

  // Tag newsletter
  if (b.newsletter_chk && b.newsletter_chk !== 'false' && contact && contact.id) {
    const tags = await systeme('GET', '/tags?query=newsletter');
    const tag = (tags.body.items || []).find(t => t.name.toLowerCase() === 'newsletter');
    if (tag) {
      await systeme('POST', `/contacts/${contact.id}/tags`, { tagId: tag.id });
    }
  }

  return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) };
}
