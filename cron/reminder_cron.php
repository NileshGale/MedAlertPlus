/**
 * Med-Alert-Plus Reminder Cron — run every minute (see scheduler.bat on Windows).
 * Sends: email (PHPMailer) and in-app notifications. (Twilio removed).
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/medicine_reminder_runner.php';

$tz = defined('REMINDER_TIMEZONE') ? REMINDER_TIMEZONE : 'Asia/Kolkata';

echo 'Reminder cron ' . date('Y-m-d H:i:s') . " ({$tz}) window=12m\n";

try {
    $fired = executeMedicineReminderDispatch($pdo, $tz, null, true, 12);
    if ($fired > 0) {
        echo "Dispatched {$fired} reminder slot(s).\n";
    }
} catch (Throwable $e) {
    echo 'Cron error: ' . $e->getMessage() . "\n";
}

echo "Done.\n";
