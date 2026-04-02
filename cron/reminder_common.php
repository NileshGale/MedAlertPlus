<?php

declare(strict_types=1);

function ensureReminderCronSchema(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    try {
        $pdo->exec('ALTER TABLE medicine_reminders ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT NULL AFTER send_whatsapp');
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec('ALTER TABLE medicine_reminders ADD COLUMN send_sms tinyint(1) NOT NULL DEFAULT 0');
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec('ALTER TABLE medicine_reminders ADD COLUMN email_daily_time TIME NULL DEFAULT NULL');
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec('ALTER TABLE medicine_reminders ADD COLUMN last_email_digest_date DATE NULL DEFAULT NULL');
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec('ALTER TABLE medicine_reminders ADD COLUMN reminder_email VARCHAR(255) DEFAULT NULL');
    } catch (Throwable $e) {
    }
}

/** HH:MM or HH:MM:SS → HH:MM:SS for MySQL TIME, or null. */
function normalizeEmailDailyTimeForDb(string $raw): ?string
{
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }
    if (preg_match('/^(\d{1,2}):(\d{2})$/', $raw, $m)) {
        return sprintf('%02d:%02d:00', (int) $m[1], (int) $m[2]);
    }
    if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $raw, $m)) {
        return sprintf('%02d:%02d:%02d', (int) $m[1], (int) $m[2], (int) $m[3]);
    }
    $ts = strtotime($raw);

    return $ts ? date('H:i:s', $ts) : null;
}

function reminderSlotToHi(string $raw): string
{
    $raw = trim($raw);
    if ($raw === '') {
        return '';
    }
    if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $raw, $m)) {
        return sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
    }
    $ts = strtotime($raw);

    return $ts ? date('H:i', $ts) : '';
}

/**
 * True if local clock is within [slot start, slot start + window) — catches cron that misses the exact minute.
 */
function reminderSlotIsDueWithinWindow(string $raw, string $timezone, int $windowMinutes = 6): bool
{
    $slotHi = reminderSlotToHi($raw);
    if ($slotHi === '') {
        return false;
    }
    try {
        $tzObj = new DateTimeZone($timezone);
    } catch (Exception $e) {
        return false;
    }
    $now = new DateTimeImmutable('now', $tzObj);
    $today = $now->format('Y-m-d');
    $slotStart = DateTimeImmutable::createFromFormat('Y-m-d H:i', $today . ' ' . $slotHi, $tzObj);
    if ($slotStart === false) {
        return false;
    }
    $windowEnd = $slotStart->modify('+' . max(1, $windowMinutes) . ' minutes');

    return $now >= $slotStart && $now < $windowEnd;
}

function resolveReminderWhatsapp(array $rem): string
{
    $w = trim((string) ($rem['whatsapp_number'] ?? ''));
    if ($w !== '') {
        return $w;
    }

    return trim((string) ($rem['profile_whatsapp'] ?? ''));
}
