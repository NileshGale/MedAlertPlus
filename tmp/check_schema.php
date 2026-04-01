<?php
require_once __DIR__ . '/../config/db.php';
try {
    echo "--- PATIENTS TABLE ---\n";
    $stmt = $pdo->query("DESCRIBE patients");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    echo "\n--- USERS TABLE ---\n";
    $stmt = $pdo->query("DESCRIBE users");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
