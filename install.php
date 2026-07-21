<?php
declare(strict_types=1);

$checks = [];
$checks[] = ['PHP 8.0+', version_compare(PHP_VERSION, '8.0.0', '>='), PHP_VERSION];
$checks[] = ['JSON extension', extension_loaded('json'), extension_loaded('json') ? 'Enabled' : 'Missing'];
$checks[] = ['OpenSSL extension', extension_loaded('openssl'), extension_loaded('openssl') ? 'Enabled' : 'Missing'];
$checks[] = ['Global Core state readable', is_readable(__DIR__ . '/api/v2/data/state.json'), __DIR__ . '/api/v2/data/state.json'];
$checks[] = ['Global Core data writable', is_writable(__DIR__ . '/api/v2/data'), __DIR__ . '/api/v2/data'];
$checks[] = ['Control Center available', is_file(__DIR__ . '/control/index.html'), 'control/index.html'];
$checks[] = ['Guest application available', is_file(__DIR__ . '/index.html') && is_file(__DIR__ . '/menu.html'), 'index.html / menu.html'];
$ready = !in_array(false, array_column($checks, 1), true);
?><!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HDB Global Setup</title>
<style>body{margin:0;background:#07101d;color:#f5f7fb;font-family:Segoe UI,Tahoma,Arial,sans-serif}.wrap{max-width:900px;margin:60px auto;padding:0 24px}.head{background:linear-gradient(135deg,#142b45,#0b1a2b);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:30px}.head small{color:#d9b66f}.head h1{margin:8px 0}.head p{color:#9aacc0}.result{margin-top:18px;padding:14px 18px;border-radius:14px;background:<?= $ready ? 'rgba(80,212,157,.12)' : 'rgba(255,112,120,.12)' ?>;border:1px solid <?= $ready ? 'rgba(80,212,157,.28)' : 'rgba(255,112,120,.28)' ?>}.checks{margin-top:18px;display:grid;gap:10px}.check{display:grid;grid-template-columns:26px 1fr auto;gap:12px;align-items:center;padding:15px 17px;border:1px solid rgba(255,255,255,.085);border-radius:14px;background:#101e30}.check i{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;font-style:normal;background:rgba(255,255,255,.05)}.check.ok i{color:#70dfb0}.check.bad i{color:#ff8d95}.check small{color:#8fa1b7}.actions{display:flex;gap:10px;margin-top:20px}.actions a{padding:12px 18px;border-radius:11px;text-decoration:none;font-weight:700;background:#d9b66f;color:#17202a}.actions a.alt{background:#162b43;color:#fff;border:1px solid rgba(255,255,255,.1)}</style></head>
<body><main class="wrap"><section class="head"><small>HDB GLOBAL HOSPITALITY V2</small><h1>فحص جاهزية التثبيت</h1><p>هذه الصفحة تفحص متطلبات التشغيل الأساسية قبل ربط المنصة بأجهزة الفندق والأنظمة الخارجية.</p><div class="result"><?= $ready ? 'الخادم جاهز لتشغيل النسخة التجريبية. غيّر Token الافتراضي قبل الإنتاج.' : 'توجد متطلبات تحتاج معالجة قبل التشغيل.' ?></div></section><section class="checks"><?php foreach ($checks as $check): ?><article class="check <?= $check[1] ? 'ok' : 'bad' ?>"><i><?= $check[1] ? '✓' : '!' ?></i><strong><?= htmlspecialchars($check[0], ENT_QUOTES, 'UTF-8') ?></strong><small><?= htmlspecialchars((string)$check[2], ENT_QUOTES, 'UTF-8') ?></small></article><?php endforeach; ?></section><div class="actions"><a href="control/">فتح مركز التشغيل</a><a class="alt" href="./">فتح واجهة النزيل</a><a class="alt" href="api/v2/index.php?resource=ping">فحص API</a></div></main></body></html>
