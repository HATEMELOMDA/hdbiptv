<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: same-origin');

$action = (string)($_GET['action'] ?? 'health');
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($action === 'health') {
    $db = hdb_db();
    hdb_json(['ok' => true, 'version' => $db['meta']['version'] ?? '2.0.0', 'time' => hdb_now()]);
}

if ($action === 'login' && $method === 'POST') {
    $body = hdb_request();
    $username = trim((string)($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');
    $db = hdb_db();
    foreach ($db['users'] as $user) {
        if (($user['username'] ?? '') === $username && !empty($user['active']) && password_verify($password, (string)$user['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['user'] = [
                'id' => $user['id'],
                'username' => $user['username'],
                'display_name' => $user['display_name'],
                'role' => $user['role'],
            ];
            $_SESSION['csrf'] = bin2hex(random_bytes(24));
            hdb_audit($db, 'login', 'session', (string)$user['id']);
            hdb_save($db);
            hdb_json(['ok' => true, 'user' => $_SESSION['user'], 'csrf' => $_SESSION['csrf']]);
        }
    }
    hdb_json(['ok' => false, 'error' => 'Invalid username or password'], 401);
}

if ($action === 'logout' && $method === 'POST') {
    hdb_require_admin(true);
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
    }
    session_destroy();
    hdb_json(['ok' => true]);
}

if ($action === 'me') {
    $user = hdb_user();
    if (!$user) {
        hdb_json(['ok' => false, 'authenticated' => false], 401);
    }
    hdb_json(['ok' => true, 'authenticated' => true, 'user' => $user, 'csrf' => $_SESSION['csrf'] ?? '']);
}

if ($action === 'tv-context' && $method === 'GET') {
    $db = hdb_db();
    $roomNumber = trim((string)($_GET['room'] ?? ''));
    $deviceCode = trim((string)($_GET['device'] ?? ''));
    $room = null;
    $device = null;

    if ($deviceCode !== '') {
        foreach ($db['devices'] as $candidate) {
            if (($candidate['code'] ?? '') === $deviceCode) {
                $device = $candidate;
                break;
            }
        }
        if ($device && !empty($device['room_id'])) {
            $index = hdb_index_by_id($db['rooms'], (string)$device['room_id']);
            if ($index >= 0) {
                $room = $db['rooms'][$index];
            }
        }
    }

    if (!$room && $roomNumber !== '') {
        $room = hdb_room_by_number($db, $roomNumber);
    }

    if (!$room) {
        hdb_json(['ok' => false, 'error' => 'Room or device not registered'], 404);
    }

    $guest = null;
    if (!empty($room['guest_id'])) {
        $guestIndex = hdb_index_by_id($db['guests'], (string)$room['guest_id']);
        if ($guestIndex >= 0 && ($db['guests'][$guestIndex]['status'] ?? '') === 'checked_in') {
            $guest = $db['guests'][$guestIndex];
        }
    }

    $package = (string)($room['package'] ?? 'standard');
    $channels = array_values(array_filter($db['channels'], static function (array $channel) use ($package): bool {
        if (($channel['status'] ?? '') !== 'active') {
            return false;
        }
        return ($channel['package'] ?? 'standard') === 'standard' || ($channel['package'] ?? '') === $package;
    }));
    usort($channels, static fn(array $a, array $b): int => ((int)($a['sort'] ?? $a['number'] ?? 0)) <=> ((int)($b['sort'] ?? $b['number'] ?? 0)));

    $services = array_values(array_filter($db['services'], static fn(array $service): bool => !empty($service['active'])));
    usort($services, static fn(array $a, array $b): int => ((int)($a['sort'] ?? 0)) <=> ((int)($b['sort'] ?? 0)));

    hdb_json([
        'ok' => true,
        'meta' => $db['meta'],
        'theme' => $db['theme'],
        'room' => $room,
        'guest' => $guest,
        'device' => $device,
        'channels' => $channels,
        'services' => $services,
        'messages' => hdb_visible_messages($db, $room),
        'server_time' => hdb_now(),
    ]);
}

if ($action === 'device-register' && $method === 'POST') {
    $body = hdb_request();
    $code = trim((string)($body['code'] ?? ''));
    $roomNumber = trim((string)($body['room'] ?? ''));
    if ($code === '' || $roomNumber === '') {
        hdb_json(['ok' => false, 'error' => 'Device code and room are required'], 422);
    }
    $db = hdb_db();
    $room = hdb_room_by_number($db, $roomNumber);
    if (!$room) {
        hdb_json(['ok' => false, 'error' => 'Room not found'], 404);
    }
    $deviceIndex = -1;
    foreach ($db['devices'] as $i => $candidate) {
        if (($candidate['code'] ?? '') === $code) {
            $deviceIndex = $i;
            break;
        }
    }
    $device = [
        'id' => $deviceIndex >= 0 ? $db['devices'][$deviceIndex]['id'] : hdb_id('dev'),
        'code' => $code,
        'room_id' => $room['id'],
        'brand' => trim((string)($body['brand'] ?? 'Browser')),
        'model' => trim((string)($body['model'] ?? 'Unknown')),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
        'status' => 'online',
        'app_version' => trim((string)($body['app_version'] ?? '2.0.0-alpha.1')),
        'last_seen' => hdb_now(),
    ];
    if ($deviceIndex >= 0) {
        $db['devices'][$deviceIndex] = $device;
    } else {
        $db['devices'][] = $device;
    }
    $roomIndex = hdb_index_by_id($db['rooms'], (string)$room['id']);
    $db['rooms'][$roomIndex]['device_id'] = $device['id'];
    $db['rooms'][$roomIndex]['updated_at'] = hdb_now();
    hdb_audit($db, 'register', 'devices', (string)$device['id'], ['room' => $roomNumber]);
    hdb_save($db);
    hdb_json(['ok' => true, 'device' => $device]);
}

if ($action === 'service-request' && $method === 'POST') {
    $body = hdb_request();
    $roomNumber = trim((string)($body['room'] ?? ''));
    $serviceId = trim((string)($body['service_id'] ?? ''));
    $db = hdb_db();
    $room = hdb_room_by_number($db, $roomNumber);
    $serviceIndex = hdb_index_by_id($db['services'], $serviceId);
    if (!$room || $serviceIndex < 0) {
        hdb_json(['ok' => false, 'error' => 'Room or service not found'], 404);
    }
    $request = [
        'id' => hdb_id('req'),
        'room_id' => $room['id'],
        'room_number' => $room['number'],
        'service_id' => $serviceId,
        'service_name_ar' => $db['services'][$serviceIndex]['name_ar'],
        'service_name_en' => $db['services'][$serviceIndex]['name_en'],
        'note' => trim((string)($body['note'] ?? '')),
        'status' => 'new',
        'created_at' => hdb_now(),
        'updated_at' => hdb_now(),
    ];
    array_unshift($db['requests'], $request);
    hdb_audit($db, 'create', 'requests', $request['id'], ['room' => $roomNumber]);
    hdb_save($db);
    hdb_json(['ok' => true, 'request' => $request], 201);
}

$user = hdb_require_admin($method !== 'GET');
$db = hdb_db();

if ($action === 'dashboard' && $method === 'GET') {
    $occupied = count(array_filter($db['rooms'], static fn(array $room): bool => ($room['status'] ?? '') === 'occupied'));
    $online = count(array_filter($db['devices'], static fn(array $device): bool => ($device['status'] ?? '') === 'online'));
    $activeChannels = count(array_filter($db['channels'], static fn(array $channel): bool => ($channel['status'] ?? '') === 'active'));
    $openRequests = count(array_filter($db['requests'], static fn(array $request): bool => !in_array(($request['status'] ?? ''), ['completed', 'cancelled'], true)));
    hdb_json([
        'ok' => true,
        'metrics' => [
            'rooms_total' => count($db['rooms']),
            'rooms_occupied' => $occupied,
            'rooms_vacant' => count($db['rooms']) - $occupied,
            'devices_total' => count($db['devices']),
            'devices_online' => $online,
            'channels_active' => $activeChannels,
            'requests_open' => $openRequests,
        ],
        'recent_requests' => array_slice($db['requests'], 0, 8),
        'recent_audit' => array_slice($db['audit'], 0, 8),
        'meta' => $db['meta'],
    ]);
}

if ($action === 'list' && $method === 'GET') {
    $entity = (string)($_GET['entity'] ?? '');
    $allowed = ['rooms', 'guests', 'devices', 'channels', 'messages', 'services', 'requests', 'audit'];
    if (!in_array($entity, $allowed, true)) {
        hdb_json(['ok' => false, 'error' => 'Unsupported entity'], 422);
    }
    hdb_json(['ok' => true, 'entity' => $entity, 'items' => $db[$entity] ?? []]);
}

if ($action === 'settings' && $method === 'GET') {
    hdb_json(['ok' => true, 'meta' => $db['meta'], 'theme' => $db['theme']]);
}

if ($action === 'settings' && $method === 'POST') {
    $body = hdb_request();
    if (isset($body['meta']) && is_array($body['meta'])) {
        $db['meta'] = array_merge($db['meta'], array_intersect_key($body['meta'], array_flip(['hotel_name_ar', 'hotel_name_en'])));
    }
    if (isset($body['theme']) && is_array($body['theme'])) {
        $db['theme'] = array_merge($db['theme'], array_intersect_key($body['theme'], array_flip(['primary', 'background', 'surface', 'hero_image', 'welcome_ar', 'welcome_en', 'show_weather', 'show_prayer_times'])));
    }
    hdb_audit($db, 'update', 'settings', null);
    hdb_save($db);
    hdb_json(['ok' => true, 'meta' => $db['meta'], 'theme' => $db['theme']]);
}

if ($action === 'save' && $method === 'POST') {
    $body = hdb_request();
    $entity = (string)($body['entity'] ?? '');
    $item = isset($body['item']) && is_array($body['item']) ? $body['item'] : [];
    $allowed = [
        'rooms' => 'room',
        'devices' => 'dev',
        'channels' => 'ch',
        'messages' => 'msg',
        'services' => 'svc',
        'requests' => 'req',
    ];
    if (!isset($allowed[$entity])) {
        hdb_json(['ok' => false, 'error' => 'Unsupported entity'], 422);
    }
    $id = trim((string)($item['id'] ?? ''));
    $isNew = $id === '';
    if ($isNew) {
        $id = hdb_id($allowed[$entity]);
        $item['id'] = $id;
        $item['created_at'] = hdb_now();
    }
    $item['updated_at'] = hdb_now();
    $index = hdb_index_by_id($db[$entity], $id);
    if ($index >= 0) {
        $db[$entity][$index] = array_merge($db[$entity][$index], $item);
    } else {
        $db[$entity][] = $item;
    }
    hdb_audit($db, $isNew ? 'create' : 'update', $entity, $id);
    hdb_save($db);
    hdb_json(['ok' => true, 'item' => $index >= 0 ? $db[$entity][$index] : end($db[$entity])], $isNew ? 201 : 200);
}

if ($action === 'delete' && $method === 'POST') {
    $body = hdb_request();
    $entity = (string)($body['entity'] ?? '');
    $id = (string)($body['id'] ?? '');
    $allowed = ['rooms', 'devices', 'channels', 'messages', 'services'];
    if (!in_array($entity, $allowed, true)) {
        hdb_json(['ok' => false, 'error' => 'Unsupported entity'], 422);
    }
    $index = hdb_index_by_id($db[$entity], $id);
    if ($index < 0) {
        hdb_json(['ok' => false, 'error' => 'Item not found'], 404);
    }
    array_splice($db[$entity], $index, 1);
    hdb_audit($db, 'delete', $entity, $id);
    hdb_save($db);
    hdb_json(['ok' => true]);
}

if ($action === 'checkin' && $method === 'POST') {
    $body = hdb_request();
    $roomId = trim((string)($body['room_id'] ?? ''));
    $roomIndex = hdb_index_by_id($db['rooms'], $roomId);
    if ($roomIndex < 0) {
        hdb_json(['ok' => false, 'error' => 'Room not found'], 404);
    }
    if (($db['rooms'][$roomIndex]['status'] ?? '') === 'occupied') {
        hdb_json(['ok' => false, 'error' => 'Room is already occupied'], 409);
    }
    $guestName = trim((string)($body['full_name'] ?? ''));
    if ($guestName === '') {
        hdb_json(['ok' => false, 'error' => 'Guest name is required'], 422);
    }
    $guest = [
        'id' => hdb_id('gst'),
        'full_name' => $guestName,
        'language' => in_array(($body['language'] ?? 'ar'), ['ar', 'en'], true) ? $body['language'] : 'ar',
        'arrival' => (string)($body['arrival'] ?? gmdate('Y-m-d')),
        'departure' => (string)($body['departure'] ?? gmdate('Y-m-d', strtotime('+1 day'))),
        'room_id' => $roomId,
        'status' => 'checked_in',
        'created_at' => hdb_now(),
    ];
    $db['guests'][] = $guest;
    $db['rooms'][$roomIndex]['status'] = 'occupied';
    $db['rooms'][$roomIndex]['guest_id'] = $guest['id'];
    $db['rooms'][$roomIndex]['package'] = (string)($body['package'] ?? 'standard');
    $db['rooms'][$roomIndex]['updated_at'] = hdb_now();
    hdb_audit($db, 'checkin', 'rooms', $roomId, ['guest' => $guestName]);
    hdb_save($db);
    hdb_json(['ok' => true, 'guest' => $guest, 'room' => $db['rooms'][$roomIndex]], 201);
}

if ($action === 'checkout' && $method === 'POST') {
    $body = hdb_request();
    $roomId = trim((string)($body['room_id'] ?? ''));
    $roomIndex = hdb_index_by_id($db['rooms'], $roomId);
    if ($roomIndex < 0) {
        hdb_json(['ok' => false, 'error' => 'Room not found'], 404);
    }
    $guestId = (string)($db['rooms'][$roomIndex]['guest_id'] ?? '');
    if ($guestId !== '') {
        $guestIndex = hdb_index_by_id($db['guests'], $guestId);
        if ($guestIndex >= 0) {
            $db['guests'][$guestIndex]['status'] = 'checked_out';
            $db['guests'][$guestIndex]['checked_out_at'] = hdb_now();
        }
    }
    $db['rooms'][$roomIndex]['status'] = 'vacant';
    $db['rooms'][$roomIndex]['guest_id'] = null;
    $db['rooms'][$roomIndex]['package'] = 'standard';
    $db['rooms'][$roomIndex]['updated_at'] = hdb_now();
    hdb_audit($db, 'checkout', 'rooms', $roomId);
    hdb_save($db);
    hdb_json(['ok' => true, 'room' => $db['rooms'][$roomIndex]]);
}

if ($action === 'publish' && $method === 'POST') {
    $db['meta']['published_at'] = hdb_now();
    hdb_audit($db, 'publish', 'platform', null, ['version' => $db['meta']['version']]);
    hdb_save($db);
    hdb_json(['ok' => true, 'published_at' => $db['meta']['published_at']]);
}

if ($action === 'change-password' && $method === 'POST') {
    $body = hdb_request();
    $current = (string)($body['current_password'] ?? '');
    $next = (string)($body['new_password'] ?? '');
    if (strlen($next) < 10) {
        hdb_json(['ok' => false, 'error' => 'New password must contain at least 10 characters'], 422);
    }
    $index = hdb_index_by_id($db['users'], (string)$user['id']);
    if ($index < 0 || !password_verify($current, (string)$db['users'][$index]['password_hash'])) {
        hdb_json(['ok' => false, 'error' => 'Current password is incorrect'], 422);
    }
    $db['users'][$index]['password_hash'] = password_hash($next, PASSWORD_DEFAULT);
    hdb_audit($db, 'change_password', 'users', (string)$user['id']);
    hdb_save($db);
    hdb_json(['ok' => true]);
}

hdb_json(['ok' => false, 'error' => 'Route not found'], 404);
