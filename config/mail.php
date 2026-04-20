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
function sendMedicineReminder($toEmail, $patientName, $medicineName, $dosage, $scheduledTimeLabel = null, $instructions = null, $colorHex = '#3b82f6') {
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
            
        $instrHtml = $instructions 
            ? "<p style='margin: 8px 0; font-size: 14px; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #dee2e6; color: #495057;'><strong>Instruction:</strong> " . htmlspecialchars($instructions) . "</p>" 
            : '';

        $borderCol = !empty($colorHex) ? $colorHex : '#3b82f6';
        
        $mail->Body    = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid {$borderCol}; border-radius: 12px; border-left: 8px solid {$borderCol};'>
            <h2 style='color: #1e40af; text-align: center;'>Medication Reminder</h2>
            <p>Hello <strong>" . htmlspecialchars($patientName) . "</strong>,</p>
            <p>This is a friendly reminder to take your medication as scheduled.</p>
            <div style='background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;'>
                <p style='margin: 0; font-size: 18px; color: #1e40af;'><strong>Medicine:</strong> " . htmlspecialchars($medicineName) . "</p>
                <p style='margin: 5px 0; font-size: 16px;'><strong>Dosage:</strong> " . htmlspecialchars($dosage) . "</p>
                {$timeHtml}
                {$instrHtml}
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
function sendMedicineDailyDigestEmail(string $toEmail, string $patientName, string $medicineName, string $dosage, string $frequencyLabel, string $timesHumanHtml, $instructions = null, $colorHex = '#3b82f6'): bool
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
        
        $instrHtml = $instructions 
            ? "<p style='margin: 8px 0; font-size: 14px; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #dee2e6; color: #495057;'><strong>Instruction:</strong> " . htmlspecialchars($instructions) . "</p>" 
            : '';

        $borderCol = !empty($colorHex) ? $colorHex : '#3b82f6';

        $mail->isHTML(true);
        $mail->Subject = "Daily plan: {$medicineName}";
        $mail->Body = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid {$borderCol}; border-radius: 12px; border-left: 8px solid {$borderCol};'>
            <h2 style='color: #1e40af; text-align: center;'>Today's medication schedule</h2>
            <p>Hello <strong>{$safeName}</strong>,</p>
            <p>Your daily email summary — sent only at your chosen set time.</p>
            <div style='background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;'>
                <p style='margin: 0; font-size: 18px; color: #1e40af;'><strong>Medicine:</strong> {$safeMed}</p>
                <p style='margin: 8px 0; font-size: 16px;'><strong>Dosage:</strong> {$safeDose}</p>
                {$timesHumanHtml}
                {$instrHtml}
            </div>
            <p>Remember to take your dose on time today.</p>
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
        error_log("Admin mail failed: {$mail->ErrorInfo}");
        return false;
    }
}

function sendAppointmentUpdateEmail(string $toEmail, string $recipientName, string $title, string $message): bool
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

        $mail->setFrom(MAIL_USERNAME, 'Med-Alert-Plus');
        $mail->addAddress($toEmail, $recipientName);

        $mail->isHTML(true);
        $mail->Subject = $title;
        
        $safeName = htmlspecialchars($recipientName, ENT_QUOTES, 'UTF-8');
        $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $safeMsg = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

        $mail->Body = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
            <h2 style='color: #1e40af; text-align: center;'>{$safeTitle}</h2>
            <p>Hello <strong>{$safeName}</strong>,</p>
            <div style='background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; line-height: 1.6;'>
                {$safeMsg}
            </div>
            <p>You can view more details by logging into your dashboard.</p>
            <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
            <p style='font-size: 12px; color: #888; text-align: center;'>&copy; " . date('Y') . " Med-Alert-Plus</p>
        </div>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Appointment update mail failed: {$mail->ErrorInfo}");
        return false;
    }
}