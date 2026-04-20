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
    $hex = bin2hex(substr($content, 0, 10));
    echo "File: $file\n";
    echo "  Hex start: $hex\n";
    if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
        echo "  WARNING: UTF-8 BOM DETECTED!\n";
    }
    if (preg_match('/^\s/', $content)) {
        echo "  WARNING: LEADING WHITESPACE DETECTED!\n";
    }
    if (strpos($content, '?>') !== false && !preg_match('/\?>\s*$/', $content)) {
        // Not a big deal usually, but can be noise
    }
}
