<?php

/**
 * Ensures category and report_date columns exist in patient_reports table,
 * and medicine_type, color_tag, instructions columns exist in medicine_reminders table.
 * Safe for multiple runs.
 */
function ensureUploadSchemaFix(PDO $pdo): void
{
    static $ensured = false;
    if ($ensured) return;
    $ensured = true;

    // patient_reports: add category column
    try {
        $pdo->exec("ALTER TABLE patient_reports ADD COLUMN category VARCHAR(100) NULL DEFAULT 'General'");
    } catch (Throwable $e) {
        // Column probably already exists
    }

    // patient_reports: add report_date column
    try {
        $pdo->exec("ALTER TABLE patient_reports ADD COLUMN report_date DATE NULL DEFAULT NULL");
    } catch (Throwable $e) {
        // Column probably already exists
    }

    // medicine_reminders: add medicine_type column
    try {
        $pdo->exec("ALTER TABLE medicine_reminders ADD COLUMN medicine_type VARCHAR(50) NULL DEFAULT 'pill'");
    } catch (Throwable $e) {
        // Column probably already exists
    }

    // medicine_reminders: add color_tag column
    try {
        $pdo->exec("ALTER TABLE medicine_reminders ADD COLUMN color_tag VARCHAR(20) NULL DEFAULT '#3b82f6'");
    } catch (Throwable $e) {
        // Column probably already exists
    }

    // medicine_reminders: add instructions column
    try {
        $pdo->exec("ALTER TABLE medicine_reminders ADD COLUMN instructions TEXT NULL DEFAULT NULL");
    } catch (Throwable $e) {
        // Column probably already exists
    }
}
