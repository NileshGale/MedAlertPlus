<?php

require_once __DIR__ . '/reminder_common.php';

/**
 * Send due medicine reminders (email, WhatsApp, SMS, DB log, in-app notification).
 * Uses a time window so delivery still works if cron runs a few minutes late.
 *
 * @return int Number of dispatches (one per medicine time slot)
 */
function executeMedicineReminderDispatch(
    PDO $pdo,
    string $timezone,
    ?int $onlyPatientId = null,
    bool $verbose = false,
    int $windowMinutes = 12
): int {
    date_default_timezone_set($timezone);
    ensureReminderCronSchema($pdo);

    $today = date('Y-m-d');
    $sql = '
        SELECT r.*, u.email, u.name AS patient_name, u.phone,
               p.whatsapp_number AS profile_whatsapp
        FROM medicine_reminders r
        JOIN patients p ON r.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE r.is_active = 1
          AND (r.end_date IS NULL OR r.end_date >= ?)
          AND (r.start_date IS NULL OR r.start_date <= ?)
    ';
    $params = [$today, $today];
    if ($onlyPatientId !== null) {
        $sql .= ' AND r.patient_id = ?';
        $params[] = $onlyPatientId;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $reminders = $stmt->fetchAll();

    $fired = 0;

    foreach ($reminders as $rem) {
        $times = json_decode($rem['reminder_times'] ?? '[]', true);
        if (!is_array($times)) {
            continue;
        }

        foreach ($times as $timeRaw) {
            $slotHi = reminderSlotToHi((string) $timeRaw);
            if ($slotHi === '' || !reminderSlotIsDueWithinWindow((string) $timeRaw, $timezone, $windowMinutes)) {
                continue;
            }

            $check = $pdo->prepare('SELECT id FROM medicine_logs WHERE reminder_id=? AND DATE(scheduled_time)=? AND TIME_FORMAT(scheduled_time, \'%H:%i\')=?');
            $check->execute([$rem['id'], $today, $slotHi]);
            if ($check->fetch()) {
                if ($verbose) {
                    echo "Skip duplicate {$rem['medicine_name']} @ {$slotHi}\n";
                }
                continue;
            }

            $timePretty = date('h:i A', strtotime($today . ' ' . $slotHi . ':00'));
            $status = 'sent';

            if (!empty($rem['send_email']) && !empty($rem['email'])) {
                if (!sendMedicineReminder($rem['email'], $rem['patient_name'], $rem['medicine_name'], $rem['dosage'], $timePretty)) {
                    $status = 'failed';
                }
                if ($verbose) {
                    echo "Email: {$rem['medicine_name']} -> {$rem['email']}\n";
                }
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
                if ($verbose) {
                    echo "WhatsApp: {$rem['medicine_name']} -> {$waTo}\n";
                }
            }

            $phone = trim((string) ($rem['phone'] ?? ''));
            if (!empty($rem['send_sms']) && $phone !== '') {
                if (!isTwilioSmsConfigured()) {
                    if ($verbose) {
                        echo "SMS skipped (set TWILIO_SMS_FROM): {$rem['medicine_name']}\n";
                    }
                } else {
                    $plainSms = 'Med Alert: Take ' . $rem['medicine_name'] . ' (' . $rem['dosage'] . ') now. Time ' . $timePretty . '.';
                    if (!sendSmsMessage($phone, $plainSms)) {
                        $status = 'failed';
                    }
                    if ($verbose) {
                        echo "SMS: {$rem['medicine_name']} -> {$phone}\n";
                    }
                }
            }

            $fullTime = $today . ' ' . $slotHi . ':00';
            $log = $pdo->prepare('INSERT INTO medicine_logs (reminder_id, patient_id, scheduled_time, status) VALUES (?, ?, ?, ?)');
            $log->execute([$rem['id'], $rem['patient_id'], $fullTime, $status]);

            $pdo->prepare('UPDATE medicine_reminders SET last_sent = NOW() WHERE id = ?')->execute([$rem['id']]);

            $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) SELECT u.id, ?, ?, \'info\' FROM patients p JOIN users u ON p.user_id=u.id WHERE p.id=?')
                ->execute([
                    'Medicine reminder',
                    "Time to take {$rem['medicine_name']} ({$rem['dosage']}) — {$timePretty}",
                    $rem['patient_id'],
                ]);

            if ($verbose) {
                echo "Sent {$rem['medicine_name']} @ {$slotHi}\n";
            }
            $fired++;
        }
    }

    if ($verbose && $fired === 0) {
        if (count($reminders) === 0) {
            echo "Note: No active reminders for {$today} (inactive or start/end dates exclude today).\n";
        } else {
            echo "Note: No reminder slot in the {$windowMinutes}-minute window now. Keep the patient dashboard open (auto-check) or run scheduler.bat every minute.\n";
        }
    }

    return $fired;
}
