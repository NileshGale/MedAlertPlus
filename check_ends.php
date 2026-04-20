<?php
$files = [
    'api/doctor_api.php',
    'config/db.php',
    'config/mail.php',
    'config/appointment_reschedule_schema.php',
    'config/profile_image_schema.php',
    'config/upload_schema_fix.php',
    'config/doctor_schedule_schema.php'
];

foreach ($files as $file) {
    if (!file_exists($file)) continue;
    $content = file_get_contents($file);
    if (strpos($content, '?>') !== false) {
        $after = substr($content, strpos($content, '?>') + 2);
        if (trim($after) !== '') {
            echo "File: $file has CONTENT after ?>: [" . bin2hex($after) . "]\n";
        } elseif (strlen($after) > 0) {
            echo "File: $file has WHITESPACE after ?>: [" . bin2hex($after) . "]\n";
        }
    }
}
