<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    hdb_json_response(['ok' => true]);
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$resource = strtolower(trim((string)($_GET['resource'] ?? 'state')));
$id = trim((string)($_GET['id'] ?? ''));
$allowed = ['rooms', 'devices', 'channels', 'requests', 'messages', 'services', 'audit'];
$state = hdb_read_state();

if ($resource === 'ping') {
    hdb_json_response([
        'ok' => true,
        'service' => 'HDB Hospitality API',
        'version' => $state['meta']['version'] ?? '1.1.0',
        'time' => gmdate('c')
    ]);
}

if ($resource === 'state') {
    if ($method === 'GET') {
        hdb_json_response(['ok' => true, 'data' => $state]);
    }
    if (in_array($method, ['PUT', 'POST'], true)) {
        $body = hdb_body();
        if (!isset($body['data']) || !is_array($body['data'])) {
            hdb_json_response(['ok' => false, 'error' => 'Missing state data'], 422);
        }
        $next = $body['data'];
        $next['meta']['version'] = $state['meta']['version'] ?? '1.1.0';
        hdb_audit($next, 'state.replaced');
        hdb_write_state($next);
        hdb_json_response(['ok' => true, 'data' => $next]);
    }
}

if ($resource === 'experience') {
    if ($method === 'GET') {
        hdb_json_response(['ok' => true, 'data' => $state['experience'] ?? []]);
    }
    if (in_array($method, ['PUT', 'PATCH', 'POST'], true)) {
        $body = hdb_body();
        $current = $state['experience'] ?? [];
        $state['experience'] = array_merge($current, $body);
        $state['experience']['published_at'] = gmdate('c');
        hdb_audit($state, 'experience.published', ['title' => $state['experience']['title'] ?? '']);
        hdb_write_state($state);
        hdb_json_response(['ok' => true, 'data' => $state['experience']]);
    }
}

if (!in_array($resource, $allowed, true)) {
    hdb_json_response(['ok' => false, 'error' => 'Unknown resource'], 404);
}

$state[$resource] = is_array($state[$resource] ?? null) ? $state[$resource] : [];

if ($method === 'GET') {
    if ($id !== '') {
        foreach ($state[$resource] as $item) {
            if ((string)($item['id'] ?? '') === $id) {
                hdb_json_response(['ok' => true, 'data' => $item]);
            }
        }
        hdb_json_response(['ok' => false, 'error' => 'Item not found'], 404);
    }
    hdb_json_response(['ok' => true, 'data' => array_values($state[$resource])]);
}

if ($method === 'POST') {
    $body = hdb_body();
    $prefix = strtoupper(substr($resource, 0, 3));
    $body['id'] = $body['id'] ?? hdb_id($prefix);
    $body['created_at'] = $body['created_at'] ?? gmdate('c');
    $body['updated_at'] = gmdate('c');
    array_unshift($state[$resource], $body);
    hdb_audit($state, $resource . '.created', ['id' => $body['id']]);
    hdb_write_state($state);
    hdb_json_response(['ok' => true, 'data' => $body], 201);
}

if (in_array($method, ['PUT', 'PATCH'], true)) {
    if ($id === '') {
        hdb_json_response(['ok' => false, 'error' => 'Missing id'], 422);
    }
    $body = hdb_body();
    $found = false;
    foreach ($state[$resource] as $index => $item) {
        if ((string)($item['id'] ?? '') === $id) {
            $state[$resource][$index] = array_merge($item, $body, ['id' => $id, 'updated_at' => gmdate('c')]);
            $found = true;
            $updated = $state[$resource][$index];
            break;
        }
    }
    if (!$found) {
        hdb_json_response(['ok' => false, 'error' => 'Item not found'], 404);
    }
    hdb_audit($state, $resource . '.updated', ['id' => $id]);
    hdb_write_state($state);
    hdb_json_response(['ok' => true, 'data' => $updated]);
}

if ($method === 'DELETE') {
    if ($id === '') {
        hdb_json_response(['ok' => false, 'error' => 'Missing id'], 422);
    }
    $before = count($state[$resource]);
    $state[$resource] = array_values(array_filter($state[$resource], static function (array $item) use ($id): bool {
        return (string)($item['id'] ?? '') !== $id;
    }));
    if (count($state[$resource]) === $before) {
        hdb_json_response(['ok' => false, 'error' => 'Item not found'], 404);
    }
    hdb_audit($state, $resource . '.deleted', ['id' => $id]);
    hdb_write_state($state);
    hdb_json_response(['ok' => true]);
}

hdb_json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
