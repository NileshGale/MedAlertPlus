<?php
session_start();
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';
require_once __DIR__ . '/twilio_helper.php';
require_once __DIR__ . '/../cron/reminder_common.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'patient') {
    echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit;
}
$userId    = $_SESSION['user_id'];
$profileId = $_SESSION['profile_id'];
$action    = $_POST['action'] ?? '';

switch ($action) {
    case 'book_appointment':    bookAppointment();    break;
    case 'cancel_appointment':  cancelAppointment();  break;
    case 'add_medicine':        addMedicine();        break;
    case 'edit_medicine':       editMedicine();       break;
    case 'delete_medicine':     deleteMedicine();     break;
    case 'toggle_medicine':     toggleMedicine();     break;
    case 'save_symptom_check':  saveSymptomCheck();   break;
    case 'upload_report':       uploadReport();       break;
    case 'delete_report':       deleteReport();       break;
    case 'update_profile':      updateProfile();      break;
    case 'change_password':     changePassword();     break;
    case 'mark_notif_read':     markNotifRead();      break;
    case 'delete_notification': deleteNotification(); break;
    case 'delete_all_notifications': deleteAllNotifications(); break;
    case 'accept_reschedule':   acceptReschedule();   break;
    case 'reject_reschedule':   rejectReschedule();   break;
    case 'add_vitals':          addVitals();          break;
    case 'delete_vitals':       deleteVitals();       break;
    case 'mark_medicine_adherence': markMedicineAdherence(); break;
    default: echo json_encode(['success'=>false,'message'=>'Invalid action']);
}

function bookAppointment() {
    global $pdo, $profileId;
    $docId = intval($_POST['doctor_id'] ?? 0);
    $type  = in_array($_POST['type']??'', ['online','physical']) ? $_POST['type'] : 'physical';
    $date  = $_POST['date'] ?? '';
    $time  = $_POST['time'] ?? '';
    $notes = trim($_POST['notes'] ?? '');
    if (!$docId || !$date || !$time) { echo json_encode(['success'=>false,'message'=>'All required fields must be filled.']); return; }
    if (strtotime($date) < strtotime(date('Y-m-d'))) { echo json_encode(['success'=>false,'message'=>'Cannot book an appointment in the past.']); return; }

    // Check if slot already taken
    $check = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND appointment_time=? AND status NOT IN ('cancelled')");
    $check->execute([$docId, $date, $time]);
    if ($check->fetch()) { echo json_encode(['success'=>false,'message'=>'This time slot is already booked. Please choose another.']); return; }

    $stmt = $pdo->prepare("INSERT INTO appointments (patient_id,doctor_id,type,appointment_date,appointment_time,patient_notes,status) VALUES (?,?,?,?,?,?,'pending')");
    $stmt->execute([$profileId, $docId, $type, $date, $time, $notes]);
    $apptId = $pdo->lastInsertId();

    // Notify doctor
    $docInfo = $pdo->prepare("SELECT d.*, u.name as doc_name, u.id as user_id FROM doctors d JOIN users u ON d.user_id=u.id WHERE d.id=?");
    $docInfo->execute([$docId]); $doc = $docInfo->fetch();
    $patInfo = $pdo->prepare("SELECT u.name FROM patients p JOIN users u ON p.user_id=u.id WHERE p.id=?");
    $patInfo->execute([$profileId]); $pat = $patInfo->fetch();

    if ($doc) {
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'info')")
            ->execute([$doc['user_id'], 'New Appointment Request', ($pat['name']??'A patient') . ' booked a ' . $type . ' appointment on ' . date('M d, Y', strtotime($date)) . ' at ' . date('h:i A', strtotime($time))]);
    }
    echo json_encode(['success'=>true,'message'=>'Appointment booked successfully!','id'=>$apptId]);
}

function cancelAppointment() {
    global $pdo, $profileId, $userId;
    $id = intval($_POST['id'] ?? 0);
    ensureAppointmentRescheduleSchema($pdo);
    $stmt = $pdo->prepare("UPDATE appointments SET status='cancelled', proposed_appointment_date=NULL, proposed_appointment_time=NULL WHERE id=? AND patient_id=?");
    $stmt->execute([$id, $profileId]);
    $pdo->prepare("DELETE FROM notifications WHERE user_id=? AND appointment_id=? AND cta='reschedule'")->execute([$userId, $id]);
    echo json_encode(['success'=>true]);
}

function addMedicine() {
    global $pdo, $profileId, $userId;
    $name      = trim($_POST['medicine_name'] ?? '');
    $dosage    = trim($_POST['dosage'] ?? '');
    $freq      = $_POST['frequency'] ?? 'once';
    $times     = $_POST['reminder_times'] ?? '[]';
    $start     = $_POST['start_date'] ?? null;
    $end       = ($_POST['end_date'] ?? '') !== '' ? $_POST['end_date'] : null;
    $notes     = trim($_POST['notes'] ?? '');
    $sendEmail = !empty($_POST['send_email']) ? 1 : 0;
    $sendWa    = !empty($_POST['send_whatsapp']) ? 1 : 0;
    $waNumber  = trim($_POST['whatsapp_number'] ?? '');
    $emailDaily = null;
    if ($sendEmail) {
        $emailDaily = normalizeEmailDailyTimeForDb(trim($_POST['email_daily_time'] ?? ''));
        if ($emailDaily === null) {
            $dec = json_decode($times, true);
            if (is_array($dec) && isset($dec[0])) {
                $emailDaily = normalizeEmailDailyTimeForDb((string) $dec[0]);
            }
        }
        if ($emailDaily === null) {
            echo json_encode(['success' => false, 'message' => 'Choose a daily email time, or add at least one reminder time.']);
            return;
        }
    }

    if (!$name || !$dosage) { echo json_encode(['success'=>false,'message'=>'Medicine name and dosage required.']); return; }

    ensureReminderCronSchema($pdo);

    $stmt = $pdo->prepare("INSERT INTO medicine_reminders (patient_id,medicine_name,dosage,frequency,reminder_times,start_date,end_date,notes,send_email,send_whatsapp,whatsapp_number,send_sms,email_daily_time,last_email_digest_date,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,NULL,1)");
    $stmt->execute([$profileId,$name,$dosage,$freq,$times,$start,$end,$notes,$sendEmail,$sendWa,$waNumber,$emailDaily]);
    $newRemId = $pdo->lastInsertId();

    // ---- Real-time Notification Trigger ----
    try {
        $patientInfo = $pdo->prepare("SELECT u.name, u.email, p.whatsapp_number as profile_wa 
                                    FROM patients p 
                                    JOIN users u ON p.user_id = u.id 
                                    WHERE p.id = ?");
        $patientInfo->execute([$profileId]);
        $pat = $patientInfo->fetch();

        if ($pat) {
            $timesArr = json_decode($times, true);
            $timeStr  = is_array($timesArr) ? implode(', ', $timesArr) : $times;
            
            // 1. Dashboard Notification
            $notifMsg = "New Medicine Reminder Scheduled: $name ($dosage) at $timeStr. Frequency: " . ucfirst($freq);
            $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Medicine Reminder Set', ?, 'info')")
                ->execute([$userId, $notifMsg]);

            // Removed immediate Email/WhatsApp notifications so they only trigger on time via cron trigger.
        }
    } catch (Exception $e) {
        // Log error but don't fail the entire request
        error_log("Real-time notification failed: " . $e->getMessage());
    }

    echo json_encode(['success'=>true,'message'=>'Reminder is set']);
}

function editMedicine() {
    global $pdo, $profileId;
    $id     = intval($_POST['id'] ?? 0);
    $name   = trim($_POST['medicine_name'] ?? '');
    $dosage = trim($_POST['dosage'] ?? '');
    $freq   = $_POST['frequency'] ?? 'once';
    $times  = $_POST['reminder_times'] ?? '[]';
    $start  = $_POST['start_date'] ?? null;
    $end    = ($_POST['end_date'] ?? '') !== '' ? $_POST['end_date'] : null;
    $notes  = trim($_POST['notes'] ?? '');
    $email  = !empty($_POST['send_email']) ? 1 : 0;
    $wa     = !empty($_POST['send_whatsapp']) ? 1 : 0;
    $waNumber = trim($_POST['whatsapp_number'] ?? '');
    $emailDaily = null;
    if ($email) {
        $emailDaily = normalizeEmailDailyTimeForDb(trim($_POST['email_daily_time'] ?? ''));
        if ($emailDaily === null) {
            $dec = json_decode($times, true);
            if (is_array($dec) && isset($dec[0])) {
                $emailDaily = normalizeEmailDailyTimeForDb((string) $dec[0]);
            }
        }
        if ($emailDaily === null) {
            echo json_encode(['success' => false, 'message' => 'Choose a daily email time, or add at least one reminder time.']);
            return;
        }
    }
    if (!$name || !$dosage) { echo json_encode(['success'=>false,'message'=>'Medicine name and dosage required.']); return; }
    ensureReminderCronSchema($pdo);
    $stmt = $pdo->prepare("UPDATE medicine_reminders SET medicine_name=?,dosage=?,frequency=?,reminder_times=?,start_date=?,end_date=?,notes=?,send_email=?,send_whatsapp=?,whatsapp_number=?,send_sms=0,email_daily_time=?,last_email_digest_date=NULL WHERE id=? AND patient_id=?");
    $stmt->execute([$name,$dosage,$freq,$times,$start,$end,$notes,$email,$wa,$waNumber,$emailDaily,$id,$profileId]);
    echo json_encode(['success'=>true]);
}

function deleteMedicine() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    $pdo->prepare("DELETE FROM medicine_reminders WHERE id=? AND patient_id=?")->execute([$id,$profileId]);
    echo json_encode(['success'=>true]);
}

function toggleMedicine() {
    global $pdo, $profileId;
    $id     = intval($_POST['id'] ?? 0);
    $active = intval($_POST['active'] ?? 0);
    $pdo->prepare("UPDATE medicine_reminders SET is_active=? WHERE id=? AND patient_id=?")->execute([$active,$id,$profileId]);
    echo json_encode(['success'=>true]);
}

function saveSymptomCheck() {
    global $pdo, $profileId;
    $symptoms  = trim($_POST['symptoms'] ?? '');
    $diagnosis = trim($_POST['diagnosis'] ?? '');
    $medicines = $_POST['medicines'] ?? '';
    $remedies  = $_POST['remedies'] ?? '';
    if (!$symptoms) { echo json_encode(['success'=>false]); return; }
    $pdo->prepare("INSERT INTO symptom_checks (patient_id,symptoms,diagnosis,medicines,home_remedies) VALUES (?,?,?,?,?)")
        ->execute([$profileId,$symptoms,$diagnosis,$medicines,$remedies]);
    echo json_encode(['success'=>true]);
}

function uploadReport() {
    global $pdo, $profileId;
    if (!isset($_FILES['report'])) { echo json_encode(['success'=>false,'message'=>'No file received.']); return; }
    $file = $_FILES['report'];
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['pdf','doc','docx','jpg','jpeg','png'];
    if (!in_array($ext, $allowed)) { echo json_encode(['success'=>false,'message'=>'File type not allowed.']); return; }
    if ($file['size'] > 5*1024*1024) { echo json_encode(['success'=>false,'message'=>'File too large. Max 5MB.']); return; }
    $uploadDir = __DIR__ . '/../uploads/reports/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $newName = 'report_' . $profileId . '_' . time() . '.' . $ext;
    $dest    = $uploadDir . $newName;
    if (!move_uploaded_file($file['tmp_name'], $dest)) { echo json_encode(['success'=>false,'message'=>'Upload failed.']); return; }
    $pdo->prepare("INSERT INTO patient_reports (patient_id,file_name,file_path,file_type) VALUES (?,?,?,?)")
        ->execute([$profileId, $file['name'], 'reports/' . $newName, $ext]);
    echo json_encode(['success'=>true,'message'=>'Report uploaded successfully!']);
}

function deleteReport() {
    global $pdo, $profileId;
    $id   = intval($_POST['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT file_path FROM patient_reports WHERE id=? AND patient_id=?");
    $stmt->execute([$id,$profileId]); $rep = $stmt->fetch();
    if (!$rep) { echo json_encode(['success'=>false,'message'=>'Not found.']); return; }
    $filePath = __DIR__ . '/../uploads/' . $rep['file_path'];
    if (file_exists($filePath)) unlink($filePath);
    $pdo->prepare("DELETE FROM patient_reports WHERE id=? AND patient_id=?")->execute([$id,$profileId]);
    echo json_encode(['success'=>true]);
}

function updateProfile() {
    global $pdo, $userId, $profileId;
    $name      = trim($_POST['name'] ?? '');
    $age       = intval($_POST['age'] ?? 0) ?: null;
    $gender    = $_POST['gender'] ?? null;
    $blood     = trim($_POST['blood_group'] ?? '') ?: null;
    $disease   = trim($_POST['disease'] ?? '');
    $address   = trim($_POST['address'] ?? '');
    $phone     = trim($_POST['phone'] ?? '');
    $whatsapp  = trim($_POST['whatsapp'] ?? '');
    $emergency = trim($_POST['emergency'] ?? '');
    if (!$name) { echo json_encode(['success'=>false,'message'=>'Name is required.']); return; }
    $pdo->prepare("UPDATE users SET name=?,phone=? WHERE id=?")->execute([$name,$phone,$userId]);
    $pdo->prepare("UPDATE patients SET age=?,gender=?,blood_group=?,disease=?,address=?,whatsapp_number=?,emergency_contact=? WHERE id=?")
        ->execute([$age,$gender,$blood,$disease,$address,$whatsapp,$emergency,$profileId]);
    echo json_encode(['success'=>true,'message'=>'Profile updated!']);
}

function changePassword() {
    global $pdo, $userId;
    $current = $_POST['current'] ?? '';
    $new     = $_POST['new'] ?? '';
    if (strlen($new) < 8) { echo json_encode(['success'=>false,'message'=>'Password must be at least 8 characters.']); return; }
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id=?");
    $stmt->execute([$userId]); $user = $stmt->fetch();
    if (!$user || !password_verify($current, $user['password'])) { echo json_encode(['success'=>false,'message'=>'Current password is incorrect.']); return; }
    $hashed = password_hash($new, PASSWORD_BCRYPT, ['cost'=>12]);
    $pdo->prepare("UPDATE users SET password=? WHERE id=?")->execute([$hashed,$userId]);
    echo json_encode(['success'=>true]);
}

function markNotifRead() {
    global $pdo, $userId;
    $pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=?")->execute([$userId]);
    echo json_encode(['success'=>true]);
}

function deleteNotification() {
    global $pdo, $userId;
    $id = intval($_POST['id'] ?? 0);
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Invalid notification.']);
        return;
    }
    $stmt = $pdo->prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    echo json_encode(['success' => true]);
}

function deleteAllNotifications() {
    global $pdo, $userId;
    $pdo->prepare('DELETE FROM notifications WHERE user_id = ?')->execute([$userId]);
    echo json_encode(['success' => true]);
}

function acceptReschedule() {
    global $pdo, $profileId, $userId;
    ensureAppointmentRescheduleSchema($pdo);
    $id = intval($_POST['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT a.* FROM appointments a WHERE a.id=? AND a.patient_id=?");
    $stmt->execute([$id, $profileId]);
    $row = $stmt->fetch();
    if (!$row || empty($row['proposed_appointment_date']) || empty($row['proposed_appointment_time'])) {
        echo json_encode(['success' => false, 'message' => 'No pending reschedule for this appointment.']);
        return;
    }
    $newDate = $row['proposed_appointment_date'];
    $newTime = $row['proposed_appointment_time'];
    $check = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND appointment_time=? AND status NOT IN ('cancelled') AND id != ?");
    $check->execute([(int) $row['doctor_id'], $newDate, $newTime, $id]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'That slot is no longer available.']);
        return;
    }
    $pdo->prepare("UPDATE appointments SET appointment_date=?, appointment_time=?, proposed_appointment_date=NULL, proposed_appointment_time=NULL WHERE id=? AND patient_id=?")
        ->execute([$newDate, $newTime, $id, $profileId]);
    $pdo->prepare("DELETE FROM notifications WHERE user_id=? AND appointment_id=? AND cta='reschedule'")->execute([$userId, $id]);

    $doc = $pdo->prepare("SELECT u.id AS doc_user_id, u.name AS doc_name FROM doctors d JOIN users u ON d.user_id=u.id WHERE d.id=?");
    $doc->execute([(int) $row['doctor_id']]);
    $dinfo = $doc->fetch();
    if ($dinfo) {
        $pnStmt = $pdo->prepare("SELECT name FROM users WHERE id=?");
        $pnStmt->execute([$userId]);
        $pname = $pnStmt->fetchColumn() ?: 'A patient';
        $when = date('M d, Y', strtotime($newDate)) . ' at ' . date('h:i A', strtotime($newTime));
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'success')")
            ->execute([(int) $dinfo['doc_user_id'], 'Reschedule accepted', $pname . ' accepted the new appointment time: ' . $when . '.']);
    }

    echo json_encode(['success' => true]);
}

function rejectReschedule() {
    global $pdo, $profileId, $userId;
    ensureAppointmentRescheduleSchema($pdo);
    $id = intval($_POST['id'] ?? 0);
    $stmt = $pdo->prepare("SELECT a.* FROM appointments a WHERE a.id=? AND a.patient_id=?");
    $stmt->execute([$id, $profileId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Appointment not found.']);
        return;
    }
    if (empty($row['proposed_appointment_date'])) {
        echo json_encode(['success' => false, 'message' => 'No pending reschedule.']);
        return;
    }
    $pdo->prepare("UPDATE appointments SET proposed_appointment_date=NULL, proposed_appointment_time=NULL WHERE id=? AND patient_id=?")->execute([$id, $profileId]);
    $pdo->prepare("DELETE FROM notifications WHERE user_id=? AND appointment_id=? AND cta='reschedule'")->execute([$userId, $id]);

    $doc = $pdo->prepare("SELECT u.id AS doc_user_id FROM doctors d JOIN users u ON d.user_id=u.id WHERE d.id=?");
    $doc->execute([(int) $row['doctor_id']]);
    $dinfo = $doc->fetch();
    if ($dinfo) {
        $pdo->prepare("INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'warning')")
            ->execute([(int) $dinfo['doc_user_id'], 'Reschedule declined', 'The patient declined your proposed new appointment time. The original schedule remains.']);
    }

    echo json_encode(['success' => true]);
}

function addVitals() {
    global $pdo, $profileId;
    $weight   = floatval($_POST['weight'] ?? 0);
    $height   = floatval($_POST['height'] ?? 0);
    $bpSys    = intval($_POST['bp_systolic'] ?? 0);
    $bpDia    = intval($_POST['bp_diastolic'] ?? 0);
    $sugar    = floatval($_POST['sugar_level'] ?? 0);
    $log_date = ($_POST['log_date'] ?? '') !== '' ? $_POST['log_date'] : date('Y-m-d');

    if (!$weight && !$bpSys && !$sugar) {
        echo json_encode(['success'=>false, 'message'=>'Please enter at least one vital metric.']);
        return;
    }

    $stmt = $pdo->prepare("INSERT INTO patient_vitals (patient_id, weight, height, bp_systolic, bp_diastolic, sugar_level, log_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$profileId, $weight ?: null, $height ?: null, $bpSys ?: null, $bpDia ?: null, $sugar ?: null, $log_date]);
    
    echo json_encode(['success'=>true, 'message'=>'Vitals logged successfully!']);
}

function deleteVitals() {
    global $pdo, $profileId;
    $id = intval($_POST['id'] ?? 0);
    $pdo->prepare("DELETE FROM patient_vitals WHERE id=? AND patient_id=?")->execute([$id, $profileId]);
    echo json_encode(['success'=>true]);
}

function markMedicineAdherence() {
    global $pdo, $profileId;
    $reminderId = intval($_POST['reminder_id'] ?? 0);
    $status = $_POST['status'] ?? '';
    $allowed = ['taken', 'skipped'];
    if (!$reminderId || !in_array($status, $allowed, true)) {
        echo json_encode(['success'=>false,'message'=>'Invalid adherence data.']);
        return;
    }

    // Create table lazily for existing deployments.
    $pdo->exec("CREATE TABLE IF NOT EXISTS medicine_adherence (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reminder_id INT NOT NULL,
        patient_id INT NOT NULL,
        taken_on DATE NOT NULL,
        status ENUM('taken','skipped') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_reminder_day (reminder_id, patient_id, taken_on),
        INDEX idx_patient_day (patient_id, taken_on)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $today = date('Y-m-d');
    $stmt = $pdo->prepare("INSERT INTO medicine_adherence (reminder_id, patient_id, taken_on, status)
                           VALUES (?, ?, ?, ?)
                           ON DUPLICATE KEY UPDATE status = VALUES(status)");
    $stmt->execute([$reminderId, $profileId, $today, $status]);
    echo json_encode(['success'=>true,'message'=>'Adherence updated.']);
}

