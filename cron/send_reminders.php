<?php
// Run every 5 minutes if you do not use reminder_cron.php every minute:
// */5 * * * * php /path/to/cron/send_reminders.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/medicine_reminder_runner.php';

$tz = defined('REMINDER_TIMEZONE') ? REMINDER_TIMEZONE : 'Asia/Kolkata';

$fired = executeMedicineReminderDispatch($pdo, $tz, null, true, 15);
echo '[' . date('Y-m-d H:i:s') . "] send_reminders.php done. Dispatched {$fired} slot(s).\n";
