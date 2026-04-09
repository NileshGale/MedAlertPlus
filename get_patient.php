<?php
require_once __DIR__ . '/config/db.php';
$user = $pdo->query("SELECT email, role FROM users WHERE role='patient' LIMIT 1")->fetch();
echo json_encode($user);
