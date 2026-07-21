<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/security.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = strtolower(trim((string)($_GET['action'] ?? 'session')));

if ($method === 'OPTIONS') {
    hdb_json_response(['ok' => true]);
}

if ($action === 'session' && $method === 'GET') {
    $users = hdb_read_users();
    $user = hdb_current_user();
    hdb_json_response([
        'ok' => true,
        'configured' => count($users) > 0,
        'authenticated' => $user !== null,
        'user' => $user,
        'csrf' => $user ? hdb_csrf_token() : null,
    ]);
}

if ($action === 'login' && $method === 'POST') {
    $body = hdb_body();
    $username = strtolower(trim((string)($body['username'] ?? '')));
    $password = (string)($body['password'] ?? '');
    $matched = null;
    foreach (hdb_read_users() as $user) {
        if (strtolower((string)($user['username'] ?? '')) === $username && !empty($user['active'])) {
            $matched = $user;
            break;
        }
    }
    if ($matched === null || !password_verify($password, (string)($matched['password_hash'] ?? ''))) {
        usleep(300000);
        hdb_json_response(['ok' => false, 'error' => 'Invalid username or password'], 401);
    }
    hdb_start_session();
    session_regenerate_id(true);
    $_SESSION['hdb_user'] = [
        'id' => $matched['id'],
        'name' => $matched['name'],
        'username' => $matched['username'],
        'role' => $matched['role'],
    ];
    hdb_json_response(['ok' => true, 'user' => $_SESSION['hdb_user'], 'csrf' => hdb_csrf_token()]);
}

if ($action === 'logout' && $method === 'POST') {
    hdb_verify_csrf();
    hdb_start_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
    }
    session_destroy();
    hdb_json_response(['ok' => true]);
}

hdb_json_response(['ok' => false, 'error' => 'Unsupported authentication action'], 405);
