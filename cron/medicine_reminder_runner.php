<?php

require_once __DIR__ . '/reminder_common.php';
require_once __DIR__ . '/../config/mail.php';
/**
 * Send due medicine reminders (daily digest email at set time, DB log, in-app).
 * Email with email_daily_time sends once per day only when local time is within the window (not before).
 *
 * @return int Number of dispatches (digest emails + per-slot channels)
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
        SELECT r.*, u.email AS default_email, u.name AS patient_name, u.phone, r.instructions, r.color_tag
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

        $emailDailyRaw = isset($rem['email_daily_time']) && $rem['email_daily_time'] !== null && $rem['email_daily_time'] !== ''
            ? (string) $rem['email_daily_time']
            : null;

        $targetEmail   = !empty($rem['reminder_email']) ? (string)$rem['reminder_email'] : (string)($rem['default_email'] ?? '');

        if (!empty($rem['send_email']) && $targetEmail !== '' && $emailDailyRaw !== null) {
            if (reminderSlotIsDueWithinWindow($emailDailyRaw, $timezone, $windowMinutes)) {
                $lastDigest = $rem['last_email_digest_date'] ?? null;
                if ($lastDigest !== $today) {
                    $lines = [];
                    foreach ($times as $tr) {
                        $hi = reminderSlotToHi((string) $tr);
                        if ($hi === '') {
                            continue;
                        }
                        $lines[] = date('h:i A', strtotime($today . ' ' . $hi . ':00'));
                    }
                    $timesHtml = '';
                    if ($lines !== []) {
                        $timesHtml = '<p style="margin: 8px 0; font-size: 16px;"><strong>you have to take medicine at:</strong> '
                            . implode(', ', array_map(static function ($l) {
                                return htmlspecialchars($l, ENT_QUOTES, 'UTF-8');
                            }, $lines))
                            . '</p>';
                    }

                    if (sendMedicineDailyDigestEmail(
                        $targetEmail,
                        $rem['patient_name'],
                        $rem['medicine_name'],
                        $rem['dosage'],
                        '', // frequencyLabel removed as requested
                        $timesHtml,
                        $rem['instructions'] ?? null,
                        $rem['color_tag'] ?? null
                    )) {
                        $pdo->prepare('UPDATE medicine_reminders SET last_email_digest_date = ? WHERE id = ?')->execute([$today, $rem['id']]);
                        if ($verbose) {
                            echo "Daily email summary: {$rem['medicine_name']}\n";
                        }
                        $fired++;
                    }
                }
            }
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

            $usePerSlotEmail = !empty($rem['send_email']) && $targetEmail !== '' && $emailDailyRaw === null;
            if ($usePerSlotEmail) {
                if (!sendMedicineReminder($targetEmail, $rem['patient_name'], $rem['medicine_name'], $rem['dosage'], $timePretty, $rem['instructions'] ?? null, $rem['color_tag'] ?? null)) {
                    $status = 'failed';
                }
                if ($verbose) {
                    echo "Email (per-slot): {$rem['medicine_name']} -> {$rem['email']}\n";
                }
            }

            // Per-slot dispatch finished for this channel.

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
