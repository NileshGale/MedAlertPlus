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
        error_log("Twilio SID not configured. Simulated sending WhatsApp to $to: $medicineName");
        return true;
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

/**
 * Normalize to E.164 (+countrycode...) for SMS; strip whatsapp: prefix.
 */
function twilioNormalizePhone($to) {
    $to = trim((string) $to);
    if ($to === '') {
        return '';
    }
    if (stripos($to, 'whatsapp:') === 0) {
        $to = substr($to, 9);
    }
    if ($to !== '' && $to[0] !== '+') {
        $to = '+' . ltrim($to, '0');
    }
    return $to;
}

/**
 * Send a custom WhatsApp body (plain text). Used by cron reminders.
 */
function sendWhatsAppMessage($to, $body) {
    $sid = TWILIO_SID;
    $token = TWILIO_TOKEN;
    $from = TWILIO_WHATSAPP_FROM;

    if (empty($sid) || strpos($sid, 'replace-me') !== false || strpos($sid, 'test-sid') !== false) {
        error_log("Twilio not configured. Simulated WhatsApp to $to");
        return true;
    }

    $to = twilioNormalizePhone($to);
    if ($to === '') {
        return false;
    }
    if (strpos($to, 'whatsapp:') === false) {
        $to = 'whatsapp:' . $to;
    }

    $url = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
    $data = [
        'From' => $from,
        'To' => $to,
        'Body' => $body,
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
        error_log("Twilio WhatsApp Error: $err");
        return false;
    }

    $response = json_decode($res, true);
    if (isset($response['sid'])) {
        return true;
    }
    error_log("Twilio WhatsApp API: " . ($response['message'] ?? $res));
    return false;
}

function isTwilioSmsConfigured(): bool {
    return defined('TWILIO_SMS_FROM') && TWILIO_SMS_FROM !== '';
}

/**
 * Plain SMS (normal text). Requires a Twilio SMS-capable phone number in TWILIO_SMS_FROM.
 */
function sendSmsMessage($to, $body) {
    $sid = TWILIO_SID;
    $token = TWILIO_TOKEN;
    $from = defined('TWILIO_SMS_FROM') ? TWILIO_SMS_FROM : '';

    if (empty($sid) || strpos($sid, 'replace-me') !== false || strpos($sid, 'test-sid') !== false) {
        error_log("Twilio not configured. Simulated SMS to $to");
        return true;
    }
    if ($from === '') {
        error_log("TWILIO_SMS_FROM not set; cannot send SMS to $to");
        return false;
    }

    $to = twilioNormalizePhone($to);
    if ($to === '') {
        return false;
    }

    $url = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
    $data = [
        'From' => $from,
        'To' => $to,
        'Body' => $body,
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
        error_log("Twilio SMS Error: $err");
        return false;
    }

    $response = json_decode($res, true);
    if (isset($response['sid'])) {
        return true;
    }
    error_log("Twilio SMS API: " . ($response['message'] ?? $res));
    return false;
}
