<?php
require_once __DIR__ . '/../config/db.php';
try {
    $pdo->exec("ALTER TABLE patients ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL");
    echo "Column 'profile_image' added successfully or already exists.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column 'profile_image' already exists.\n";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
