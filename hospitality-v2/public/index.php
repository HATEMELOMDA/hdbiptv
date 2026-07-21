<?php
declare(strict_types=1);

$target = isset($_GET['tv']) ? 'tv/' : 'admin/';
header('Location: ' . $target, true, 302);
exit;
