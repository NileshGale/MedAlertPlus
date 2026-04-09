<?php
require_once __DIR__ . '/config/db.php';
try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . "\n";
    foreach ($tables as $table) {
        echo "\nTable: $table\n";
        $columns = $pdo->query("DESCRIBE $table")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo "  {$col['Field']} - {$col['Type']}\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
