<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

register_shutdown_function(function() {
    $err = error_get_last();
    if ($err) {
        echo "\nSHUTDOWN ERROR: " . print_r($err, true) . "\n";
    }
});

session_start();
$_SESSION['user_id'] = 1;
$_SESSION['user_role'] = 'doctor';
$_SESSION['profile_id'] = 1;

$_POST['action'] = 'save_schedule';
$_POST['schedule'] = json_encode([
    ['day' => 'monday', 'available' => 1, 'start' => '09:00', 'end' => '17:00']
]);

echo "--- START ---\n";
include 'api/doctor_api.php';
echo "\n--- END ---\n";
