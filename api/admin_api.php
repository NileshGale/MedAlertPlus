<?php
session_start();
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit;
}
$action = $_POST['action'] ?? '';

switch ($action) {
    case 'approve_doctor':      approveDoctor();      break;
    case 'reject_doctor':       rejectDoctor();       break;
    case 'toggle_user_status':  toggleUserStatus();   break;
    default: echo json_encode(['success'=>false,'message'=>'Invalid action']);
}

function approveDoctor() {
    global $pdo;
    $docId  = intval($_POST['doctor_id'] ?? 0);
    $userId = intval($_POST['user_id'] ?? 0);
    $pdo->prepare("UPDATE doctors SET approval_status='approved' WHERE id=?")->execute([$docId]);
    $pdo->prepare("UPDATE users SET status='active' WHERE id=?")->execute([$userId]);
    // Notify doctor
    $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'success')")
        ->execute([$userId,'Registration Approved! 🎉','Congratulations! Your doctor registration has been approved. You can now login and start managing your appointments.']);
    echo json_encode(['success'=>true,'message'=>'Doctor approved successfully.']);
}

function rejectDoctor() {
    global $pdo;
    $docId  = intval($_POST['doctor_id'] ?? 0);
    $userId = intval($_POST['user_id'] ?? 0);
    $reason = trim($_POST['reason'] ?? '');
    $pdo->prepare("UPDATE doctors SET approval_status='rejected' WHERE id=?")->execute([$docId]);
    $msg = 'Your doctor registration has been rejected.' . ($reason ? ' Reason: '.$reason : ' Please contact admin for more information.');
    $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'danger')")
        ->execute([$userId,'Registration Rejected',$msg]);
    echo json_encode(['success'=>true,'message'=>'Doctor registration rejected.']);
}

function toggleUserStatus() {
    global $pdo;
    $userId    = intval($_POST['user_id'] ?? 0);
    $newStatus = ($_POST['status'] ?? '') === 'active' ? 'active' : 'inactive';
    $pdo->prepare("UPDATE users SET status=? WHERE id=?")->execute([$newStatus,$userId]);
    echo json_encode(['success'=>true]);
}
