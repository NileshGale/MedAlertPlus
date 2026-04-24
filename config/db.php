<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/utils.php';

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'medalertplus');

// API Keys
define('ANTHROPIC_API_KEY', 'sk-ant-test-key-replace-me');
define('GOOGLE_PLACES_API_KEY', 'AIza-test-key-replace-me');
/** Must match the timezone used when patients set reminder times in the browser. */
define('REMINDER_TIMEZONE', 'Asia/Kolkata');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Ensure requested admin credentials always exist.
    $adminEmail = 'gayatribhoyar18@gmail.com';
    $adminName = 'System Admin';
    $adminPasswordHash = password_hash('123456', PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, status)
                           VALUES (?, ?, ?, 'admin', 'active')
                           ON DUPLICATE KEY UPDATE
                               name = VALUES(name),
                               password = VALUES(password),
                               role = 'admin',
                               status = 'active'");
    $stmt->execute([$adminName, $adminEmail, $adminPasswordHash]);


} catch (PDOException $e) {
    if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false || strpos($_SERVER['PHP_SELF'], '/api/') !== false || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest')) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database connection failed. Please try again later.']);
        exit;
    }
    die("Database Connection Failed: " . $e->getMessage());
}
