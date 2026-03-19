<?php
/*
  ============================================================
  CONTACT.PHP — Proxy serveur pour le formulaire de contact
  ============================================================

  CE FICHIER :
    - Reçoit les données du formulaire (contact.html → js/contact.js → ici)
    - Crée ou met à jour un contact dans Systeme.io via l'API
    - Assigne des tags automatiquement (formsite, newsletter, PDF_formation, Atelier)

  HÉBERGEMENT :
    - Ce fichier tourne sur un serveur PHP (LWS)
    - C'est le endpoint PRINCIPAL du formulaire
    - Si ce serveur tombe, js/contact.js bascule sur contact.mjs (Netlify)

  NE PAS MODIFIER sans comprendre l'API Systeme.io.
  ============================================================
*/
// Proxy Systeme.io — clé API stockée côté serveur
define('SYSTEME_API_KEY', 'dlkosuwvs2hsn8enp6ed7bzvoyctsef2po65nwk0hpogw8b9vw6pz3ik09i5s299');
define('SYSTEME_API',     'https://api.systeme.io/api');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')     { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$body = json_decode(file_get_contents('php://input'), true);
if (!$body || empty($body['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email requis']);
    exit;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function systeme(string $method, string $path, array $data = [], string $contentType = 'application/json'): array {
    $ch = curl_init(SYSTEME_API . $path);
    $headers = ['X-API-Key: ' . SYSTEME_API_KEY, 'Content-Type: ' . $contentType];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_POSTFIELDS     => $method !== 'GET' ? json_encode($data) : null,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $resp   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'body' => json_decode($resp, true) ?? []];
}

// ── Construire les champs ──────────────────────────────────────────────────
// Champs custom Systeme.io (slugs vérifiés via GET /contact_fields)
// first_name, surname et phone_number sont des champs NATIFS du contact
$fields = [];
$customFieldKeys = ['city', 'levelDJ', 'levelEspaces', 'originUser', 'subject', 'motivation_usr', 'messageUser', 'newsletter_chk'];
foreach ($customFieldKeys as $key) {
    if (isset($body[$key])) {
        $fields[] = ['slug' => $key, 'value' => (string) $body[$key]];
    }
}

// ── Créer ou mettre à jour le contact ─────────────────────────────────────
$payload = ['email' => $body['email'], 'locale' => 'fr', 'fields' => $fields];
// Champs natifs du contact Systeme.io
if (!empty($body['first_name']))   $payload['firstName']   = $body['first_name'];
if (!empty($body['last_name']))    $payload['surname']     = $body['last_name'];
if (!empty($body['phone_number'])) $payload['phoneNumber'] = $body['phone_number'];
$res = systeme('POST', '/contacts', $payload);

$contact = null;
if ($res['status'] === 201 || $res['status'] === 200) {
    $contact = $res['body'];
} elseif ($res['status'] === 422) {
    // Contact existant → récupérer son id
    $list = systeme('GET', '/contacts?email=' . urlencode($body['email']));
    $existing = $list['body']['items'][0] ?? null;
    if ($existing) {
        $updatePayload = ['locale' => 'fr', 'fields' => $fields];
        if (!empty($body['first_name']))   $updatePayload['firstName']   = $body['first_name'];
        if (!empty($body['last_name']))    $updatePayload['surname']     = $body['last_name'];
        if (!empty($body['phone_number'])) $updatePayload['phoneNumber'] = $body['phone_number'];
        $upd = systeme('PATCH', '/contacts/' . $existing['id'], $updatePayload, 'application/merge-patch+json');
        $contact = $upd['body'];
        if (empty($contact['id'])) $contact['id'] = $existing['id'];
    }
} else {
    http_response_code(502);
    echo json_encode(['error' => 'Erreur Systeme.io', 'detail' => $res['body']]);
    exit;
}

// ── Tags ───────────────────────────────────────────────────────────────────
if (!empty($contact['id'])) {
    $tagsToAssign = [];
    // Tag conditionnel selon le sujet
    if (!empty($body['subject'])) {
        if ($body['subject'] === 'dj-holistique') {
            $tagsToAssign[] = 'InterestRonde';
        } elseif ($body['subject'] === 'danses-48') {
            $tagsToAssign[] = 'Danses48';
        }
    }

    $allTags = systeme('GET', '/tags');
    foreach ($tagsToAssign as $name) {
        foreach ($allTags['body']['items'] ?? [] as $t) {
            if (strtolower($t['name']) === strtolower($name)) {
                systeme('POST', '/contacts/' . $contact['id'] . '/tags', ['tagId' => $t['id']]);
                break;
            }
        }
    }
}

http_response_code(200);
echo json_encode(['success' => true]);
