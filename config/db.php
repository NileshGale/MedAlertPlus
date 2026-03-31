<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'medalertplus');

// API Keys
define('ANTHROPIC_API_KEY', 'sk-ant-test-key-replace-me');
define('GOOGLE_PLACES_API_KEY', 'AIza-test-key-replace-me');
define('TWILIO_SID', 'AC-test-sid-replace-me');
define('TWILIO_TOKEN', 'test-token-replace-me');
define('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}
?>
