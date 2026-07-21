<?php
declare(strict_types=1);

const HDB_DATA_DIR = __DIR__ . '/data';
const HDB_STATE_FILE = HDB_DATA_DIR . '/state.json';

function hdb_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, X-HDB-Token');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function hdb_ensure_storage(): void
{
    if (!is_dir(HDB_DATA_DIR) && !mkdir(HDB_DATA_DIR, 0775, true) && !is_dir(HDB_DATA_DIR)) {
        hdb_json_response(['ok' => false, 'error' => 'Unable to create data directory'], 500);
    }
    if (!file_exists(HDB_STATE_FILE)) {
        $seed = [
            'meta' => ['version' => '1.1.0', 'updated_at' => gmdate('c')],
            'rooms' => [], 'devices' => [], 'channels' => [], 'requests' => [],
            'messages' => [], 'services' => [], 'audit' => [],
            'experience' => [
                'hotel' => 'HDB Hospitality',
                'title' => 'أهلًا بك في هدب',
                'subtitle' => 'إقامة هادئة وتجربة رقمية صُممت لتكون كل خدمات الفندق بين يديك.',
                'primary_color' => '#d6b36a',
                'published_at' => null
            ]
        ];
        hdb_write_state($seed);
    }
}

function hdb_read_state(): array
{
    hdb_ensure_storage();
    $handle = fopen(HDB_STATE_FILE, 'rb');
    if ($handle === false) {
        hdb_json_response(['ok' => false, 'error' => 'Unable to open state'], 500);
    }
    flock($handle, LOCK_SH);
    $raw = stream_get_contents($handle) ?: '{}';
    flock($handle, LOCK_UN);
    fclose($handle);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function hdb_write_state(array $state): void
{
    if (!is_dir(HDB_DATA_DIR)) {
        mkdir(HDB_DATA_DIR, 0775, true);
    }
    $state['meta']['updated_at'] = gmdate('c');
    $tmp = HDB_STATE_FILE . '.tmp';
    $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false || file_put_contents($tmp, $json, LOCK_EX) === false) {
        hdb_json_response(['ok' => false, 'error' => 'Unable to write state'], 500);
    }
    if (!rename($tmp, HDB_STATE_FILE)) {
        @unlink($tmp);
        hdb_json_response(['ok' => false, 'error' => 'Unable to commit state'], 500);
    }
}

function hdb_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return $_POST ?: [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function hdb_id(string $prefix): string
{
    return strtoupper($prefix) . '-' . gmdate('YmdHis') . '-' . substr(bin2hex(random_bytes(4)), 0, 8);
}

function hdb_audit(array &$state, string $action, array $context = []): void
{
    $state['audit'] = $state['audit'] ?? [];
    array_unshift($state['audit'], [
        'id' => hdb_id('AUD'),
        'action' => $action,
        'context' => $context,
        'actor' => $_SERVER['HTTP_X_HDB_USER'] ?? 'system',
        'created_at' => gmdate('c')
    ]);
    $state['audit'] = array_slice($state['audit'], 0, 500);
}
