<?php
require_once __DIR__ . '/../config/db.php';

/**
 * Med-Alert-Plus Twilio WhatsApp Helper
 */
function sendWhatsAppReminder($to, $medicineName, $dosage) {
    $sid = TWILIO_SID;
    $token = TWILIO_TOKEN;
    $from = TWILIO_WHATSAPP_FROM;

    if (empty($sid) || strpos($sid, 'replace-me') !== false) {
        error_log("Twilio SID not configured.");
        return false;
    }

    $url = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
    
    // Ensure the number is in correct WhatsApp format
    if (strpos($to, 'whatsapp:') === false) {
        $to = 'whatsapp:' . (strpos($to, '+') === 0 ? $to : '+' . $to);
    }

    $data = [
        'From' => $from,
        'To' => $to,
        'Body' => "💊 Medicine Reminder from Med-Alert-Plus\n\nHello, it's time to take your medication:\n\nMedicine: $medicineName\nDosage: $dosage\n\nPlease confirm after taking it. Stay healthy!"
    ];

    $post = http_build_query($data);
    $x = curl_init($url);
    curl_setopt($x, CURLOPT_POST, true);
    curl_setopt($x, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($x, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($x, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($x, CURLOPT_USERPWD, "$sid:$token");
    curl_setopt($x, CURLOPT_POSTFIELDS, $post);
    
    $res = curl_exec($x);
    $err = curl_error($x);
    curl_close($x);

    if ($err) {
        error_log("Twilio Error: $err");
        return false;
    }

    $response = json_decode($res, true);
    if (isset($response['sid'])) {
        return true;
    } else {
        error_log("Twilio API Error: " . ($response['message'] ?? 'Unknown error'));
        return false;
    }
}
