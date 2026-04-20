<?php
session_start();
$_SESSION['user_id'] = 1; // Dummy
$_SESSION['user_role'] = 'doctor';
$_SESSION['profile_id'] = 1; // Dummy

$_POST['action'] = 'save_schedule';
$_POST['schedule'] = json_encode([
    ['day' => 'monday', 'available' => 1, 'start' => '09:00', 'end' => '17:00'],
    ['day' => 'tuesday', 'available' => 1, 'start' => '09:00', 'end' => '17:00']
]);

// Mock header function to avoid "Headers already sent" error
function header($header, $replace = true, $http_response_code = null) {
    echo "Header: $header\n";
}

ob_start();
include 'api/doctor_api.php';
$output = ob_get_clean();

echo "Raw Output Begin:\n";
echo $output;
echo "\nRaw Output End\n";

if (strpos($output, '{') === 0) {
    echo "Is JSON: Yes\n";
} else {
    echo "Is JSON: No (Warning: Potential noise before JSON)\n";
}
