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
    // Handle specific data type requests first
    switch ($type) {
        case 'medicines':
            $stmt = $pdo->prepare("SELECT * FROM medicine_reminders WHERE patient_id = ? ORDER BY created_at DESC");
            $stmt->execute([$profileId]);
            $response['data'] = $stmt->fetchAll();
            echo json_encode($response);
            exit;

        case 'clinics':
            $query = trim($_GET['query'] ?? '');
            // In a real app, this would call Google Places or search a local 'clinics' table.
            // For this project, we search approved doctors and their clinic info.
            $sql = "SELECT d.clinic_name, d.clinic_address, d.fees, d.clinic_status, u.name as doctor_name 
                    FROM doctors d 
                    JOIN users u ON d.user_id = u.id 
                    WHERE d.approval_status = 'approved'";
            if ($query) {
                $sql .= " AND (d.clinic_name LIKE ? OR d.clinic_address LIKE ? OR u.name LIKE ?)";
                $stmt = $pdo->prepare($sql);
                $searchTerm = "%$query%";
                $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
            } else {
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
            }
            $response['data'] = $stmt->fetchAll();
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
        $totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $totalDoc = $pdo->query("SELECT COUNT(*) FROM doctors")->fetchColumn();
        $pendingDoc = $pdo->query("SELECT COUNT(*) FROM doctors WHERE approval_status='pending'")->fetchColumn();

        $response['data'] = [
            'stats' => ['users' => $totalUsers, 'doctors' => $totalDoc, 'pending' => $pendingDoc]
        ];
    }

    echo json_encode($response);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
