<?php
declare(strict_types=1);

const HDB_ROOT = __DIR__ . '/..';
const HDB_STORAGE = HDB_ROOT . '/storage';
const HDB_DATABASE = HDB_STORAGE . '/database.json';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('HDB_HOSPITALITY');
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'path' => '/',
    ]);
    session_start();
}

function hdb_now(): string
{
    return gmdate('c');
}

function hdb_id(string $prefix): string
{
    return $prefix . '_' . bin2hex(random_bytes(6));
}

function hdb_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function hdb_request(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return $_POST ?: [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        hdb_json(['ok' => false, 'error' => 'Invalid JSON body'], 400);
    }
    return $data;
}

function hdb_seed(): array
{
    $now = hdb_now();
    return [
        'meta' => [
            'version' => '2.0.0-alpha.1',
            'hotel_name_ar' => 'فندق هدب',
            'hotel_name_en' => 'HDB Hotel',
            'published_at' => null,
            'updated_at' => $now,
        ],
        'users' => [[
            'id' => 'usr_admin',
            'username' => 'admin',
            'display_name' => 'System Administrator',
            'role' => 'admin',
            'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
            'active' => true,
            'created_at' => $now,
        ]],
        'rooms' => [
            ['id' => 'room_1201', 'number' => '1201', 'floor' => '12', 'type' => 'Deluxe King', 'status' => 'occupied', 'guest_id' => 'gst_demo', 'device_id' => 'dev_demo', 'package' => 'premium', 'updated_at' => $now],
            ['id' => 'room_1202', 'number' => '1202', 'floor' => '12', 'type' => 'Twin', 'status' => 'vacant', 'guest_id' => null, 'device_id' => null, 'package' => 'standard', 'updated_at' => $now],
            ['id' => 'room_1301', 'number' => '1301', 'floor' => '13', 'type' => 'Suite', 'status' => 'vacant', 'guest_id' => null, 'device_id' => null, 'package' => 'premium', 'updated_at' => $now],
        ],
        'guests' => [[
            'id' => 'gst_demo',
            'full_name' => 'Hatem Elomda',
            'language' => 'ar',
            'arrival' => gmdate('Y-m-d'),
            'departure' => gmdate('Y-m-d', strtotime('+2 days')),
            'room_id' => 'room_1201',
            'status' => 'checked_in',
            'created_at' => $now,
        ]],
        'devices' => [[
            'id' => 'dev_demo',
            'code' => 'HDB-TV-1201',
            'room_id' => 'room_1201',
            'brand' => 'Samsung',
            'model' => 'Hospitality TV',
            'ip' => '192.168.1.120',
            'status' => 'online',
            'app_version' => '2.0.0-alpha.1',
            'last_seen' => $now,
        ]],
        'channels' => [
            ['id' => 'ch_001', 'number' => 1, 'name_ar' => 'القرآن الكريم', 'name_en' => 'Holy Quran', 'group' => 'religion', 'logo' => '', 'source' => '', 'backup_source' => '', 'status' => 'active', 'package' => 'standard', 'sort' => 1, 'updated_at' => $now],
            ['id' => 'ch_002', 'number' => 2, 'name_ar' => 'السعودية', 'name_en' => 'Saudi TV', 'group' => 'local', 'logo' => '', 'source' => '', 'backup_source' => '', 'status' => 'active', 'package' => 'standard', 'sort' => 2, 'updated_at' => $now],
            ['id' => 'ch_003', 'number' => 3, 'name_ar' => 'الإخبارية', 'name_en' => 'Al Ekhbariya', 'group' => 'news', 'logo' => '', 'source' => '', 'backup_source' => '', 'status' => 'active', 'package' => 'standard', 'sort' => 3, 'updated_at' => $now],
        ],
        'messages' => [[
            'id' => 'msg_welcome',
            'title_ar' => 'مرحبًا بكم',
            'title_en' => 'Welcome',
            'body_ar' => 'نتمنى لكم إقامة سعيدة ومريحة.',
            'body_en' => 'We wish you a pleasant and comfortable stay.',
            'scope' => 'all',
            'scope_id' => null,
            'active' => true,
            'starts_at' => $now,
            'ends_at' => null,
            'created_at' => $now,
        ]],
        'services' => [
            ['id' => 'svc_housekeeping', 'name_ar' => 'خدمة الغرف', 'name_en' => 'Housekeeping', 'icon' => 'sparkles', 'category' => 'hotel', 'active' => true, 'sort' => 1],
            ['id' => 'svc_laundry', 'name_ar' => 'المغسلة', 'name_en' => 'Laundry', 'icon' => 'shirt', 'category' => 'hotel', 'active' => true, 'sort' => 2],
            ['id' => 'svc_dining', 'name_ar' => 'طلب الطعام', 'name_en' => 'In-room Dining', 'icon' => 'utensils', 'category' => 'dining', 'active' => true, 'sort' => 3],
            ['id' => 'svc_maintenance', 'name_ar' => 'الصيانة', 'name_en' => 'Maintenance', 'icon' => 'wrench', 'category' => 'hotel', 'active' => true, 'sort' => 4],
        ],
        'requests' => [],
        'theme' => [
            'primary' => '#d2b272',
            'background' => '#081018',
            'surface' => '#111b25',
            'hero_image' => '',
            'welcome_ar' => 'مرحبًا بك في فندق هدب',
            'welcome_en' => 'Welcome to HDB Hotel',
            'show_weather' => true,
            'show_prayer_times' => true,
        ],
        'audit' => [],
    ];
}

function hdb_prepare_storage(): void
{
    if (!is_dir(HDB_STORAGE) && !mkdir(HDB_STORAGE, 0775, true) && !is_dir(HDB_STORAGE)) {
        hdb_json(['ok' => false, 'error' => 'Unable to create storage directory'], 500);
    }
    if (!file_exists(HDB_DATABASE)) {
        $seed = json_encode(hdb_seed(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if (file_put_contents(HDB_DATABASE, $seed, LOCK_EX) === false) {
            hdb_json(['ok' => false, 'error' => 'Unable to initialize database'], 500);
        }
    }
}

function hdb_db(): array
{
    hdb_prepare_storage();
    $handle = fopen(HDB_DATABASE, 'rb');
    if ($handle === false) {
        hdb_json(['ok' => false, 'error' => 'Unable to open database'], 500);
    }
    flock($handle, LOCK_SH);
    $json = stream_get_contents($handle) ?: '{}';
    flock($handle, LOCK_UN);
    fclose($handle);
    $db = json_decode($json, true);
    if (!is_array($db)) {
        hdb_json(['ok' => false, 'error' => 'Database file is corrupted'], 500);
    }
    return $db;
}

function hdb_save(array $db): void
{
    hdb_prepare_storage();
    $db['meta']['updated_at'] = hdb_now();
    $tmp = HDB_DATABASE . '.tmp';
    $json = json_encode($db, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false || file_put_contents($tmp, $json, LOCK_EX) === false) {
        hdb_json(['ok' => false, 'error' => 'Unable to write database'], 500);
    }
    if (!rename($tmp, HDB_DATABASE)) {
        @unlink($tmp);
        hdb_json(['ok' => false, 'error' => 'Unable to commit database update'], 500);
    }
}

function hdb_user(): ?array
{
    return isset($_SESSION['user']) && is_array($_SESSION['user']) ? $_SESSION['user'] : null;
}

function hdb_require_admin(bool $csrf = false): array
{
    $user = hdb_user();
    if (!$user) {
        hdb_json(['ok' => false, 'error' => 'Authentication required'], 401);
    }
    if ($csrf && ($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        $token = $_SERVER['HTTP_X_HDB_CSRF'] ?? '';
        if ($token === '' || !hash_equals((string)($_SESSION['csrf'] ?? ''), $token)) {
            hdb_json(['ok' => false, 'error' => 'Invalid security token'], 419);
        }
    }
    return $user;
}

function hdb_audit(array &$db, string $action, string $entity, ?string $entityId = null, array $details = []): void
{
    $user = hdb_user();
    array_unshift($db['audit'], [
        'id' => hdb_id('log'),
        'user' => $user['username'] ?? 'system',
        'action' => $action,
        'entity' => $entity,
        'entity_id' => $entityId,
        'details' => $details,
        'created_at' => hdb_now(),
    ]);
    $db['audit'] = array_slice($db['audit'], 0, 500);
}

function hdb_index_by_id(array $rows, string $id): int
{
    foreach ($rows as $index => $row) {
        if (($row['id'] ?? '') === $id) {
            return $index;
        }
    }
    return -1;
}

function hdb_room_by_number(array $db, string $number): ?array
{
    foreach ($db['rooms'] as $room) {
        if ((string)$room['number'] === $number) {
            return $room;
        }
    }
    return null;
}

function hdb_visible_messages(array $db, array $room): array
{
    $now = time();
    return array_values(array_filter($db['messages'], static function (array $message) use ($room, $now): bool {
        if (empty($message['active'])) {
            return false;
        }
        if (!empty($message['starts_at']) && strtotime((string)$message['starts_at']) > $now) {
            return false;
        }
        if (!empty($message['ends_at']) && strtotime((string)$message['ends_at']) < $now) {
            return false;
        }
        $scope = $message['scope'] ?? 'all';
        if ($scope === 'all') {
            return true;
        }
        if ($scope === 'room') {
            return ($message['scope_id'] ?? null) === ($room['id'] ?? null);
        }
        if ($scope === 'floor') {
            return (string)($message['scope_id'] ?? '') === (string)($room['floor'] ?? '');
        }
        return false;
    }));
}
