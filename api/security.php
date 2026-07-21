<?php
declare(strict_types=1);

const HDB_USERS_FILE = __DIR__ . '/data/users.json';

function hdb_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_name('HDBSESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function hdb_read_users(): array
{
    if (!is_dir(HDB_DATA_DIR)) {
        mkdir(HDB_DATA_DIR, 0775, true);
    }
    if (!file_exists(HDB_USERS_FILE)) {
        file_put_contents(HDB_USERS_FILE, "[]\n", LOCK_EX);
    }
    $raw = file_get_contents(HDB_USERS_FILE) ?: '[]';
    $users = json_decode($raw, true);
    return is_array($users) ? $users : [];
}

function hdb_write_users(array $users): void
{
    if (!is_dir(HDB_DATA_DIR)) {
        mkdir(HDB_DATA_DIR, 0775, true);
    }
    $json = json_encode(array_values($users), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        hdb_json_response(['ok' => false, 'error' => 'Unable to encode users'], 500);
    }
    $tmp = HDB_USERS_FILE . '.tmp';
    if (file_put_contents($tmp, $json . "\n", LOCK_EX) === false || !rename($tmp, HDB_USERS_FILE)) {
        @unlink($tmp);
        hdb_json_response(['ok' => false, 'error' => 'Unable to persist users'], 500);
    }
}

function hdb_current_user(): ?array
{
    hdb_start_session();
    if (empty($_SESSION['hdb_user']) || !is_array($_SESSION['hdb_user'])) {
        return null;
    }
    return $_SESSION['hdb_user'];
}

function hdb_require_auth(): array
{
    $user = hdb_current_user();
    if ($user === null) {
        hdb_json_response(['ok' => false, 'error' => 'Authentication required'], 401);
    }
    return $user;
}

function hdb_require_role(array $roles): array
{
    $user = hdb_require_auth();
    if (!in_array((string)($user['role'] ?? ''), $roles, true)) {
        hdb_json_response(['ok' => false, 'error' => 'Insufficient permissions'], 403);
    }
    return $user;
}

function hdb_csrf_token(): string
{
    hdb_start_session();
    if (empty($_SESSION['hdb_csrf'])) {
        $_SESSION['hdb_csrf'] = bin2hex(random_bytes(24));
    }
    return (string)$_SESSION['hdb_csrf'];
}

function hdb_verify_csrf(): void
{
    hdb_start_session();
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }
    $sent = (string)($_SERVER['HTTP_X_HDB_CSRF'] ?? '');
    $known = (string)($_SESSION['hdb_csrf'] ?? '');
    if ($known === '' || $sent === '' || !hash_equals($known, $sent)) {
        hdb_json_response(['ok' => false, 'error' => 'Invalid CSRF token'], 419);
    }
}
