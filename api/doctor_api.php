<?php
session_start();
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'doctor') {
    echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit;
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
    case 'change_password':      changePassword();      break;
    case 'mark_notif_read':      markNotifRead();       break;
    case 'propose_reschedule':   proposeReschedule();   break;
    case 'delete_cancelled_appointment': deleteCancelledAppointment(); break;
    default: echo json_encode(['success'=>false,'message'=>'Invalid action']);
}

function confirmAppointment() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    $pdo->prepare("UPDATE appointments SET status='confirmed' WHERE id=? AND doctor_id=?")->execute([$id,$profileId]);
    // Notify patient
    $appt = $pdo->prepare("SELECT a.*, p.user_id as p_user_id FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.id=?");
    $appt->execute([$id]); $row = $appt->fetch();
    if ($row) {
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'success')")
            ->execute([$row['p_user_id'],'Appointment Confirmed','Your appointment on '.date('M d, Y',strtotime($row['appointment_date'])).' at '.date('h:i A',strtotime($row['appointment_time'])).' has been confirmed.']);
    }
    echo json_encode(['success'=>true]);
}

function cancelAppointment() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    ensureAppointmentRescheduleSchema($pdo);
    $pdo->prepare("UPDATE appointments SET status='cancelled', proposed_appointment_date=NULL, proposed_appointment_time=NULL WHERE id=? AND doctor_id=?")->execute([$id,$profileId]);
    $appt = $pdo->prepare("SELECT a.*, p.user_id as p_user_id FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.id=?");
    $appt->execute([$id]); $row = $appt->fetch();
    if ($row) {
        $pdo->prepare("DELETE FROM notifications WHERE user_id=? AND appointment_id=? AND cta='reschedule'")->execute([(int)$row['p_user_id'], $id]);
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'warning')")
            ->execute([$row['p_user_id'],'Appointment Cancelled','Your appointment on '.date('M d, Y',strtotime($row['appointment_date'])).' has been cancelled by the doctor.']);
    }
    echo json_encode(['success'=>true]);
}

function completeAppointment() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    $pdo->prepare("UPDATE appointments SET status='completed' WHERE id=? AND doctor_id=?")->execute([$id,$profileId]);
    echo json_encode(['success'=>true]);
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
    echo json_encode(['success' => true]);
}

function saveMeetLink() {
    global $pdo, $profileId;
    $id   = intval($_POST['id'] ?? 0);
    $link = trim($_POST['link'] ?? '');
    $pdo->prepare("UPDATE appointments SET meet_link=? WHERE id=? AND doctor_id=?")->execute([$link,$id,$profileId]);
    // Notify patient
    $appt = $pdo->prepare("SELECT a.*, p.user_id as p_user_id FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.id=?");
    $appt->execute([$id]); $row = $appt->fetch();
    if ($row) {
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'info')")
            ->execute([$row['p_user_id'],'Meet Link Added','Your doctor has added a Google Meet link for your appointment on '.date('M d, Y',strtotime($row['appointment_date'])). '. Link: '.$link]);
    }
    echo json_encode(['success'=>true]);
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
    echo json_encode(['success'=>true]);
}

function saveSchedule() {
    global $pdo, $profileId;
    $scheduleData = json_decode($_POST['schedule'] ?? '[]', true);
    if (!is_array($scheduleData)) { echo json_encode(['success'=>false,'message'=>'Invalid data.']); return; }
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
    echo json_encode(['success'=>true]);
}

function toggleClinicStatus() {
    global $pdo, $profileId;
    $status = ($_POST['status'] ?? '') === 'open' ? 'open' : 'closed';
    $pdo->prepare("UPDATE doctors SET clinic_status=? WHERE id=?")->execute([$status,$profileId]);
    echo json_encode(['success'=>true]);
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
    if (!$name) { echo json_encode(['success'=>false,'message'=>'Name required.']); return; }
    $pdo->prepare("UPDATE users SET name=?,phone=? WHERE id=?")->execute([$name,$phone,$userId]);
    $pdo->prepare("UPDATE doctors SET specialization=?,qualification=?,experience_years=?,fees=?,clinic_name=?,clinic_address=?,clinic_phone=?,about=? WHERE id=?")
        ->execute([$spec,$qual,$exp,$fees,$clinic,$clinicAddr,$clinicPhone,$about,$profileId]);
    echo json_encode(['success'=>true]);
}

function changePassword() {
    global $pdo, $userId;
    $current = $_POST['current'] ?? '';
    $new     = $_POST['new'] ?? '';
    if (strlen($new) < 8) { echo json_encode(['success'=>false,'message'=>'Password must be at least 8 characters.']); return; }
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id=?");
    $stmt->execute([$userId]); $user = $stmt->fetch();
    if (!$user || !password_verify($current, $user['password'])) { echo json_encode(['success'=>false,'message'=>'Current password incorrect.']); return; }
    $hashed = password_hash($new, PASSWORD_BCRYPT, ['cost'=>12]);
    $pdo->prepare("UPDATE users SET password=? WHERE id=?")->execute([$hashed,$userId]);
    echo json_encode(['success'=>true]);
}

function markNotifRead() {
    global $pdo, $userId;
    $pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=?")->execute([$userId]);
    echo json_encode(['success'=>true]);
}

function proposeReschedule() {
    global $pdo, $profileId;
    ensureAppointmentRescheduleSchema($pdo);
    $id = intval($_POST['id'] ?? 0);
    $date = trim($_POST['date'] ?? '');
    $timeRaw = trim($_POST['time'] ?? '');
    $time = normalizeAppointmentTimeForDb($timeRaw);
    if (!$id || !$date || !$time) {
        echo json_encode(['success' => false, 'message' => 'Date and time are required.']);
        return;
    }
    if (strtotime($date) < strtotime(date('Y-m-d'))) {
        echo json_encode(['success' => false, 'message' => 'Cannot propose a date in the past.']);
        return;
    }
    $stmt = $pdo->prepare("SELECT a.*, p.user_id AS p_user_id, u.name AS patient_name FROM appointments a
        JOIN patients p ON a.patient_id = p.id JOIN users u ON p.user_id = u.id
        WHERE a.id = ? AND a.doctor_id = ?");
    $stmt->execute([$id, $profileId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Appointment not found.']);
        return;
    }
    if (!in_array($row['status'], ['pending', 'confirmed'], true)) {
        echo json_encode(['success' => false, 'message' => 'This appointment cannot be rescheduled.']);
        return;
    }
    $check = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('cancelled') AND id != ?");
    $check->execute([$profileId, $date, $time, $id]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'That slot is already booked. Choose another time.']);
        return;
    }
    $pdo->prepare("UPDATE appointments SET proposed_appointment_date = ?, proposed_appointment_time = ? WHERE id = ? AND doctor_id = ?")
        ->execute([$date, $time, $id, $profileId]);

    $pUserId = (int) $row['p_user_id'];
    $pdo->prepare("DELETE FROM notifications WHERE user_id = ? AND appointment_id = ? AND cta = 'reschedule'")->execute([$pUserId, $id]);

    $oldWhen = date('M d, Y', strtotime($row['appointment_date'])) . ' at ' . date('h:i A', strtotime($row['appointment_time']));
    $newWhen = date('M d, Y', strtotime($date)) . ' at ' . date('h:i A', strtotime($time));
    $msg = 'Dr. requested a new time for your appointment. Was: ' . $oldWhen . '. Proposed: ' . $newWhen . '. Please accept or reject.';

    $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, appointment_id, cta) VALUES (?, ?, ?, 'warning', ?, 'reschedule')")
        ->execute([$pUserId, 'Appointment time update', $msg, $id]);

    echo json_encode(['success' => true]);
}
