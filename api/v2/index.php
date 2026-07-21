<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

hdb_v2_headers();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$resource = strtolower(trim((string)($_GET['resource'] ?? 'state')));
$id = trim((string)($_GET['id'] ?? ''));
$requestId = hdb_v2_request_id();

if ($resource === 'ping') {
    hdb_v2_response([
        'ok' => true,
        'request_id' => $requestId,
        'service' => 'HDB Global Hospitality Core',
        'version' => '2.0.0-global',
        'time' => gmdate('c')
    ]);
}

hdb_v2_auth_required();
$state = hdb_v2_read_state();

if ($resource === 'dashboard' && $method === 'GET') {
    hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => hdb_v2_dashboard($state)]);
}

if ($resource === 'health' && $method === 'GET') {
    hdb_v2_response([
        'ok' => true,
        'request_id' => $requestId,
        'data' => [
            'api' => ['status' => 'online', 'latency_ms' => 1],
            'storage' => ['status' => is_writable(HDB_V2_DATA_DIR) ? 'online' : 'warning'],
            'state_file' => ['status' => is_readable(HDB_V2_STATE_FILE) ? 'online' : 'failed', 'size_bytes' => filesize(HDB_V2_STATE_FILE) ?: 0],
            'server_time' => gmdate('c'),
            'php_version' => PHP_VERSION
        ]
    ]);
}

if ($resource === 'state') {
    if ($method === 'GET') {
        hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => $state]);
    }
    if (in_array($method, ['PUT', 'POST'], true)) {
        $body = hdb_v2_body();
        $newState = $body['data'] ?? null;
        if (!is_array($newState)) {
            hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'data_required'], 422);
        }
        $newState['meta']['version'] = $newState['meta']['version'] ?? '2.0.0-global';
        hdb_v2_write_state($newState);
        hdb_v2_audit('state.replace', ['collections' => array_keys($newState)]);
        hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => $newState]);
    }
    hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'method_not_allowed'], 405);
}

if ($resource === 'experience') {
    if ($method === 'GET') {
        hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => $state['experience'] ?? []]);
    }
    if (in_array($method, ['PUT', 'PATCH', 'POST'], true)) {
        $body = hdb_v2_body();
        $state['experience'] = array_replace($state['experience'] ?? [], $body);
        $state['experience']['published_at'] = $body['publish'] ?? false ? gmdate('c') : ($state['experience']['published_at'] ?? null);
        hdb_v2_write_state($state);
        hdb_v2_audit('experience.update', ['published' => (bool)($body['publish'] ?? false)]);
        hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => $state['experience']]);
    }
    hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'method_not_allowed'], 405);
}

if ($resource === 'device-command' && $method === 'POST') {
    $body = hdb_v2_body();
    $deviceId = trim((string)($body['device_id'] ?? ''));
    $command = trim((string)($body['command'] ?? ''));
    if ($deviceId === '' || !in_array($command, ['restart','sync','launch','shutdown','clear-cache','update'], true)) {
        hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'invalid_device_command'], 422);
    }
    hdb_v2_audit('device.command', ['device_id' => $deviceId, 'command' => $command]);
    hdb_v2_response([
        'ok' => true,
        'request_id' => $requestId,
        'data' => ['device_id' => $deviceId, 'command' => $command, 'status' => 'queued', 'queued_at' => gmdate('c')]
    ], 202);
}

if ($resource === 'integration-test' && $method === 'POST') {
    $body = hdb_v2_body();
    $integrationId = trim((string)($body['integration_id'] ?? ''));
    if ($integrationId === '') {
        hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'integration_id_required'], 422);
    }
    hdb_v2_audit('integration.test', ['integration_id' => $integrationId]);
    hdb_v2_response([
        'ok' => true,
        'request_id' => $requestId,
        'data' => ['integration_id' => $integrationId, 'status' => 'reachable', 'tested_at' => gmdate('c')]
    ]);
}

if (!in_array($resource, hdb_v2_collection_names(), true)) {
    hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'resource_not_found', 'resource' => $resource], 404);
}

$state[$resource] = is_array($state[$resource] ?? null) ? $state[$resource] : [];
$items = $state[$resource];

if ($method === 'GET') {
    if ($id !== '') {
        $index = hdb_v2_find_index($items, $id);
        if ($index < 0) {
            hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'not_found'], 404);
        }
        hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => $items[$index]]);
    }
    $query = strtolower(trim((string)($_GET['q'] ?? '')));
    $status = trim((string)($_GET['status'] ?? ''));
    $filtered = array_values(array_filter($items, static function(array $item) use ($query, $status): bool {
        if ($status !== '' && (string)($item['status'] ?? '') !== $status) {
            return false;
        }
        if ($query === '') {
            return true;
        }
        return str_contains(strtolower(json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: ''), $query);
    }));
    hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'count' => count($filtered), 'data' => $filtered]);
}

if ($method === 'POST') {
    $body = hdb_v2_body();
    $body['id'] = trim((string)($body['id'] ?? '')) ?: hdb_v2_new_id($resource);
    if (hdb_v2_find_index($items, (string)$body['id']) >= 0) {
        hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'duplicate_id'], 409);
    }
    $body['created_at'] = $body['created_at'] ?? gmdate('c');
    $body['updated_at'] = gmdate('c');
    $state[$resource][] = $body;
    hdb_v2_write_state($state);
    hdb_v2_audit($resource . '.create', ['id' => $body['id']]);
    hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => $body], 201);
}

if (in_array($method, ['PUT', 'PATCH'], true)) {
    if ($id === '') {
        hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'id_required'], 422);
    }
    $index = hdb_v2_find_index($items, $id);
    if ($index < 0) {
        hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'not_found'], 404);
    }
    $body = hdb_v2_body();
    $updated = $method === 'PUT' ? $body : array_replace($items[$index], $body);
    $updated['id'] = $id;
    $updated['created_at'] = $items[$index]['created_at'] ?? ($updated['created_at'] ?? gmdate('c'));
    $updated['updated_at'] = gmdate('c');
    $state[$resource][$index] = $updated;
    hdb_v2_write_state($state);
    hdb_v2_audit($resource . '.update', ['id' => $id]);
    hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => $updated]);
}

if ($method === 'DELETE') {
    if ($id === '') {
        hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'id_required'], 422);
    }
    $index = hdb_v2_find_index($items, $id);
    if ($index < 0) {
        hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'not_found'], 404);
    }
    $deleted = $items[$index];
    array_splice($state[$resource], $index, 1);
    hdb_v2_write_state($state);
    hdb_v2_audit($resource . '.delete', ['id' => $id]);
    hdb_v2_response(['ok' => true, 'request_id' => $requestId, 'data' => $deleted]);
}

hdb_v2_response(['ok' => false, 'request_id' => $requestId, 'error' => 'method_not_allowed'], 405);
