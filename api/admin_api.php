<?php
session_start();
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit;
}
$action = $_POST['action'] ?? '';

switch ($action) {
    case 'approve_doctor':      approveDoctor();      break;
    case 'reject_doctor':       rejectDoctor();       break;
    case 'toggle_user_status':  toggleUserStatus();   break;
    case 'admin_update_patient': adminUpdatePatient(); break;
    case 'admin_delete_patient': adminDeletePatient(); break;
    case 'admin_update_doctor':  adminUpdateDoctor();  break;
    case 'admin_delete_doctor':  adminDeleteDoctor();  break;
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

function adminMailWrap(string $innerHtml): string
{
    return "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
            {$innerHtml}
            <hr style='border: none; border-top: 1px solid #eee; margin: 24px 0;' />
            <p style='font-size: 12px; color: #888; text-align: center;'>&copy; " . date('Y') . " Med-Alert-Plus</p>
        </div>";
}

function adminUpdatePatient() {
    global $pdo;
    $userId = intval($_POST['user_id'] ?? 0);
    $name   = trim($_POST['name'] ?? '');
    $email  = trim($_POST['email'] ?? '');
    $phone  = trim($_POST['phone'] ?? '');
    $age    = ($_POST['age'] ?? '') !== '' ? intval($_POST['age']) : null;
    $gender = in_array($_POST['gender'] ?? '', ['male', 'female', 'other'], true) ? $_POST['gender'] : null;

    if (!$userId || !$name || !$email) {
        echo json_encode(['success' => false, 'message' => 'Name and email are required.']);
        return;
    }

    $stmt = $pdo->prepare("SELECT u.id, u.name, u.email, u.phone, p.id AS patient_id FROM users u JOIN patients p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'patient'");
    $stmt->execute([$userId]);
    $before = $stmt->fetch();
    if (!$before) {
        echo json_encode(['success' => false, 'message' => 'Patient not found.']);
        return;
    }

    $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $chk->execute([$email, $userId]);
    if ($chk->fetch()) {
        echo json_encode(['success' => false, 'message' => 'That email is already in use.']);
        return;
    }

    $pdo->prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ? AND role = ?')
        ->execute([$name, $email, $phone, $userId, 'patient']);
    $pdo->prepare('UPDATE patients SET age = ?, gender = ? WHERE user_id = ?')
        ->execute([$age, $gender, $userId]);

    $changes = [];
    if ($before['name'] !== $name) {
        $changes[] = 'Name was updated';
    }
    if ($before['email'] !== $email) {
        $changes[] = 'Email was updated';
    }
    if (($before['phone'] ?? '') !== $phone) {
        $changes[] = 'Phone was updated';
    }
    $changes[] = 'Other profile fields may have been refreshed.';
    $list = '<ul style="margin:12px 0;padding-left:20px;"><li>' . implode('</li><li>', array_map('htmlspecialchars', $changes)) . '</li></ul>';
    $body = adminMailWrap('<p>Hello <strong>' . htmlspecialchars($name) . '</strong>,</p><p>Your Med-Alert-Plus patient profile was updated by an administrator.</p>' . $list . '<p>If you did not expect this, please contact support immediately.</p>');
    sendAdminAccountEmail($email, $name, 'Your Med-Alert-Plus profile was updated', $body);

    echo json_encode(['success' => true, 'message' => 'Patient updated and notified by email.']);
}

function adminDeletePatient() {
    global $pdo;
    $userId = intval($_POST['user_id'] ?? 0);
    $stmt = $pdo->prepare("SELECT u.email, u.name FROM users u WHERE u.id = ? AND u.role = 'patient'");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Patient not found.']);
        return;
    }
    $email = $row['email'];
    $name = $row['name'];
    $body = adminMailWrap('<p>Hello <strong>' . htmlspecialchars($name) . '</strong>,</p><p>Your Med-Alert-Plus patient account has been <strong>removed</strong> by a system administrator. You will no longer be able to sign in with this account.</p><p>If you believe this was a mistake, please contact support.</p>');
    sendAdminAccountEmail($email, $name, 'Your Med-Alert-Plus account was removed', $body);

    $pdo->prepare('DELETE FROM users WHERE id = ? AND role = ?')->execute([$userId, 'patient']);
    echo json_encode(['success' => true, 'message' => 'Patient removed and notified by email.']);
}

function adminUpdateDoctor() {
    global $pdo;
    $userId = intval($_POST['user_id'] ?? 0);
    $name   = trim($_POST['name'] ?? '');
    $email  = trim($_POST['email'] ?? '');
    $phone  = trim($_POST['phone'] ?? '');
    $spec   = trim($_POST['specialization'] ?? '');
    $clinic = trim($_POST['clinic_name'] ?? '');

    if (!$userId || !$name || !$email) {
        echo json_encode(['success' => false, 'message' => 'Name and email are required.']);
        return;
    }

    $stmt = $pdo->prepare("SELECT u.id, u.name, u.email, u.phone, d.id AS doctor_id FROM users u JOIN doctors d ON d.user_id = u.id WHERE u.id = ? AND u.role = 'doctor'");
    $stmt->execute([$userId]);
    $before = $stmt->fetch();
    if (!$before) {
        echo json_encode(['success' => false, 'message' => 'Doctor not found.']);
        return;
    }

    $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $chk->execute([$email, $userId]);
    if ($chk->fetch()) {
        echo json_encode(['success' => false, 'message' => 'That email is already in use.']);
        return;
    }

    $pdo->prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ? AND role = ?')
        ->execute([$name, $email, $phone, $userId, 'doctor']);
    $pdo->prepare('UPDATE doctors SET specialization = ?, clinic_name = ? WHERE user_id = ?')
        ->execute([$spec, $clinic, $userId]);

    $changes = [];
    if ($before['name'] !== $name) {
        $changes[] = 'Name was updated';
    }
    if ($before['email'] !== $email) {
        $changes[] = 'Email was updated';
    }
    if (($before['phone'] ?? '') !== $phone) {
        $changes[] = 'Phone was updated';
    }
    $changes[] = 'Specialization or clinic details may have been updated.';
    $list = '<ul style="margin:12px 0;padding-left:20px;"><li>' . implode('</li><li>', array_map('htmlspecialchars', $changes)) . '</li></ul>';
    $body = adminMailWrap('<p>Hello Dr. <strong>' . htmlspecialchars($name) . '</strong>,</p><p>An administrator updated your account.</p>' . $list . '<p>If this was unexpected, please contact support.</p>');
    sendAdminAccountEmail($email, $name, 'Your Med-Alert-Plus doctor profile was updated', $body);

    echo json_encode(['success' => true, 'message' => 'Doctor updated and notified by email.']);
}

function adminDeleteDoctor() {
    global $pdo;
    $userId = intval($_POST['user_id'] ?? 0);
    $stmt = $pdo->prepare("SELECT u.email, u.name FROM users u WHERE u.id = ? AND u.role = 'doctor'");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Doctor not found.']);
        return;
    }
    $email = $row['email'];
    $name = $row['name'];
    $body = adminMailWrap('<p>Hello Dr. <strong>' . htmlspecialchars($name) . '</strong>,</p><p>Your Med-Alert-Plus doctor account has been <strong>removed</strong> by a system administrator. You will no longer be able to sign in.</p><p>If you believe this was a mistake, please contact support.</p>');
    sendAdminAccountEmail($email, $name, 'Your Med-Alert-Plus account was removed', $body);

    $pdo->prepare('DELETE FROM users WHERE id = ? AND role = ?')->execute([$userId, 'doctor']);
    echo json_encode(['success' => true, 'message' => 'Doctor removed and notified by email.']);
}
