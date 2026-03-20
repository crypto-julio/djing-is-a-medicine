<?php
/*
  ============================================================
  CONTACT.PHP — Proxy serveur pour le formulaire de contact
  ============================================================

  CE FICHIER :
    - Reçoit les données du formulaire (contact.html → js/contact.js → ici)
    - Crée ou met à jour un contact dans Systeme.io via l'API
    - Assigne des tags automatiquement

  HÉBERGEMENT :
    - Ce fichier tourne sur le serveur PHP (LWS)
    - Utilise file_get_contents (pas besoin de curl)

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
    $url = SYSTEME_API . $path;
    $headers = "X-API-Key: " . SYSTEME_API_KEY . "\r\n" .
               "Content-Type: " . $contentType . "\r\n";

    $opts = [
        'http' => [
            'method'        => $method,
            'header'        => $headers,
            'timeout'       => 10,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer'      => true,
            'verify_peer_name' => true,
        ],
    ];

    if ($method !== 'GET' && !empty($data)) {
        $opts['http']['content'] = json_encode($data);
    }

    $context = stream_context_create($opts);
    $resp = @file_get_contents($url, false, $context);

    // Si la requête a échoué (réseau, SSL, timeout)
    if ($resp === false) {
        return ['status' => 0, 'body' => ['error' => 'Connexion impossible vers Systeme.io']];
    }

    // Extraire le code HTTP depuis $http_response_header
    $status = 0;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $header) {
            if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $m)) {
                $status = (int) $m[1];
            }
        }
    }

    return ['status' => $status, 'body' => json_decode($resp, true) ?? []];
}

// ── Construire les champs ──────────────────────────────────────────────────
// Tous les champs passent dans le tableau "fields" avec leur slug Systeme.io
// (testé via l'API : les propriétés natives firstName/surname/phoneNumber
//  ne fonctionnent pas de manière fiable, seuls les slugs dans fields marchent)
$fieldMap = [
    'first_name'   => 'first_name',
    'last_name'    => 'surname',
    'phone_number' => 'phone_number',
    'city'         => 'city',
    'levelDJ'      => 'levelDJ',
    'levelEspaces' => 'levelEspaces',
    'originUser'   => 'originUser',
    'subject'      => 'subject',
    'motivation_usr' => 'motivation_usr',
    'messageUser'  => 'messageUser',
    'newsletter_chk' => 'newsletter_chk',
];
$fields = [];
foreach ($fieldMap as $bodyKey => $slug) {
    if (!empty($body[$bodyKey])) {
        $fields[] = ['slug' => $slug, 'value' => (string) $body[$bodyKey]];
    }
}

// ── Créer ou mettre à jour le contact ─────────────────────────────────────
$payload = ['email' => $body['email'], 'locale' => 'fr', 'fields' => $fields];
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
        $upd = systeme('PATCH', '/contacts/' . $existing['id'], $updatePayload, 'application/merge-patch+json');
        $contact = $upd['body'];
        if (empty($contact['id'])) $contact['id'] = $existing['id'];
    }
} else {
    http_response_code(502);
    echo json_encode(['error' => 'Erreur Systeme.io', 'status' => $res['status'], 'detail' => $res['body']]);
    exit;
}

// Vérifier que le contact a bien un id valide
if (empty($contact['id'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Contact non créé — id manquant', 'detail' => $contact]);
    exit;
}

// ── Tags ───────────────────────────────────────────────────────────────────
$tagsToAssign = ['formsite'];
if (!empty($body['newsletter_chk']) && $body['newsletter_chk'] !== 'false') {
    $tagsToAssign[] = 'newsletter';
}
if (!empty($body['subject'])) {
    if ($body['subject'] === 'dj-holistique') {
        $tagsToAssign[] = 'InterestRonde';
    } elseif ($body['subject'] === 'danses-48') {
        $tagsToAssign[] = 'Danses48';
    }
}

if (!empty($tagsToAssign)) {
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
echo json_encode(['success' => true, 'contactId' => $contact['id']]);
