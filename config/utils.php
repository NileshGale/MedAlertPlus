<?php
/**
 * Global utility functions for Med-Alert-Plus.
 */

/**
 * Ensures the notifications table has columns for appointment rescheduling.
 */
function ensureAppointmentRescheduleSchema($pdo) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM notifications");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!in_array('appointment_id', $columns)) {
            $pdo->exec("ALTER TABLE notifications ADD COLUMN appointment_id INT DEFAULT NULL");
        }
        if (!in_array('cta', $columns)) {
            $pdo->exec("ALTER TABLE notifications ADD COLUMN cta VARCHAR(50) DEFAULT NULL");
        }
    } catch (Exception $e) {
        // Silent fail or log
    }
}

/**
 * Normalizes time strings for MySQL TIME columns.
 */
function normalizeAppointmentTimeForDb($raw) {
    $raw = trim($raw);
    if ($raw === '') return null;
    if (preg_match('/^(\d{1,2}):(\d{2})$/', $raw, $m)) {
        return sprintf('%02d:%02d:00', (int) $m[1], (int) $m[2]);
    }
    if (preg_match('/^(\d{1,2}):(\d{2}):(\d{2})$/', $raw, $m)) {
        return sprintf('%02d:%02d:%02d', (int) $m[1], (int) $m[2], (int) $m[3]);
    }
    $ts = strtotime($raw);
    return $ts ? date('H:i:s', $ts) : $raw;
}
