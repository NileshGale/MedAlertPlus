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
}

function reminderSlotToHi(string $raw): string
{
    $raw = trim($raw);
    if ($raw === '') {
        return '';
    }
    if (preg_match('/^(\d{1,2}):(\d{2})$/', $raw, $m)) {
        return sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
    }
    $ts = strtotime($raw);

    return $ts ? date('H:i', $ts) : '';
}

function resolveReminderWhatsapp(array $rem): string
{
    $w = trim((string) ($rem['whatsapp_number'] ?? ''));
    if ($w !== '') {
        return $w;
    }

    return trim((string) ($rem['profile_whatsapp'] ?? ''));
}
