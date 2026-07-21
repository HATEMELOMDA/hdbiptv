<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$resource = strtolower((string)($_GET['resource'] ?? 'health'));
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($resource === 'health') {
    hdb_response([
        'ok' => true,
        'service' => 'HDB Hospitality OS',
        'version' => HDB_VERSION,
        'time' => gmdate(DATE_ATOM),
        'storage_writable' => is_dir(HDB_DATA_DIR) ? is_writable(HDB_DATA_DIR) : is_writable(dirname(HDB_DATA_DIR)),
    ]);
}

$allowed = ['rooms', 'devices', 'channels', 'requests', 'messages', 'settings'];
if (!in_array($resource, $allowed, true)) {
    hdb_response(['ok' => false, 'error' => 'resource_not_found'], 404);
}

if ($method === 'GET') {
    hdb_response(['ok' => true, 'data' => hdb_read_collection($resource)]);
}

if ($method === 'POST') {
    $items = hdb_read_collection($resource);
    $body = hdb_body();
    $body['id'] = $body['id'] ?? bin2hex(random_bytes(8));
    $body['created_at'] = gmdate(DATE_ATOM);
    $body['updated_at'] = $body['created_at'];
    $items[] = $body;
    hdb_write_collection($resource, $items);
    hdb_response(['ok' => true, 'data' => $body], 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $id = (string)($_GET['id'] ?? '');
    if ($id === '') {
        hdb_response(['ok' => false, 'error' => 'id_required'], 400);
    }

    $items = hdb_read_collection($resource);
    $body = hdb_body();
    $updated = null;

    foreach ($items as &$item) {
        if ((string)($item['id'] ?? '') === $id) {
            $item = array_merge($item, $body, ['id' => $id, 'updated_at' => gmdate(DATE_ATOM)]);
            $updated = $item;
            break;
        }
    }
    unset($item);

    if ($updated === null) {
        hdb_response(['ok' => false, 'error' => 'record_not_found'], 404);
    }

    hdb_write_collection($resource, $items);
    hdb_response(['ok' => true, 'data' => $updated]);
}

if ($method === 'DELETE') {
    $id = (string)($_GET['id'] ?? '');
    if ($id === '') {
        hdb_response(['ok' => false, 'error' => 'id_required'], 400);
    }

    $items = hdb_read_collection($resource);
    $filtered = array_values(array_filter($items, static fn(array $item): bool => (string)($item['id'] ?? '') !== $id));
    if (count($filtered) === count($items)) {
        hdb_response(['ok' => false, 'error' => 'record_not_found'], 404);
    }

    hdb_write_collection($resource, $filtered);
    hdb_response(['ok' => true]);
}

header('Allow: GET, POST, PUT, PATCH, DELETE');
hdb_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
