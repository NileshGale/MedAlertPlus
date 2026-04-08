<?php
session_start();
require_once '../config/db.php';
require_once '../config/mail.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$action = $_POST['action'] ?? '';

if ($action === 'trigger_sos') {
    $userId = $_SESSION['user_id'];
    $lat = $_POST['lat'] ?? null;
    $lng = $_POST['lng'] ?? null;

    // Get user/patient info
    $stmt = $pdo->prepare("SELECT u.name, u.email, p.id as patient_id, p.emergency_contact_email 
                           FROM users u 
                           LEFT JOIN patients p ON u.id = p.user_id 
                           WHERE u.id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    // Log the SOS alert
    $patientId = $user['patient_id'];
    if ($patientId) {
        $ins = $pdo->prepare("INSERT INTO sos_alerts (patient_id, latitude, longitude) VALUES (?, ?, ?)");
        $ins->execute([$patientId, $lat, $lng]);
    }

    // Send emails
    $sentCount = 0;

    // 1. Alert Emergency Contact (Fallback to a default if not set for testing)
    $emergencyEmail = $user['emergency_contact_email'] ?? 'gayatribhoyar18@gmail.com'; 
    if (sendSOSAlert($emergencyEmail, $user['name'], $lat, $lng)) {
        $sentCount++;
    }

    // 2. Alert Admin
    if (sendSOSAlert('admin@medalert.com', $user['name'] . " (EMERGENCY)", $lat, $lng)) {
        $sentCount++;
    }

    // 3. Alert all active Doctors via in-app Notifications
    $stmtDocs = $pdo->query("SELECT u.id, u.phone FROM users u JOIN doctors d ON u.id = d.user_id WHERE u.role = 'doctor' AND u.status = 'active' AND d.approval_status = 'approved'");
    $doctors = $stmtDocs->fetchAll();
    
    $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'danger')");
    $message = "URGENT SOS! " . $user['name'] . " requires immediate medical assistance.";
    if ($lat && $lng) {
        $message .= " Location: https://maps.google.com/?q=" . urlencode("$lat,$lng");
    }
    
    foreach ($doctors as $doc) {
        $notifStmt->execute([$doc['id'], 'EMERGENCY SOS ALERT', $message]);
        
        // 4. SMS / WhatsApp Scaffolding (Future-Proofing)
        // Ensure you configure API credentials in config/mail.php before uncommenting
        $phone = trim((string)$doc['phone']);
        if (!empty($phone)) {
            // sendTwilioSMS($phone, $message);
            // sendWhatsAppMessage($phone, $message);
        }
    }

    echo json_encode(['success' => true, 'message' => "SOS Triggered. $sentCount alerts sent."]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
