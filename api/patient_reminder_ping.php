<?php
/**
 * While the patient dashboard is open, the browser calls this periodically so reminders
 * still send without relying only on Windows Task Scheduler / cron.
 */
session_start();
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../api/twilio_helper.php';
require_once __DIR__ . '/../cron/medicine_reminder_runner.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'patient' || empty($_SESSION['profile_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$tz = defined('REMINDER_TIMEZONE') ? REMINDER_TIMEZONE : 'Asia/Kolkata';

try {
    $dispatched = executeMedicineReminderDispatch($pdo, $tz, (int) $_SESSION['profile_id'], false, 15);
    echo json_encode(['success' => true, 'dispatched' => $dispatched]);
} catch (Throwable $e) {
    error_log('patient_reminder_ping: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Reminder check failed']);
}
