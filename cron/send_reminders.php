<?php
// ============================================================
// cron/send_reminders.php
// Run via cron every 5 minutes:
// */5 * * * * php /path/to/medalertplus/cron/send_reminders.php
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';

date_default_timezone_set('Asia/Kolkata');
$now        = date('H:i');
$today      = date('Y-m-d');
$dayOfWeek  = strtolower(date('l'));

// Fetch all active reminders for today
$stmt = $pdo->prepare("
    SELECT mr.*, u.name as patient_name, u.email, u.phone, p.whatsapp_number
    FROM medicine_reminders mr
    JOIN patients p ON mr.patient_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE mr.is_active = 1
      AND (mr.start_date IS NULL OR mr.start_date <= ?)
      AND (mr.end_date IS NULL OR mr.end_date >= ?)
");
$stmt->execute([$today, $today]);
$reminders = $stmt->fetchAll();

$sentCount = 0;

foreach ($reminders as $reminder) {
    $times = json_decode($reminder['reminder_times'] ?? '[]', true);
    if (!is_array($times)) continue;

    foreach ($times as $reminderTime) {
        // Check if within 5-minute window
        $rTime = date('H:i', strtotime($reminderTime));
        if ($rTime !== $now) continue;

        // Check if already sent in last 10 minutes
        $check = $pdo->prepare("SELECT id FROM medicine_logs WHERE reminder_id=? AND scheduled_time BETWEEN DATE_SUB(NOW(), INTERVAL 10 MINUTE) AND NOW()");
        $check->execute([$reminder['id']]);
        if ($check->fetch()) continue;

        // Log it
        $pdo->prepare("INSERT INTO medicine_logs (reminder_id, patient_id, scheduled_time, status) VALUES (?,?,NOW(),'pending')")
            ->execute([$reminder['id'], $reminder['patient_id']]);

        // Update last_sent
        $pdo->prepare("UPDATE medicine_reminders SET last_sent=NOW() WHERE id=?")->execute([$reminder['id']]);

        // Send Email
        if ($reminder['send_email'] && $reminder['email']) {
            $sent = sendMedicineReminderEmail(
                $reminder['email'],
                $reminder['patient_name'],
                $reminder['medicine_name'],
                $reminder['dosage'],
                date('h:i A', strtotime($reminderTime))
            );
            if ($sent) {
                echo "[" . date('Y-m-d H:i:s') . "] Email sent to {$reminder['email']} for {$reminder['medicine_name']}\n";
                $sentCount++;
            }
        }

        // Send WhatsApp via Twilio
        if ($reminder['send_whatsapp'] && $reminder['whatsapp_number']) {
            $waMsg = "🔔 *Medicine Reminder — Med Alert Plus*\n\n";
            $waMsg .= "Hello {$reminder['patient_name']}! 👋\n\n";
            $waMsg .= "💊 It's time to take your medicine:\n";
            $waMsg .= "• Medicine: *{$reminder['medicine_name']}*\n";
            $waMsg .= "• Dosage: *{$reminder['dosage']}*\n";
            $waMsg .= "• Scheduled at: *" . date('h:i A', strtotime($reminderTime)) . "*\n\n";
            $waMsg .= "Please take your medicine and log in to Med Alert Plus to mark it as taken.\n\n";
            $waMsg .= "_Med Alert Plus — Smart Healthcare Alert System_";
            $sent = sendWhatsAppMessage($reminder['whatsapp_number'], $waMsg);
            if ($sent) {
                echo "[" . date('Y-m-d H:i:s') . "] WhatsApp sent to {$reminder['whatsapp_number']} for {$reminder['medicine_name']}\n";
            }
        }

        // Push notification in app
        $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) SELECT u.id, ?, ?, 'info' FROM patients p JOIN users u ON p.user_id=u.id WHERE p.id=?")
            ->execute([
                '💊 Medicine Reminder',
                "Time to take {$reminder['medicine_name']} ({$reminder['dosage']}) — scheduled at " . date('h:i A', strtotime($reminderTime)),
                $reminder['patient_id']
            ]);
    }
}

echo "[" . date('Y-m-d H:i:s') . "] Cron completed. Sent: $sentCount reminders.\n";
