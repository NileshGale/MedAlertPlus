<?php
// Run every 5 minutes if you do not use the per-minute reminder_cron.php:
// */5 * * * * php /path/to/cron/send_reminders.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/../api/twilio_helper.php';
require_once __DIR__ . '/reminder_common.php';

$tz = defined('REMINDER_TIMEZONE') ? REMINDER_TIMEZONE : 'Asia/Kolkata';
date_default_timezone_set($tz);

ensureReminderCronSchema($pdo);

$now   = date('H:i');
$today = date('Y-m-d');

$stmt = $pdo->prepare('
    SELECT r.*, u.name AS patient_name, u.email, u.phone,
           p.whatsapp_number AS profile_whatsapp
    FROM medicine_reminders r
    JOIN patients p ON r.patient_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE r.is_active = 1
      AND (r.start_date IS NULL OR r.start_date <= ?)
      AND (r.end_date IS NULL OR r.end_date >= ?)
');
$stmt->execute([$today, $today]);
$reminders = $stmt->fetchAll();

$sentCount = 0;

foreach ($reminders as $reminder) {
    $times = json_decode($reminder['reminder_times'] ?? '[]', true);
    if (!is_array($times)) {
        continue;
    }

    foreach ($times as $reminderTime) {
        $slotHi = reminderSlotToHi((string) $reminderTime);
        if ($slotHi === '' || $slotHi !== $now) {
            continue;
        }

        $check = $pdo->prepare('SELECT id FROM medicine_logs WHERE reminder_id=? AND scheduled_time BETWEEN DATE_SUB(NOW(), INTERVAL 10 MINUTE) AND NOW()');
        $check->execute([$reminder['id']]);
        if ($check->fetch()) {
            continue;
        }

        $timePretty = date('h:i A', strtotime($today . ' ' . $slotHi . ':00'));
        $status     = 'sent';

        $insLog = $pdo->prepare("INSERT INTO medicine_logs (reminder_id, patient_id, scheduled_time, status) VALUES (?,?,NOW(),'pending')");
        $insLog->execute([$reminder['id'], $reminder['patient_id']]);
        $logId = (int) $pdo->lastInsertId();

        if (!empty($reminder['send_email']) && !empty($reminder['email'])) {
            if (sendMedicineReminder(
                $reminder['email'],
                $reminder['patient_name'],
                $reminder['medicine_name'],
                $reminder['dosage'],
                $timePretty
            )) {
                echo '[' . date('Y-m-d H:i:s') . "] Email -> {$reminder['email']} ({$reminder['medicine_name']})\n";
                $sentCount++;
            } else {
                $status = 'failed';
            }
        }

        $waTo = resolveReminderWhatsapp($reminder);
        if (!empty($reminder['send_whatsapp']) && $waTo !== '') {
            $plainWa = "Med Alert Plus — medicine reminder.\n\n"
                . "Hi {$reminder['patient_name']},\n"
                . "Take: {$reminder['medicine_name']} ({$reminder['dosage']}).\n"
                . "Time: {$timePretty}\n\n"
                . 'Log in to the app to mark as taken.';
            if (sendWhatsAppMessage($waTo, $plainWa)) {
                echo '[' . date('Y-m-d H:i:s') . "] WhatsApp -> {$waTo}\n";
                $sentCount++;
            } else {
                $status = 'failed';
            }
        }

        $phone = trim((string) ($reminder['phone'] ?? ''));
        if (!empty($reminder['send_sms']) && $phone !== '' && isTwilioSmsConfigured()) {
            $plainSms = 'Med Alert: Take ' . $reminder['medicine_name'] . ' (' . $reminder['dosage'] . ') now. Time ' . $timePretty . '.';
            if (sendSmsMessage($phone, $plainSms)) {
                echo '[' . date('Y-m-d H:i:s') . "] SMS -> {$phone}\n";
                $sentCount++;
            } else {
                $status = 'failed';
            }
        }

        $pdo->prepare('UPDATE medicine_reminders SET last_sent=NOW() WHERE id=?')->execute([$reminder['id']]);
        if ($logId > 0) {
            $pdo->prepare('UPDATE medicine_logs SET status=? WHERE id=?')->execute([$status, $logId]);
        }

        $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) SELECT u.id, ?, ?, \'info\' FROM patients p JOIN users u ON p.user_id=u.id WHERE p.id=?')
            ->execute([
                'Medicine reminder',
                "Time to take {$reminder['medicine_name']} ({$reminder['dosage']}) — {$timePretty}",
                $reminder['patient_id'],
            ]);
    }
}

echo '[' . date('Y-m-d H:i:s') . "] Cron done. Notifications sent (counted channels): {$sentCount}\n";
