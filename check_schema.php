<?php
require_once 'config/db.php';
try {
    $stmt = $pdo->query("DESCRIBE medicine_reminders");
    $fields = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($fields, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
