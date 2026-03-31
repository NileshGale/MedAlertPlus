<?php
require_once 'config/db.php';
try {
    $pdo->exec("ALTER TABLE medicine_reminders ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT NULL AFTER send_whatsapp");
    echo "Migration Successful: Column whatsapp_number added to medicine_reminders.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists.";
    } else {
        echo "Migration Failed: " . $e->getMessage();
    }
}
?>
