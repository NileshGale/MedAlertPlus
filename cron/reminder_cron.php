<?php
/**
 * Med-Alert-Plus Reminder Cron
 * This script should be set to run every minute (e.g., via a standard cron job).
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';

// Set timezone to match your database/user preference
date_default_timezone_set('UTC'); // Adjust if necessary

$currentTime = date('H:i'); // 24-hour format e.g. "14:30"
$today       = date('Y-m-d');

echo "Running Reminder Cron at: " . date('Y-m-d H:i:s') . "\n";

try {
    // Fetch active reminders
    $stmt = $pdo->prepare("
        SELECT r.*, u.email, u.name as patient_name, u.phone
        FROM medicine_reminders r
        JOIN patients p ON r.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE r.is_active = 1 
        AND (r.end_date IS NULL OR r.end_date >= ?)
        AND (r.start_date IS NULL OR r.start_date <= ?)
    ");
    $stmt->execute([$today, $today]);
    $reminders = $stmt->fetchAll();

    foreach ($reminders as $rem) {
        $times = json_decode($rem['reminder_times'], true);
        if (!is_array($times)) continue;

        foreach ($times as $time) {
            // Check if reminder time matches current minute
            if ($time === $currentTime) {
                echo "Match found: {$rem['medicine_name']} for {$rem['patient_name']} at {$time}\n";

                // 1. Check if already sent today in this minute (prevent duplicates)
                $check = $pdo->prepare("SELECT id FROM medicine_logs WHERE reminder_id=? AND DATE(scheduled_time)=? AND TIME_FORMAT(scheduled_time, '%H:%i')=?");
                $check->execute([$rem['id'], $today, $time]);
                if ($check->fetch()) {
                    echo "Already sent. Skipping.\n";
                    continue;
                }

                $status = 'sent';

                // 2. Send Email
                if ($rem['send_email']) {
                    if (!sendMedicineReminder($rem['email'], $rem['patient_name'], $rem['medicine_name'], $rem['dosage'])) {
                        $status = 'failed';
                    }
                }

                // 3. Send WhatsApp (Twilio)
                if ($rem['send_whatsapp']) {
                    require_once __DIR__ . '/../api/twilio_helper.php';
                    if (!sendWhatsAppReminder($rem['phone'], $rem['medicine_name'], $rem['dosage'])) {
                        $status = 'failed';
                    }
                    echo "WhatsApp integration triggered for {$rem['phone']}\n";
                }

                // 4. Log the event
                $log = $pdo->prepare("INSERT INTO medicine_logs (reminder_id, patient_id, scheduled_time, status) VALUES (?, ?, ?, ?)");
                $fullTime = $today . ' ' . $time . ':00';
                $log->execute([$rem['id'], $rem['patient_id'], $fullTime, $status]);
                
                // Update last sent
                $pdo->prepare("UPDATE medicine_reminders SET last_sent = NOW() WHERE id = ?")->execute([$rem['id']]);
            }
        }
    }

} catch (Exception $e) {
    echo "Error in Cron: " . $e->getMessage() . "\n";
}

echo "Cron processing finished.\n";
