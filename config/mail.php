<?php
require_once __DIR__ . '/../phpmailer/src/Exception.php';
require_once __DIR__ . '/../phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_USERNAME', 'gayatribhoyar18@gmail.com');
define('MAIL_PASSWORD', 'kwec wtjg mtbj vzik');
define('MAIL_PORT', 587);

function sendOTP($toEmail, $otp) {
    // If PHPMailer class doesn't exist, we can't send email. Still simulate OTP for dev.
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        error_log("PHPMailer not installed. OTP for $toEmail is $otp");
        return false; 
    }

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = MAIL_PORT;

        $mail->setFrom(MAIL_USERNAME, 'Med-Alert-Plus');
        $mail->addAddress($toEmail);

        $mail->isHTML(true);
        $mail->Subject = 'Your Med-Alert-Plus Verification Code';
        $mail->Body    = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
            <h2 style='color: #4A90E2; text-align: center;'>Med-Alert-Plus</h2>
            <p>Hello,</p>
            <p>Your verification code for registration/login is:</p>
            <div style='text-align: center; margin: 20px 0;'>
                <span style='display: inline-block; font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; letter-spacing: 2px;'>{$otp}</span>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
            <p style='font-size: 12px; color: #888; text-align: center;'>&copy; " . date('Y') . " Med-Alert-Plus. All rights reserved.</p>
        </div>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
function sendSOSAlert($toEmail, $patientName, $lat, $lng) {
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) return false;

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = MAIL_PORT;

        $mail->setFrom(MAIL_USERNAME, 'Med-Alert-Plus Emergency');
        $mail->addAddress($toEmail);
        $mail->Priority = 1; // High priority

        $mapLink = ($lat && $lng) ? "https://www.google.com/maps?q={$lat},{$lng}" : "Location not provided";

        $mail->isHTML(true);
        $mail->Subject = "EMERGENCY: SOS Alert from {$patientName}";
        $mail->Body    = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 2px solid #e11d48; border-radius: 12px;'>
            <h2 style='color: #e11d48; text-align: center;'>⚠️ EMERGENCY SOS ALERT ⚠️</h2>
            <p>Hello,</p>
            <p><strong>{$patientName}</strong> has triggered an Emergency SOS alert via Med-Alert-Plus.</p>
            <div style='background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;'>
                <p style='margin: 0; font-weight: bold;'>Patient Location:</p>
                <p style='margin: 5px 0;'><a href='{$mapLink}' style='color: #2563eb;'>{$mapLink}</a></p>
            </div>
            <p>Please contact them immediately or call emergency services.</p>
            <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
            <p style='font-size: 12px; color: #888; text-align: center;'>This is an automated emergency alert from Med-Alert-Plus.</p>
        </div>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("SOS Mail failed: {$mail->ErrorInfo}");
        return false;
    }
}
function sendMedicineReminder($toEmail, $patientName, $medicineName, $dosage, $scheduledTimeLabel = null) {
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) return false;

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = MAIL_PORT;

        $mail->setFrom(MAIL_USERNAME, 'Med-Alert-Plus Reminder');
        $mail->addAddress($toEmail);

        $mail->isHTML(true);
        $mail->Subject = "Medicine Reminder: {$medicineName}";
        $timeHtml = $scheduledTimeLabel
            ? "<p style='margin: 5px 0; font-size: 16px;'><strong>Scheduled time:</strong> " . htmlspecialchars($scheduledTimeLabel) . "</p>"
            : '';
        $mail->Body    = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #3b82f6; border-radius: 12px;'>
            <h2 style='color: #1e40af; text-align: center;'>Medication Reminder</h2>
            <p>Hello <strong>{$patientName}</strong>,</p>
            <p>This is a friendly reminder to take your medication as scheduled.</p>
            <div style='background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;'>
                <p style='margin: 0; font-size: 18px; color: #1e40af;'><strong>Medicine:</strong> {$medicineName}</p>
                <p style='margin: 5px 0; font-size: 16px;'><strong>Dosage:</strong> {$dosage}</p>
                {$timeHtml}
            </div>
            <p>Please ensure you take the correct dose. If you have already taken it, you can ignore this reminder.</p>
            <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
            <p style='font-size: 12px; color: #888; text-align: center;'>&copy; " . date('Y') . " Med-Alert-Plus Personal Health Assistant.</p>
        </div>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Reminder Mail failed: {$mail->ErrorInfo}");
        return false;
    }
}

/** One email per day at the patient's chosen clock time; lists all dose times. */
function sendMedicineDailyDigestEmail(string $toEmail, string $patientName, string $medicineName, string $dosage, string $frequencyLabel, string $timesHumanHtml): bool
{
    if (!class_exists(PHPMailer::class)) {
        return false;
    }

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = MAIL_PORT;

        $mail->setFrom(MAIL_USERNAME, 'Med-Alert-Plus Reminder');
        $mail->addAddress($toEmail);

        $safeName = htmlspecialchars($patientName, ENT_QUOTES, 'UTF-8');
        $safeMed = htmlspecialchars($medicineName, ENT_QUOTES, 'UTF-8');
        $safeDose = htmlspecialchars($dosage, ENT_QUOTES, 'UTF-8');
        $safeFreq = htmlspecialchars($frequencyLabel, ENT_QUOTES, 'UTF-8');

        $mail->isHTML(true);
        $mail->Subject = "Daily plan: {$medicineName}";
        $mail->Body = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #3b82f6; border-radius: 12px;'>
            <h2 style='color: #1e40af; text-align: center;'>Today's medication schedule</h2>
            <p>Hello <strong>{$safeName}</strong>,</p>
            <p>Your daily email summary — sent only at or after the time you set, not before.</p>
            <div style='background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;'>
                <p style='margin: 0; font-size: 18px; color: #1e40af;'><strong>Medicine:</strong> {$safeMed}</p>
                <p style='margin: 8px 0; font-size: 16px;'><strong>Dosage:</strong> {$safeDose}</p>
                <p style='margin: 8px 0; font-size: 16px;'><strong>Frequency:</strong> {$safeFreq}</p>
                <p style='margin: 12px 0 4px; font-weight: 700;'>Today's dose times:</p>
                {$timesHumanHtml}
            </div>
            <p>Use the times above for when to take this medicine.</p>
            <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
            <p style='font-size: 12px; color: #888; text-align: center;'>&copy; " . date('Y') . " Med-Alert-Plus</p>
        </div>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Daily digest mail failed: {$mail->ErrorInfo}");
        return false;
    }
}

/**
 * Generic notice from admin actions (profile update / account removal).
 */
function sendAdminAccountEmail(string $toEmail, string $recipientName, string $subject, string $htmlBody): bool
{
    if (!class_exists(PHPMailer::class)) {
        error_log("Admin mail (no PHPMailer): {$subject} -> {$toEmail}");
        return false;
    }

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = MAIL_PORT;

        $mail->setFrom(MAIL_USERNAME, 'Med-Alert-Plus Admin');
        $mail->addAddress($toEmail, $recipientName);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Admin account mail failed: {$mail->ErrorInfo}");
        return false;
    }
}
?>
