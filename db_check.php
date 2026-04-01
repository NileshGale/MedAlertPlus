<?php
require_once 'config/db.php';
$stmt = $pdo->prepare('SELECT p.*, u.name, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE u.email = ?');
$stmt->execute(['nileshgale520@gmail.com']);
$res = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($res, JSON_PRETTY_PRINT);
unlink(__FILE__);
