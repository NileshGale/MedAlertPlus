<?php
session_start();
require_once '../config/db.php';

if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? $_SESSION['role']) !== 'admin') {
    die('Unauthorized');
}

$type = $_GET['type'] ?? '';

if ($type === 'sos') {
    $stmt = $pdo->query("SELECT s.id, u.name, s.latitude, s.longitude, s.status, s.created_at 
                         FROM sos_alerts s 
                         JOIN patients p ON s.patient_id = p.id 
                         JOIN users u ON p.user_id = u.id 
                         ORDER BY s.created_at DESC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $filename = "sos_alerts_report_" . date('Ymd') . ".csv";
} elseif ($type === 'appointments') {
    $stmt = $pdo->query("SELECT a.id, u1.name as patient, u2.name as doctor, a.type, a.appointment_date, a.status 
                         FROM appointments a 
                         JOIN patients p ON a.patient_id = p.id 
                         JOIN users u1 ON p.user_id = u1.id 
                         JOIN doctors d ON a.doctor_id = d.id 
                         JOIN users u2 ON d.user_id = u2.id 
                         ORDER BY a.appointment_date DESC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $filename = "appointments_report_" . date('Ymd') . ".csv";
} else {
    die('Invalid export type');
}

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="' . $filename . '"');

$output = fopen('php://output', 'w');
if (!empty($data)) {
    fputcsv($output, array_keys($data[0]));
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
}
fclose($output);
exit;
