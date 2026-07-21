<?php
declare(strict_types=1);

const HDB_DATA_DIR = __DIR__ . '/../storage';
const HDB_VERSION = '0.1.0-alpha.1';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

function hdb_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function hdb_read_collection(string $collection): array
{
    if (!preg_match('/^[a-z0-9_-]+$/i', $collection)) {
        hdb_response(['ok' => false, 'error' => 'invalid_collection'], 400);
    }

    $path = HDB_DATA_DIR . '/' . $collection . '.json';
    if (!is_file($path)) {
        return [];
    }

    $raw = file_get_contents($path);
    if ($raw === false) {
        hdb_response(['ok' => false, 'error' => 'storage_read_failed'], 500);
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function hdb_write_collection(string $collection, array $data): void
{
    if (!is_dir(HDB_DATA_DIR) && !mkdir(HDB_DATA_DIR, 0775, true) && !is_dir(HDB_DATA_DIR)) {
        hdb_response(['ok' => false, 'error' => 'storage_directory_failed'], 500);
    }

    $path = HDB_DATA_DIR . '/' . $collection . '.json';
    $temp = $path . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

    if ($json === false || file_put_contents($temp, $json, LOCK_EX) === false || !rename($temp, $path)) {
        @unlink($temp);
        hdb_response(['ok' => false, 'error' => 'storage_write_failed'], 500);
    }
}

function hdb_body(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        hdb_response(['ok' => false, 'error' => 'invalid_json'], 400);
    }

    return $data;
}
