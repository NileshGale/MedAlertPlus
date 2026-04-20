<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_start();
date_default_timezone_set('Asia/Kolkata');

session_start();
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';

header('Content-Type: application/json');

function sendJsonResponse($data) {
    ob_clean();
    echo json_encode($data);
    exit;
}

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'doctor') {
    sendJsonResponse(['success' => false, 'message' => 'Unauthorized']);
}
$userId    = $_SESSION['user_id'];
$profileId = $_SESSION['profile_id'];
$action    = $_POST['action'] ?? '';

switch ($action) {
    case 'confirm_appointment':  confirmAppointment();  break;
    case 'cancel_appointment':   cancelAppointment();   break;
    case 'complete_appointment': completeAppointment(); break;
    case 'save_meet_link':       saveMeetLink();        break;
    case 'save_notes':           saveNotes();           break;
    case 'save_schedule':        saveSchedule();        break;
    case 'toggle_clinic_status': toggleClinicStatus();  break;
    case 'update_profile':       updateProfile();       break;
    case 'remove_profile_image': removeProfileImage(); break;
    case 'change_password':      changePassword();      break;
    case 'mark_notif_read':      markNotifRead();       break;
    case 'propose_reschedule':   proposeReschedule();   break;
    case 'delete_cancelled_appointment': deleteCancelledAppointment(); break;
    default: sendJsonResponse(['success'=>false,'message'=>'Invalid action']);
}

function confirmAppointment() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    $pdo->prepare("UPDATE appointments SET status='confirmed' WHERE id=? AND doctor_id=?")->execute([$id,$profileId]);
    // Notify patient
    $appt = $pdo->prepare("SELECT a.*, p.user_id as p_user_id, u.name AS p_name, u.email AS p_email 
                           FROM appointments a 
                           JOIN patients p ON a.patient_id=p.id 
                           JOIN users u ON p.user_id=u.id 
                           WHERE a.id=?");
    $appt->execute([$id]); $row = $appt->fetch();
    if ($row) {
        $dateStr = date('M d, Y', strtotime($row['appointment_date']));
        $timeStr = date('h:i A', strtotime($row['appointment_time']));
        $title = 'Appointment Confirmed';
        $msg = "Your appointment on {$dateStr} at {$timeStr} has been confirmed by the doctor.";
        
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'success')")
            ->execute([$row['p_user_id'], $title, $msg]);
            
        sendAppointmentUpdateEmail($row['p_email'], $row['p_name'], $title, $msg);
    }
    sendJsonResponse(['success'=>true]);
}

function cancelAppointment() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    ensureAppointmentRescheduleSchema($pdo);
    $pdo->prepare("UPDATE appointments SET status='cancelled', proposed_appointment_date=NULL, proposed_appointment_time=NULL WHERE id=? AND doctor_id=?")->execute([$id,$profileId]);
    $appt = $pdo->prepare("SELECT a.*, p.user_id as p_user_id, u.name AS p_name, u.email AS p_email 
                           FROM appointments a 
                           JOIN patients p ON a.patient_id=p.id 
                           JOIN users u ON p.user_id=u.id 
                           WHERE a.id=?");
    $appt->execute([$id]); $row = $appt->fetch();
    if ($row) {
        $dateStr = date('M d, Y', strtotime($row['appointment_date']));
        $title = 'Appointment Cancelled';
        $msg = "Your appointment on {$dateStr} has been cancelled by the doctor.";

        $pdo->prepare("DELETE FROM notifications WHERE user_id=? AND appointment_id=? AND cta='reschedule'")->execute([(int)$row['p_user_id'], $id]);
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'warning')")
            ->execute([$row['p_user_id'], $title, $msg]);
            
        sendAppointmentUpdateEmail($row['p_email'], $row['p_name'], $title, $msg);
    }
    sendJsonResponse(['success'=>true]);
}

function completeAppointment() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    $pdo->prepare("UPDATE appointments SET status='completed' WHERE id=? AND doctor_id=?")->execute([$id,$profileId]);
    sendJsonResponse(['success'=>true]);
}

function deleteCancelledAppointment() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Invalid appointment.']);
        return;
    }
    $chk = $pdo->prepare("SELECT id FROM appointments WHERE id = ? AND doctor_id = ? AND status = 'cancelled'");
    $chk->execute([$id, $profileId]);
    if (!$chk->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Only cancelled appointments can be deleted.']);
        return;
    }
    ensureAppointmentRescheduleSchema($pdo);
    try {
        $pdo->prepare('DELETE FROM notifications WHERE appointment_id = ?')->execute([$id]);
    } catch (Throwable $e) {
    }
    $pdo->prepare('DELETE FROM appointments WHERE id = ? AND doctor_id = ?')->execute([$id, $profileId]);
    sendJsonResponse(['success' => true]);
}

function saveMeetLink() {
    global $pdo, $profileId;
    $id   = intval($_POST['id'] ?? 0);
    $link = trim($_POST['link'] ?? '');
    $pdo->prepare("UPDATE appointments SET meet_link=? WHERE id=? AND doctor_id=?")->execute([$link,$id,$profileId]);
    // Notify patient
    $appt = $pdo->prepare("SELECT a.*, p.user_id as p_user_id, u.name AS p_name, u.email AS p_email 
                           FROM appointments a 
                           JOIN patients p ON a.patient_id=p.id 
                           JOIN users u ON p.user_id=u.id 
                           WHERE a.id=?");
    $appt->execute([$id]); $row = $appt->fetch();
    if ($row) {
        $dateStr = date('M d, Y', strtotime($row['appointment_date']));
        $title = 'Meet Link Added';
        $msg = "Your doctor has added a Google Meet link for your appointment on {$dateStr}.\n\nLink: {$link}";

        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'info')")
            ->execute([$row['p_user_id'], $title, $msg]);
            
        sendAppointmentUpdateEmail($row['p_email'], $row['p_name'], $title, $msg);
    }
    sendJsonResponse(['success'=>true]);
}

function saveNotes() {
    global $pdo, $profileId;
    $id    = intval($_POST['id'] ?? 0);
    $notes = trim($_POST['notes'] ?? '');
    $presc = trim($_POST['prescription'] ?? '');
    $pdo->prepare("UPDATE appointments SET doctor_notes=?,prescription=? WHERE id=? AND doctor_id=?")->execute([$notes,$presc,$id,$profileId]);
    // Notify patient about new notes
    $appt = $pdo->prepare("SELECT a.*, p.user_id as p_user_id FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.id=?");
    $appt->execute([$id]); $row = $appt->fetch();
    if ($row) {
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'success')")
            ->execute([$row['p_user_id'],'Doctor Added Notes','Your doctor has added notes and prescription for your appointment.']);
    }
    sendJsonResponse(['success'=>true]);
}

function saveSchedule() {
    global $pdo, $profileId;
    try {
        $scheduleData = json_decode($_POST['schedule'] ?? '[]', true);
        if (!is_array($scheduleData)) {
            echo json_encode(['success' => false, 'message' => 'Invalid data format.']);
            return;
        }
        $pdo->beginTransaction();
        foreach ($scheduleData as $item) {
            $day       = $item['day'] ?? '';
            $available = intval($item['available'] ?? 0);
            $start     = $item['start'] ?? '09:00';
            $end       = $item['end'] ?? '17:00';
            $slot      = intval($item['slot'] ?? 30);
            $days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
            if (!in_array($day, $days)) continue;
            // UPSERT
            $check = $pdo->prepare("SELECT id FROM doctor_schedules WHERE doctor_id=? AND day_of_week=?");
            $check->execute([$profileId,$day]);
            if ($check->fetch()) {
                $pdo->prepare("UPDATE doctor_schedules SET is_available=?,start_time=?,end_time=?,slot_duration=? WHERE doctor_id=? AND day_of_week=?")
                    ->execute([$available,$start,$end,$slot,$profileId,$day]);
            } else {
                $pdo->prepare("INSERT INTO doctor_schedules (doctor_id,day_of_week,start_time,end_time,slot_duration,is_available) VALUES (?,?,?,?,?,?)")
                    ->execute([$profileId,$day,$start,$end,$slot,$available]);
            }
        }
        $pdo->commit();
        sendJsonResponse(['success' => true, 'message' => 'Schedule updated successfully!']);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        sendJsonResponse(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function toggleClinicStatus() {
    global $pdo, $profileId;
    $status = ($_POST['status'] ?? '') === 'open' ? 'open' : 'closed';
    // Update status and explicit timestamp to mark a manual override
    $pdo->prepare("UPDATE doctors SET clinic_status=?, clinic_status_updated_at=NOW() WHERE id=?")->execute([$status,$profileId]);
    sendJsonResponse(['success'=>true]);
}

function updateProfile() {
    global $pdo, $userId, $profileId;
    $name        = trim($_POST['name'] ?? '');
    $phone       = trim($_POST['phone'] ?? '');
    $spec        = trim($_POST['specialization'] ?? '');
    $qual        = trim($_POST['qualification'] ?? '');
    $exp         = intval($_POST['experience'] ?? 0);
    $fees        = floatval($_POST['fees'] ?? 0);
    $clinic      = trim($_POST['clinic_name'] ?? '');
    $clinicAddr  = trim($_POST['clinic_address'] ?? '');
    $clinicPhone = trim($_POST['clinic_phone'] ?? '');
    $about       = trim($_POST['about'] ?? '');
    
    if (!$name) { sendJsonResponse(['success'=>false,'message'=>'Name required.']); }

    $profileImagePath = null;
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['profile_image'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png'];
        if (!in_array($ext, $allowed)) {
            sendJsonResponse(['success'=>false, 'message'=>'Invalid image format. JPG/PNG required.']);
        }
        if ($file['size'] > 2*1024*1024) {
            sendJsonResponse(['success'=>false, 'message'=>'Image too large. Max 2MB.']);
        }
        $dir = __DIR__ . '/../uploads/profiles/';
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $newName = 'doc_' . $profileId . '_' . time() . '.' . $ext;
        if (move_uploaded_file($file['tmp_name'], $dir . $newName)) {
            $profileImagePath = 'profiles/' . $newName;
        }
    }

    $pdo->prepare("UPDATE users SET name=?,phone=? WHERE id=?")->execute([$name,$phone,$userId]);
    
    $sql = "UPDATE doctors SET specialization=?, qualification=?, experience_years=?, fees=?, clinic_name=?, clinic_address=?, clinic_phone=?, about=?";
    $params = [$spec, $qual, $exp, $fees, $clinic, $clinicAddr, $clinicPhone, $about];
    
    if ($profileImagePath) {
        $sql .= ", profile_image=?";
        $params[] = $profileImagePath;
    }
    $sql .= " WHERE id=?";
    $params[] = $profileId;
    
    $pdo->prepare($sql)->execute($params);
    sendJsonResponse(['success'=>true, 'message'=>'Profile updated successfully!']);
}

function changePassword() {
    global $pdo, $userId;
    $current = $_POST['current'] ?? '';
    $new     = $_POST['new'] ?? '';
    if (strlen($new) < 8) { sendJsonResponse(['success'=>false,'message'=>'Password must be at least 8 characters.']); }
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id=?");
    $stmt->execute([$userId]); $user = $stmt->fetch();
    if (!$user || !password_verify($current, $user['password'])) { sendJsonResponse(['success'=>false,'message'=>'Current password incorrect.']); }
    $hashed = password_hash($new, PASSWORD_BCRYPT, ['cost'=>12]);
    $pdo->prepare("UPDATE users SET password=? WHERE id=?")->execute([$hashed,$userId]);
    sendJsonResponse(['success'=>true]);
}

function markNotifRead() {
    global $pdo, $userId;
    $pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=?")->execute([$userId]);
    sendJsonResponse(['success'=>true]);
}

function proposeReschedule() {
    global $pdo, $profileId;
    ensureAppointmentRescheduleSchema($pdo);
    $id = intval($_POST['id'] ?? 0);
    $date = trim($_POST['date'] ?? '');
    $timeRaw = trim($_POST['time'] ?? '');
    $time = normalizeAppointmentTimeForDb($timeRaw);
    if (!$id || !$date || !$time) {
        sendJsonResponse(['success' => false, 'message' => 'Date and time are required.']);
    }
    if (strtotime($date) < strtotime(date('Y-m-d'))) {
        sendJsonResponse(['success' => false, 'message' => 'Cannot propose a date in the past.']);
    }
    $stmt = $pdo->prepare("SELECT a.*, p.user_id AS p_user_id, u.name AS patient_name FROM appointments a
        JOIN patients p ON a.patient_id = p.id JOIN users u ON p.user_id = u.id
        WHERE a.id = ? AND a.doctor_id = ?");
    $stmt->execute([$id, $profileId]);
    $row = $stmt->fetch();
    if (!$row) {
        sendJsonResponse(['success' => false, 'message' => 'Appointment not found.']);
    }
    if (!in_array($row['status'], ['pending', 'confirmed'], true)) {
        sendJsonResponse(['success' => false, 'message' => 'This appointment cannot be rescheduled.']);
    }
    $check = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('cancelled') AND id != ?");
    $check->execute([$profileId, $date, $time, $id]);
    if ($check->fetch()) {
        sendJsonResponse(['success' => false, 'message' => 'That slot is already booked. Choose another time.']);
    }
    $pdo->prepare("UPDATE appointments SET proposed_appointment_date = ?, proposed_appointment_time = ? WHERE id = ? AND doctor_id = ?")
        ->execute([$date, $time, $id, $profileId]);

    $pUserId = (int) $row['p_user_id'];
    $pdo->prepare("DELETE FROM notifications WHERE user_id = ? AND appointment_id = ? AND cta = 'reschedule'")->execute([$pUserId, $id]);

    $oldWhen = date('M d, Y', strtotime($row['appointment_date'])) . ' at ' . date('h:i A', strtotime($row['appointment_time']));
    $newWhen = date('M d, Y', strtotime($date)) . ' at ' . date('h:i A', strtotime($time));
    $title = 'Appointment Time Update';
    $msg = "Dr. requested a new time for your appointment.\nWas: {$oldWhen}\nProposed: {$newWhen}\n\nPlease log in to accept or reject this change.";

    $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, appointment_id, cta) VALUES (?, ?, ?, 'warning', ?, 'reschedule')")
        ->execute([$pUserId, $title, $msg, $id]);

    sendAppointmentUpdateEmail($row['p_email'], $row['p_name'], $title, $msg);

    sendJsonResponse(['success' => true]);
}

function removeProfileImage() {
    global $pdo, $profileId;
    $pdo->prepare("UPDATE doctors SET profile_image = NULL WHERE id = ?")->execute([$profileId]);
    sendJsonResponse(['success'=>true, 'message'=>'Profile image removed.']);
}
