<?php
session_start();
header('Content-Type: application/json');

/**
 * Advanced Symptom Logic
 * Providing disease prediction, medicines, and home remedies based on symptoms.
 */

$action = $_POST['action'] ?? '';

if ($action === 'get_diagnosis') {
    $symptomsRaw = $_POST['symptoms'] ?? ''; // Expecting comma-separated or JSON array
    if (empty($symptomsRaw)) {
        echo json_encode(['success' => false, 'message' => 'No symptoms provided.']);
        exit;
    }

    $symptoms = is_array($symptomsRaw) ? $symptomsRaw : explode(',', strtolower($symptomsRaw));
    $symptoms = array_map('trim', $symptoms);

    // Rule-based knowledge base
    $database = [
        [
            'trigger' => ['fever', 'cough', 'sore throat'],
            'disease' => 'Common Cold / Flu',
            'medicines' => 'Paracetamol, Cough Syrup, Vitamin C',
            'home_remedies' => 'Warm salt water gargle, ginger tea, plenty of rest, and hydration.'
        ],
        [
            'trigger' => ['headache', 'nausea', 'sensitivity to light'],
            'disease' => 'Migraine',
            'medicines' => 'Ibuprofen, Naproxen, Sumatriptan',
            'home_remedies' => 'Rest in a dark, quiet room; apply a cold compress to your forehead.'
        ],
        [
            'trigger' => ['stomach pain', 'diarrhea', 'bloating'],
            'disease' => 'Gastroenteritis',
            'medicines' => 'Loperamide, ORS (Oral Rehydration Salts)',
            'home_remedies' => 'Drink clear fluids, eat bland foods like bananas and rice (BRAT diet).'
        ],
        [
            'trigger' => ['back pain', 'stiffness', 'muscle ache'],
            'disease' => 'Muscle Strain',
            'medicines' => 'Muscle relaxants, Pain relievers',
            'home_remedies' => 'Ice pack for first 48 hours, then heat; gentle stretching.'
        ],
        [
            'trigger' => ['shortness of breath', 'wheezing', 'chest tightness'],
            'disease' => 'Asthma / Bronchitis',
            'medicines' => 'Inhalers (Albuterol), Bronchodilators',
            'home_remedies' => 'Stay away from smoke/dust, use a humidifier.'
        ],
        [
            'trigger' => ['skin rash', 'itching', 'redness'],
            'disease' => 'Dermatitis / Allergic Reaction',
            'medicines' => 'Antihistamines, Cetirizine, Hydrocortisone cream',
            'home_remedies' => 'Cool oatmeal bath, avoid scratching, use mild soap.'
        ]
    ];

    $bestMatch = null;
    $maxMatches = 0;

    foreach ($database as $entry) {
        $matches = count(array_intersect($symptoms, $entry['trigger']));
        if ($matches > $maxMatches) {
            $maxMatches = $matches;
            $bestMatch = $entry;
        }
    }

    if ($bestMatch && $maxMatches > 0) {
        echo json_encode([
            'success' => true,
            'disease' => $bestMatch['disease'],
            'medicines' => $bestMatch['medicines'],
            'home_remedies' => $bestMatch['home_remedies'],
            'confidence' => ($maxMatches / count($bestMatch['trigger'])) * 100 . '%'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'disease' => 'Unknown Condition',
            'medicines' => 'Please consult a professional doctor.',
            'home_remedies' => 'Rest and monitor your symptoms closely.',
            'confidence' => '0%'
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}
