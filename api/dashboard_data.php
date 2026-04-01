<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$role = $_SESSION['user_role'] ?? $_SESSION['role'] ?? ''; // Support both keys for safety
$profileId = $_SESSION['profile_id'] ?? null;
$type = $_GET['type'] ?? 'all';

$response = ['success' => true, 'data' => []];

try {
    if ($type === 'initial_load') {
        $response['user'] = [
            'id' => $userId,
            'name' => $_SESSION['user_name'] ?? '',
            'role' => $role,
            'email' => $_SESSION['user_email'] ?? '',
            'profile_id' => $profileId
        ];
        
        if ($role === 'doctor' && $profileId) {
            $stmt = $pdo->prepare("SELECT specialization, clinic_status FROM doctors WHERE id = ?");
            $stmt->execute([$profileId]);
            $docInfo = $stmt->fetch();
            $response['user']['specialization'] = $docInfo['specialization'] ?? 'Specialist';
            $response['user']['clinic_status'] = $docInfo['clinic_status'] ?? 'closed';
        }
        
        $type = 'all'; // Continue to fetch stats below
    }

    // Handle specific data type requests first
    switch ($type) {
        case 'medicines':
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

            $stmt = $pdo->prepare("SELECT mr.*,
                                          ma.status AS today_status
                                   FROM medicine_reminders mr
                                   LEFT JOIN medicine_adherence ma
                                     ON ma.reminder_id = mr.id
                                    AND ma.patient_id = mr.patient_id
                                    AND ma.taken_on = CURDATE()
                                   WHERE mr.patient_id = ?
                                   ORDER BY mr.created_at DESC");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'clinics':
            if (($role ?? '') !== 'patient') {
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }
            require_once __DIR__ . '/clinic_places_service.php';
            $response['data'] = mergeClinicSearchResults($pdo, $_GET);
            echo json_encode($response);
            exit;

        case 'clinic_address_suggest':
            if (($role ?? '') !== 'patient') {
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }
            require_once __DIR__ . '/clinic_places_service.php';
            $response['data'] = clinicAddressSuggestions($_GET);
            echo json_encode($response);
            exit;

        case 'clinic_reverse_geocode':
            if (($role ?? '') !== 'patient') {
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }
            require_once __DIR__ . '/clinic_places_service.php';
            $response['data'] = clinicReverseLookup($_GET);
            echo json_encode($response);
            exit;

        case 'users':
            if ($role !== 'admin') { echo json_encode(['success'=>false]); exit; }
            $filterRole = $_GET['role'] ?? 'all';
            $sql = "SELECT name, email, role, status, created_at FROM users";
            if ($filterRole !== 'all') {
                $stmt = $pdo->prepare($sql . " WHERE role = ? ORDER BY created_at DESC");
                $stmt->execute([$filterRole]);
            } else {
                $stmt = $pdo->prepare($sql . " ORDER BY created_at DESC");
                $stmt->execute();
            }
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'pending_doctors':
            if ($role !== 'admin') { echo json_encode(['success'=>false]); exit; }
            $stmt = $pdo->query("SELECT d.*, u.name, u.email, u.phone FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.approval_status = 'pending' ORDER BY u.created_at DESC");
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'admin_patients_list':
            if ($role !== 'admin') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->query("SELECT u.id AS user_id, u.name, u.email, u.phone, u.status, u.created_at,
                                         p.id AS patient_id, p.age, p.gender
                                  FROM users u
                                  INNER JOIN patients p ON p.user_id = u.id
                                  WHERE u.role = 'patient'
                                  ORDER BY u.name ASC");
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'admin_doctors_list':
            if ($role !== 'admin') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->query("SELECT u.id AS user_id, u.name, u.email, u.phone, u.status, u.created_at,
                                         d.id AS doctor_id, d.specialization, d.clinic_name, d.approval_status
                                  FROM users u
                                  INNER JOIN doctors d ON d.user_id = u.id
                                  WHERE u.role = 'doctor'
                                  ORDER BY u.name ASC");
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'patient_appointments':
            if ($role !== 'patient') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->prepare("SELECT a.*, u.name AS doctor_name, d.specialization, d.clinic_name
                                   FROM appointments a
                                   JOIN doctors d ON a.doctor_id = d.id
                                   JOIN users u ON d.user_id = u.id
                                   WHERE a.patient_id = ?
                                   ORDER BY a.appointment_date DESC, a.appointment_time DESC");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'patient_notifications':
            if ($role !== 'patient') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            require_once __DIR__ . '/../config/appointment_reschedule_schema.php';
            ensureAppointmentRescheduleSchema($pdo);
            $stmt = $pdo->prepare("SELECT id, title, message, type, is_read, created_at, appointment_id, cta
                                   FROM notifications
                                   WHERE user_id = ?
                                   ORDER BY created_at DESC
                                   LIMIT 50");
            $stmt->execute([$userId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'available_doctors':
            if ($role !== 'patient') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->prepare("SELECT d.id, u.name AS doctor_name, d.specialization, d.clinic_name, d.clinic_status
                                   FROM doctors d
                                   JOIN users u ON d.user_id = u.id
                                   WHERE d.approval_status = 'approved' AND u.status = 'active'
                                   ORDER BY (d.clinic_status='open') DESC, u.name ASC");
            $stmt->execute();
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'patient_profile':
            if ($role !== 'patient') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->prepare("SELECT u.name, u.email, u.phone, p.age, p.gender, p.blood_group, p.disease, p.address, p.whatsapp_number, p.emergency_contact, p.profile_image
                                   FROM users u
                                   JOIN patients p ON p.user_id = u.id
                                   WHERE p.id = ?
                                   LIMIT 1");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetch() ?: [];
            echo json_encode($response);
            exit;

        case 'patient_vitals':
            if ($role !== 'patient') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->prepare("SELECT id, weight, height, bp_systolic, bp_diastolic, sugar_level, log_date 
                                   FROM patient_vitals 
                                   WHERE patient_id = ? 
                                   ORDER BY log_date DESC, id DESC 
                                   LIMIT 30");
            $stmt->execute([$profileId]);
            $response['data'] = array_reverse($stmt->fetchAll());
            echo json_encode($response);
            exit;

        case 'patient_reports':
            if ($role !== 'patient') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $pdo->exec("CREATE TABLE IF NOT EXISTS patient_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_patient (patient_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            $stmt = $pdo->prepare("SELECT id, file_name, file_path, file_type, uploaded_at 
                                   FROM patient_reports 
                                   WHERE patient_id = ? 
                                   ORDER BY uploaded_at DESC");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'medicine_adherence_summary':
            if ($role !== 'patient') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
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

            $summaryStmt = $pdo->prepare("SELECT 
                    SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) AS taken_count,
                    SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped_count
                FROM medicine_adherence
                WHERE patient_id = ?
                  AND taken_on >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)");
            $summaryStmt->execute([$profileId]);
            $sum = $summaryStmt->fetch() ?: ['taken_count'=>0, 'skipped_count'=>0];
            $taken = intval($sum['taken_count'] ?? 0);
            $skipped = intval($sum['skipped_count'] ?? 0);
            $total = $taken + $skipped;
            $rate = $total > 0 ? round(($taken / $total) * 100) : 0;
            $response['data'] = [
                'taken' => $taken,
                'skipped' => $skipped,
                'weekly_rate' => $rate
            ];
            echo json_encode($response);
            exit;

        case 'doctor_appointments':
            if ($role !== 'doctor') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->prepare("SELECT a.*, u.name AS patient_name, u.phone AS patient_phone, p.gender, p.age, p.blood_group
                                   FROM appointments a
                                   JOIN patients p ON a.patient_id = p.id
                                   JOIN users u ON p.user_id = u.id
                                   WHERE a.doctor_id = ?
                                   ORDER BY a.appointment_date DESC, a.appointment_time DESC");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'doctor_schedule':
            if ($role !== 'doctor') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->prepare("SELECT day_of_week, is_available, start_time, end_time, slot_duration
                                   FROM doctor_schedules
                                   WHERE doctor_id = ?
                                   ORDER BY FIELD(day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday','sunday')");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'doctor_patients':
            if ($role !== 'doctor') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->prepare("SELECT p.id, u.name, u.email, u.phone, p.gender, p.age, p.blood_group,
                                          MAX(a.appointment_date) AS last_appointment
                                   FROM appointments a
                                   JOIN patients p ON a.patient_id = p.id
                                   JOIN users u ON p.user_id = u.id
                                   WHERE a.doctor_id = ?
                                   GROUP BY p.id, u.name, u.email, u.phone, p.gender, p.age, p.blood_group
                                   ORDER BY last_appointment DESC");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'doctor_patient_reports':
            if ($role !== 'doctor') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $patientId = intval($_GET['patient_id'] ?? 0);
            if (!$patientId) { echo json_encode(['success'=>false, 'message'=>'Invalid patient ID']); exit; }
            
            // Security: Check if doctor has an appointment relationship with this patient
            $check = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id=? AND patient_id=? LIMIT 1");
            $check->execute([$profileId, $patientId]);
            if (!$check->fetch()) {
                echo json_encode(['success'=>false, 'message'=>'Access denied: No appointment history with this patient.']);
                exit;
            }

            $stmt = $pdo->prepare("SELECT id, file_name, file_path, file_type, uploaded_at 
                                   FROM patient_reports WHERE patient_id = ? 
                                   ORDER BY uploaded_at DESC");
            $stmt->execute([$patientId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'doctor_profile':
            if ($role !== 'doctor') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
            $stmt = $pdo->prepare("SELECT u.name, u.email, u.phone, d.specialization, d.qualification, d.experience_years, d.fees, d.clinic_name, d.clinic_address, d.clinic_phone, d.about, d.clinic_status, d.profile_image
                                   FROM users u
                                   JOIN doctors d ON d.user_id = u.id
                                   WHERE d.id = ?
                                   LIMIT 1");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetch() ?: [];
            echo json_encode($response);
            exit;
    }

    // Default 'all' data for initial dashboard load
    if ($role === 'patient') {
        // Stats
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE patient_id = ?");
        $stmt->execute([$profileId]);
        $totalAppt = $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM medicine_reminders WHERE patient_id = ?");
        $stmt->execute([$profileId]);
        $totalMeds = $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE patient_id = ? AND status='pending'");
        $stmt->execute([$profileId]);
        $pendingAppt = $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM symptom_checks WHERE patient_id = ?");
        $stmt->execute([$profileId]);
        $sympChecks = $stmt->fetchColumn();

        // Upcoming Appointments
        $stmt = $pdo->prepare("SELECT a.*, u.name as doctor_name, d.specialization 
                               FROM appointments a 
                               JOIN doctors d ON a.doctor_id = d.id 
                               JOIN users u ON d.user_id = u.id 
                               WHERE a.patient_id = ? AND a.appointment_date >= CURDATE() 
                               ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 5");
        $stmt->execute([$profileId]);
        $appointments = $stmt->fetchAll();

        $response['data'] = [
            'stats' => [
                'totalAppt' => $totalAppt, 
                'totalMeds' => $totalMeds,
                'pendingAppt' => $pendingAppt,
                'sympChecks' => $sympChecks
            ],
            'upcoming' => $appointments
        ];

    } elseif ($role === 'doctor') {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE doctor_id = ?");
        $stmt->execute([$profileId]);
        $totalAppt = $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND status='pending'");
        $stmt->execute([$profileId]);
        $pendingAppt = $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND appointment_date = CURDATE()");
        $stmt->execute([$profileId]);
        $todayAppt = $stmt->fetchColumn();

        $response['data'] = [
            'stats' => ['total' => $totalAppt, 'pending' => $pendingAppt, 'today' => $todayAppt]
        ];

    } elseif ($role === 'admin') {
        $patientCount = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'patient'")->fetchColumn();
        $doctorCount  = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'doctor'")->fetchColumn();
        $pendingDoc   = (int) $pdo->query("SELECT COUNT(*) FROM doctors WHERE approval_status = 'pending'")->fetchColumn();
        $platformUsers = $patientCount + $doctorCount;

        $response['data'] = [
            'stats' => [
                'users'    => $platformUsers,
                'patients' => $patientCount,
                'doctors'  => $doctorCount,
                'pending'  => $pendingDoc,
            ],
        ];
    }

    echo json_encode($response);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
