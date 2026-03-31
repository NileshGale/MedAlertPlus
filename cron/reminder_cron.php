<?php
/**
 * Med-Alert-Plus Reminder Cron — run every minute (see scheduler.bat on Windows).
 * Sends: email (PHPMailer), WhatsApp (Twilio), optional SMS to profile phone (Twilio).
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../api/twilio_helper.php';
require_once __DIR__ . '/reminder_common.php';

$tz = defined('REMINDER_TIMEZONE') ? REMINDER_TIMEZONE : 'Asia/Kolkata';
date_default_timezone_set($tz);

ensureReminderCronSchema($pdo);

$currentTime = date('H:i');
$today       = date('Y-m-d');

echo "Reminder cron " . date('Y-m-d H:i:s') . " ({$tz}) now={$currentTime}\n";

$firedThisMinute = 0;

try {
    $stmt = $pdo->prepare('
        SELECT r.*, u.email, u.name AS patient_name, u.phone,
               p.whatsapp_number AS profile_whatsapp
        FROM medicine_reminders r
        JOIN patients p ON r.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE r.is_active = 1
          AND (r.end_date IS NULL OR r.end_date >= ?)
          AND (r.start_date IS NULL OR r.start_date <= ?)
    ');
    $stmt->execute([$today, $today]);
    $reminders = $stmt->fetchAll();

    foreach ($reminders as $rem) {
        $times = json_decode($rem['reminder_times'] ?? '[]', true);
        if (!is_array($times)) {
            continue;
        }

        foreach ($times as $timeRaw) {
            $slotHi = reminderSlotToHi((string) $timeRaw);
            if ($slotHi === '' || $slotHi !== $currentTime) {
                continue;
            }

            $check = $pdo->prepare('SELECT id FROM medicine_logs WHERE reminder_id=? AND DATE(scheduled_time)=? AND TIME_FORMAT(scheduled_time, \'%H:%i\')=?');
            $check->execute([$rem['id'], $today, $slotHi]);
            if ($check->fetch()) {
                echo "Skip duplicate {$rem['medicine_name']} @ {$slotHi}\n";
                continue;
            }

            $timePretty = date('h:i A', strtotime($today . ' ' . $slotHi . ':00'));
            $status     = 'sent';

            if (!empty($rem['send_email']) && !empty($rem['email'])) {
                if (!sendMedicineReminder($rem['email'], $rem['patient_name'], $rem['medicine_name'], $rem['dosage'], $timePretty)) {
                    $status = 'failed';
                }
                echo "Email: {$rem['medicine_name']} -> {$rem['email']}\n";
            }

            $waTo = resolveReminderWhatsapp($rem);
            if (!empty($rem['send_whatsapp']) && $waTo !== '') {
                $plainWa = "Med Alert Plus — medicine reminder.\n\n"
                    . "Hi {$rem['patient_name']},\n"
                    . "Take: {$rem['medicine_name']} ({$rem['dosage']}).\n"
                    . "Time: {$timePretty}\n\n"
                    . 'Log in to the app to mark as taken.';
                if (!sendWhatsAppMessage($waTo, $plainWa)) {
                    $status = 'failed';
                }
                echo "WhatsApp: {$rem['medicine_name']} -> {$waTo}\n";
            }

            $phone = trim((string) ($rem['phone'] ?? ''));
            if (!empty($rem['send_sms']) && $phone !== '') {
                if (!isTwilioSmsConfigured()) {
                    echo "SMS skipped (set TWILIO_SMS_FROM in config/db.php): {$rem['medicine_name']}\n";
                } else {
                    $plainSms = 'Med Alert: Take ' . $rem['medicine_name'] . ' (' . $rem['dosage'] . ') now. Time ' . $timePretty . '.';
                    if (!sendSmsMessage($phone, $plainSms)) {
                        $status = 'failed';
                    }
                    echo "SMS: {$rem['medicine_name']} -> {$phone}\n";
                }
            }

            $fullTime = $today . ' ' . $slotHi . ':00';
            $log      = $pdo->prepare('INSERT INTO medicine_logs (reminder_id, patient_id, scheduled_time, status) VALUES (?, ?, ?, ?)');
            $log->execute([$rem['id'], $rem['patient_id'], $fullTime, $status]);

            $pdo->prepare('UPDATE medicine_reminders SET last_sent = NOW() WHERE id = ?')->execute([$rem['id']]);

            $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) SELECT u.id, ?, ?, \'info\' FROM patients p JOIN users u ON p.user_id=u.id WHERE p.id=?')
                ->execute([
                    'Medicine reminder',
                    "Time to take {$rem['medicine_name']} ({$rem['dosage']}) — {$timePretty}",
                    $rem['patient_id'],
                ]);

            echo "Sent {$rem['medicine_name']} @ {$slotHi}\n";
            $firedThisMinute++;
        }
    }

    if ($firedThisMinute === 0) {
        if (count($reminders) === 0) {
            echo "Note: No active reminders for {$today} (inactive, or start/end dates exclude today).\n";
        } else {
            echo "Note: Nothing due at {$currentTime}. Alerts only fire in the exact minute you set (e.g. 21:50, not 22:00).\n";
        }
    }
} catch (Exception $e) {
    echo 'Cron error: ' . $e->getMessage() . "\n";
}

echo "Done.\n";
