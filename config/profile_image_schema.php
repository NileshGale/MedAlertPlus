<?php

/**
 * Ensures profile_image columns exist in patients and doctors tables.
 * Safe for multiple runs.
 */
function ensureProfileImageSchema(PDO $pdo): void
{
    static $ensured = false;
    if ($ensured) return;
    $ensured = true;

    try {
        $pdo->exec("ALTER TABLE patients ADD COLUMN profile_image VARCHAR(255) NULL DEFAULT NULL");
    } catch (Throwable $e) {
        // Column probably already exists or table doesn't exist
    }

    try {
        $pdo->exec("ALTER TABLE doctors ADD COLUMN profile_image VARCHAR(255) NULL DEFAULT NULL");
    } catch (Throwable $e) {
        // Column probably already exists
    }
}
