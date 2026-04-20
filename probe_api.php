<?php
$ch = curl_init('http://localhost/Med-Alert-Plus/api/doctor_api.php');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'action' => 'save_schedule',
    'schedule' => json_encode([
        ['day' => 'monday', 'available' => 1, 'start' => '09:00', 'end' => '17:00']
    ])
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// Mock session cookie if possible? No, I'll just check what it returns when Unauthorized.
$res = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

echo "Status: " . $info['http_code'] . "\n";
echo "Response: [" . $res . "]\n";
echo "Headers: " . print_r($info, true) . "\n";
