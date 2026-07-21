<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/security.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    hdb_json_response(['ok' => true]);
}

$users = hdb_read_users();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    hdb_json_response(['ok' => true, 'configured' => count($users) > 0]);
}

if (count($users) > 0) {
    hdb_json_response(['ok' => false, 'error' => 'System is already configured'], 409);
}

$body = hdb_body();
$name = trim((string)($body['name'] ?? 'مدير النظام'));
$username = strtolower(trim((string)($body['username'] ?? '')));
$password = (string)($body['password'] ?? '');

if (!preg_match('/^[a-z0-9._-]{3,40}$/', $username)) {
    hdb_json_response(['ok' => false, 'error' => 'Username must contain 3-40 Latin letters, digits, dot, dash or underscore'], 422);
}
if (strlen($password) < 10) {
    hdb_json_response(['ok' => false, 'error' => 'Password must be at least 10 characters'], 422);
}

$user = [
    'id' => hdb_id('USR'),
    'name' => $name !== '' ? $name : 'مدير النظام',
    'username' => $username,
    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    'role' => 'owner',
    'active' => true,
    'created_at' => gmdate('c'),
];
hdb_write_users([$user]);

hdb_start_session();
session_regenerate_id(true);
$_SESSION['hdb_user'] = [
    'id' => $user['id'],
    'name' => $user['name'],
    'username' => $user['username'],
    'role' => $user['role'],
];

hdb_json_response([
    'ok' => true,
    'user' => $_SESSION['hdb_user'],
    'csrf' => hdb_csrf_token(),
], 201);
