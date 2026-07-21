<?php
declare(strict_types=1);

const HDB_V2_DATA_DIR = __DIR__ . '/data';
const HDB_V2_STATE_FILE = HDB_V2_DATA_DIR . '/state.json';
const HDB_V2_AUDIT_FILE = HDB_V2_DATA_DIR . '/audit.log';
const HDB_V2_DEFAULT_TOKEN = 'change-me-production-token';

function hdb_v2_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-HDB-Token, X-HDB-User, X-HDB-Role');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
}

function hdb_v2_response(array $payload, int $status = 200): void
{
    hdb_v2_headers();
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function hdb_v2_request_id(): string
{
    return 'REQ-' . gmdate('YmdHis') . '-' . substr(bin2hex(random_bytes(4)), 0, 8);
}

function hdb_v2_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return $_POST ?: [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        hdb_v2_response(['ok' => false, 'error' => 'invalid_json', 'message' => 'Request body must be valid JSON'], 400);
    }
    return $data;
}

function hdb_v2_auth_required(): void
{
    $configured = getenv('HDB_API_TOKEN') ?: HDB_V2_DEFAULT_TOKEN;
    $header = $_SERVER['HTTP_X_HDB_TOKEN'] ?? '';
    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && preg_match('/Bearer\s+(.+)/i', $authorization, $matches)) {
        $header = trim($matches[1]);
    }
    if (!hash_equals($configured, (string)$header)) {
        hdb_v2_response(['ok' => false, 'error' => 'unauthorized', 'message' => 'A valid HDB API token is required'], 401);
    }
}

function hdb_v2_actor(): array
{
    return [
        'name' => $_SERVER['HTTP_X_HDB_USER'] ?? 'system',
        'role' => $_SERVER['HTTP_X_HDB_ROLE'] ?? 'administrator',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'local'
    ];
}

function hdb_v2_ensure_storage(): void
{
    if (!is_dir(HDB_V2_DATA_DIR) && !mkdir(HDB_V2_DATA_DIR, 0775, true) && !is_dir(HDB_V2_DATA_DIR)) {
        hdb_v2_response(['ok' => false, 'error' => 'storage_unavailable'], 500);
    }
    if (!is_file(HDB_V2_STATE_FILE)) {
        $seed = [
            'meta' => [
                'version' => '2.0.0-global',
                'property' => 'HDB Riyadh Tower',
                'timezone' => 'Asia/Riyadh',
                'updated_at' => gmdate('c')
            ],
            'properties' => [], 'buildings' => [], 'floors' => [], 'rooms' => [], 'guests' => [],
            'devices' => [], 'channels' => [], 'packages' => [], 'epg' => [], 'requests' => [],
            'signage' => [], 'integrations' => [], 'users' => [], 'audit' => [],
            'experience' => [
                'hotel' => 'HDB Hospitality',
                'welcome_ar' => 'أهلًا بك في هدب',
                'welcome_en' => 'Welcome to HDB',
                'subtitle_ar' => 'إقامة هادئة وتجربة رقمية صُممت لتكون كل خدمات الفندق بين يديك.',
                'subtitle_en' => 'A calm stay with every hotel service within reach.',
                'accent' => '#d9b66f',
                'background' => 'midnight',
                'weather' => true,
                'prayer' => true,
                'bill' => true,
                'checkout' => true,
                'published_at' => null
            ],
            'system' => ['api' => 100, 'middleware' => 100, 'headend' => 0, 'devices' => 0, 'storage' => 0, 'cpu' => 0, 'memory' => 0, 'streams' => 0]
        ];
        hdb_v2_write_state($seed);
    }
}

function hdb_v2_read_state(): array
{
    hdb_v2_ensure_storage();
    $handle = fopen(HDB_V2_STATE_FILE, 'rb');
    if ($handle === false) {
        hdb_v2_response(['ok' => false, 'error' => 'state_open_failed'], 500);
    }
    flock($handle, LOCK_SH);
    $raw = stream_get_contents($handle) ?: '{}';
    flock($handle, LOCK_UN);
    fclose($handle);
    $state = json_decode($raw, true);
    if (!is_array($state)) {
        hdb_v2_response(['ok' => false, 'error' => 'state_corrupted'], 500);
    }
    return $state;
}

function hdb_v2_write_state(array $state): void
{
    hdb_v2_ensure_storage();
    $state['meta'] = $state['meta'] ?? [];
    $state['meta']['updated_at'] = gmdate('c');
    $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        hdb_v2_response(['ok' => false, 'error' => 'state_encode_failed'], 500);
    }
    $tmp = HDB_V2_STATE_FILE . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        hdb_v2_response(['ok' => false, 'error' => 'state_write_failed'], 500);
    }
    if (!rename($tmp, HDB_V2_STATE_FILE)) {
        @unlink($tmp);
        hdb_v2_response(['ok' => false, 'error' => 'state_commit_failed'], 500);
    }
}

function hdb_v2_audit(string $action, array $context = []): void
{
    hdb_v2_ensure_storage();
    $entry = [
        'id' => hdb_v2_request_id(),
        'time' => gmdate('c'),
        'action' => $action,
        'actor' => hdb_v2_actor(),
        'context' => $context
    ];
    file_put_contents(HDB_V2_AUDIT_FILE, json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function hdb_v2_collection_names(): array
{
    return ['properties','buildings','floors','rooms','guests','devices','channels','packages','epg','requests','signage','integrations','users','audit'];
}

function hdb_v2_find_index(array $items, string $id): int
{
    foreach ($items as $index => $item) {
        if ((string)($item['id'] ?? '') === $id) {
            return $index;
        }
    }
    return -1;
}

function hdb_v2_new_id(string $resource): string
{
    $prefix = strtoupper(substr(preg_replace('/[^a-z]/i', '', $resource), 0, 4));
    return $prefix . '-' . gmdate('YmdHis') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
}

function hdb_v2_dashboard(array $state): array
{
    $count = static function(array $items, string $field, string $value): int {
        return count(array_filter($items, static fn(array $item): bool => (string)($item[$field] ?? '') === $value));
    };
    $rooms = $state['rooms'] ?? [];
    $devices = $state['devices'] ?? [];
    $channels = $state['channels'] ?? [];
    $requests = $state['requests'] ?? [];
    return [
        'occupied_rooms' => $count($rooms, 'status', 'occupied'),
        'total_rooms' => count($rooms),
        'online_devices' => $count($devices, 'status', 'online'),
        'total_devices' => count($devices),
        'online_channels' => $count($channels, 'status', 'online'),
        'total_channels' => count($channels),
        'open_requests' => count(array_filter($requests, static fn(array $item): bool => ($item['status'] ?? '') !== 'done')),
        'updated_at' => $state['meta']['updated_at'] ?? null
    ];
}
