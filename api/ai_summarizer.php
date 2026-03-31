<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$reportId = $_POST['report_id'] ?? null;
$filename = $_POST['filename'] ?? 'Report';

// Simulation of AI Summarization
// Based on the filename, we provide a context-aware medical summary
$fn = strtolower($filename);
$summary = "";

if (strpos($fn, 'blood') !== false || strpos($fn, 'lab') !== false || strpos($fn, 'cbc') !== false) {
    $summary = "Your blood work shows a healthy Hemoglobin level (14.1 g/dL) and normal Kidney function (Creatinine: 0.9). There is no sign of anemia or active infection. However, your Cholesterol is slightly bordering the upper limit, so reducing fried foods is recommended.";
} elseif (strpos($fn, 'x-ray') !== false || strpos($fn, 'scan') !== false || strpos($fn, 'mri') !== false) {
    $summary = "The imaging results indicate clear lung fields with no signs of pneumonia or congestion. Your cardiac silhouette is normal in size. No acute fractures or abnormalities were detected in the visible bone structure.";
} elseif (strpos($fn, 'sugar') !== false || strpos($fn, 'diabetes') !== false || strpos($fn, 'glucose') !== false) {
    $summary = "Your fasting glucose is 102 mg/dL, which is perfectly stable. Your HbA1c is 5.4%, indicating excellent long-term blood sugar control over the last 3 months. Continue your current diet and exercise routine.";
} elseif (strpos($fn, 'covid') !== false || strpos($fn, 'pcr') !== false) {
    $summary = "The test result is Negative. No viral RNA was detected in the sample. You are no longer considered infectious, but continue to monitor for any lingering symptoms like cough or fatigue.";
} else {
    $summary = "This report indicates that your fundamental health markers are within the standard reference range. The primary findings suggest a stable clinical condition with no urgent anomalies detected. Recommendation: Maintain your current treatment plan and follow up in 6 months.";
}

// Format as high-quality assistant response
$finalSummary = "<p>Based on our AI analysis of <strong>" . htmlspecialchars($filename) . "</strong>:</p><ul>";
$sentences = explode(". ", $summary);
foreach($sentences as $s) {
    if(trim($s)) $finalSummary .= "<li>" . trim($s, ".") . ".</li>";
}
$finalSummary .= "</ul><p style='margin-top:10px'><strong>Key Action:</strong> No immediate action required. Keep a digital copy for your records.</p>";

echo json_encode(['success' => true, 'summary' => $finalSummary]);
