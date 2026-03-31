<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mail.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin($pdo);
        break;
    case 'register':
        handleRegister($pdo);
        break;
    case 'verify_otp':
        handleVerifyOTP($pdo);
        break;
    case 'logout':
    case 'logout_get':
        handleLogout();
        break;
    default:
        if (!empty($action)) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid action: ' . $action]);
        }
        break;
}

function handleLogin($pdo) {
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Email and password are required.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        if ($user['status'] === 'pending' && $user['role'] === 'doctor') {
            echo json_encode(['status' => 'error', 'message' => 'Your account is pending admin approval.']);
            exit;
        } elseif ($user['status'] === 'inactive') {
            echo json_encode(['status' => 'error', 'message' => 'Your account is currently inactive.']);
            exit;
        }

        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];

        // Fetch Profile ID
        if ($user['role'] === 'patient') {
            $p = $pdo->prepare("SELECT id FROM patients WHERE user_id = ?");
            $p->execute([$user['id']]);
            $prof = $p->fetch();
            $_SESSION['profile_id'] = $prof['id'] ?? null;
        } elseif ($user['role'] === 'doctor') {
            $d = $pdo->prepare("SELECT id FROM doctors WHERE user_id = ?");
            $d->execute([$user['id']]);
            $prof = $d->fetch();
            $_SESSION['profile_id'] = $prof['id'] ?? null;
        } else {
            $_SESSION['profile_id'] = 0; // Admin
        }

        $redirect = ($user['role'] === 'admin') ? 'dashboard/admin.php' : 'dashboard/' . $user['role'] . '.php';
        
        echo json_encode([
            'status' => 'success', 
            'message' => 'Login successful', 
            'role' => $user['role'], 
            'redirect' => $redirect
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email or password.']);
    }
}

function handleRegister($pdo) {
    $role = $_POST['role'] ?? 'patient';
    $name = trim($_POST['name'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';

    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
        exit;
    }

    // Check if email exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Email already registered.']);
        exit;
    }

    // Temporarily store in session for OTP verification
    $_SESSION['temp_reg'] = [
        'name' => $name,
        'email' => $email,
        'phone' => trim($_POST['phone'] ?? ''),
        'password' => password_hash($password, PASSWORD_BCRYPT),
        'role' => $role,
        'specialization' => $_POST['specialization'] ?? '',
        'license' => $_POST['license'] ?? ''
    ];

    // Generate OTP
    $otp = sprintf("%06d", mt_rand(100000, 999999));
    
    $stmt = $pdo->prepare("INSERT INTO otp_verifications (email, otp, type, expires_at) VALUES (?, ?, 'registration', DATE_ADD(NOW(), INTERVAL 10 MINUTE))");
    $stmt->execute([$email, $otp]);

    // Send OTP via email
    if (sendOTP($email, $otp)) {
        echo json_encode([
            'status' => 'success', 
            'message' => 'OTP sent to your email. Please verify.', 
            'email' => $email
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to send OTP. Please check your email configuration or internet connection.']);
    }
}

function handleVerifyOTP($pdo) {
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $otp = $_POST['otp'] ?? '';
    
    $stmt = $pdo->prepare("SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1");
    $stmt->execute([$email, $otp]);
    $record = $stmt->fetch();

    if ($record) {
        if (isset($_SESSION['temp_reg'])) {
            $reg = $_SESSION['temp_reg'];
            // Check if email from record matches temp_reg (extra safety)
            if ($reg['email'] !== $email) {
                 echo json_encode(['status' => 'error', 'message' => "Session email mismatch ({$reg['email']} vs $email)."]);
                 exit;
            }
            
            try {
                $pdo->beginTransaction();

                $status = ($reg['role'] === 'doctor') ? 'pending' : 'active';
                
                $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$reg['name'], $reg['email'], $reg['phone'], $reg['password'], $reg['role'], $status]);
                $userId = $pdo->lastInsertId();

                if ($reg['role'] === 'patient') {
                    $stmt = $pdo->prepare("INSERT INTO patients (user_id) VALUES (?)");
                    $stmt->execute([$userId]);
                    $profileId = $pdo->lastInsertId();
                } else {
                    $stmt = $pdo->prepare("INSERT INTO doctors (user_id, specialization, license_number, approval_status) VALUES (?, ?, ?, 'pending')");
                    $stmt->execute([$userId, $reg['specialization'], $reg['license']]);
                    $profileId = $pdo->lastInsertId();
                }

                // Delete OTP and temp session
                $pdo->prepare("DELETE FROM otp_verifications WHERE email = ?")->execute([$email]);
                unset($_SESSION['temp_reg']);

                $pdo->commit();

                if ($reg['role'] === 'patient') {
                    // Auto login for patient
                    $_SESSION['user_id'] = $userId;
                    $_SESSION['user_role'] = 'patient';
                    $_SESSION['user_name'] = $reg['name'];
                    $_SESSION['user_email'] = $reg['email'];
                    $_SESSION['profile_id'] = $profileId;

                    echo json_encode([
                        'status' => 'success', 
                        'message' => 'Account verified! Welcome to Med-Alert-Plus.', 
                        'redirect' => 'dashboard/patient.php'
                    ]);
                } else {
                    echo json_encode([
                        'status' => 'success', 
                        'message' => 'Verification successful! Please wait for Admin to approve your account before logging in.', 
                        'redirect' => 'index.html'
                    ]);
                }
            } catch (Exception $e) {
                $pdo->rollBack();
                echo json_encode(['status' => 'error', 'message' => 'Verification failed: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Registration session lost. Please try registering again.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid or expired OTP. No record found for this email/code.']);
    }
}

function handleLogout() {
    session_unset();
    session_destroy();
    header("Location: ../index.html");
    exit;
}
