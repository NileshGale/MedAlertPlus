<?php

/**
 * Ensures columns for doctor-proposed reschedules and actionable notifications exist.
 * Uses additive ALTERs; safe for existing databases.
 */
function ensureAppointmentRescheduleSchema(PDO $pdo): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }
    $ensured = true;
    try {
        $pdo->exec('ALTER TABLE appointments ADD COLUMN proposed_appointment_date DATE NULL DEFAULT NULL');
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec('ALTER TABLE appointments ADD COLUMN proposed_appointment_time TIME NULL DEFAULT NULL');
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec('ALTER TABLE notifications ADD COLUMN appointment_id INT NULL DEFAULT NULL');
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec('ALTER TABLE notifications ADD COLUMN cta VARCHAR(32) NULL DEFAULT NULL');
    } catch (Throwable $e) {
    }
}

/**
 * Normalize a time string from HTML time input or DB to HH:MM:SS for MySQL TIME.
 */
function normalizeAppointmentTimeForDb(string $time): ?string
{
    $time = trim($time);
    if ($time === '') {
        return null;
    }
    if (preg_match('/^(\d{1,2}):(\d{2})$/', $time, $m)) {
        return sprintf('%02d:%02d:00', (int) $m[1], (int) $m[2]);
    }
    if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $time, $m)) {
        return sprintf('%02d:%02d:%02d', (int) $m[1], (int) $m[2], (int) $m[3]);
    }

    return null;
}
