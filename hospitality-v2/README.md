# HDB Hospitality IPTV v2

A clean-room hospitality IPTV platform built separately from the legacy project.

## Included in this milestone

- Arabic/English administration dashboard
- Rooms, guests, devices, channels, messages and hotel services management
- Check-in and check-out workflow
- TV registration and room binding
- Guest TV experience with remote-control navigation
- Service request workflow
- Publish state and audit trail
- File-locking JSON storage for simple XAMPP deployment
- Responsive 16:9 guest interface designed for Samsung, LG and browser testing

## Requirements

- PHP 8.0 or newer
- Apache/XAMPP with PHP sessions enabled
- Write access to `storage/`

## Run with XAMPP

1. Copy `hospitality-v2` into `C:\xampp\htdocs\hdbiptv\`.
2. Open `http://SERVER-IP/hdbiptv/hospitality-v2/public/admin/`.
3. Default login: `admin` / `admin123`.
4. Change the password before production use.
5. Open a guest screen with `http://SERVER-IP/hdbiptv/hospitality-v2/public/tv/?room=1201`.

## Structure

- `public/api.php` — authenticated management API and TV API
- `public/admin/` — hotel administration console
- `public/tv/` — guest TV experience
- `public/assets/` — shared design system and JavaScript
- `src/bootstrap.php` — storage, security and business helpers
- `storage/database.json` — generated automatically on first run

## Production notes

This milestone is a working operational core. PMS connectors, DRM, commercial casting, Samsung LYNK/REACH, LG Pro:Centric and certified app packaging are integration modules and are not claimed as completed in this version.
