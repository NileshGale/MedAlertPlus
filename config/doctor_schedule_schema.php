<?php

/**
 * Ensures the doctor_schedules table exists and regularizes doctor schema.
 * Safe for multiple runs.
 */
function ensureDoctorScheduleSchema(PDO $pdo): void
{
    static $ensured = false;
    if ($ensured) return;
    $ensured = true;

    // 1. Create doctor_schedules table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `doctor_schedules` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `doctor_id` int(11) NOT NULL,
        `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
        `is_available` tinyint(1) DEFAULT 1,
        `start_time` time DEFAULT '09:00:00',
        `end_time` time DEFAULT '17:00:00',
        `slot_duration` int(3) DEFAULT 30,
        PRIMARY KEY (`id`),
        KEY `doctor_id` (`doctor_id`),
        CONSTRAINT `doctor_schedules_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // 2. Add clinic_status_updated_at to doctors table for smart status logic
    try {
        $pdo->exec("ALTER TABLE doctors ADD COLUMN clinic_status_updated_at TIMESTAMP NULL DEFAULT NULL AFTER clinic_status");
    } catch (Throwable $e) {
        // Column probably already exists
    }
}
