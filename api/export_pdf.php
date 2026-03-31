<?php
/**
 * Med-Alert-Plus User List Export (Print/PDF)
 * This script generates a clean, printable HTML table that can be saved as PDF.
 */
session_start();
require_once '../config/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    die("Unauthorized access.");
}

$role = $_GET['role'] ?? 'all';
$sql = "SELECT name, email, phone, role, status, created_at FROM users";
$params = [];

if ($role !== 'all') {
    $sql .= " WHERE role = ?";
    $params[] = $role;
}
$sql .= " ORDER BY created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll();

$reportTitle = "User Registration Report — " . ($role === 'all' ? 'All Roles' : ucfirst($role) . 's');
$generatedAt = date('Y-m-d H:i:s');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export PDF | Med-Alert-Plus</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; color: #333; margin: 0; padding: 40px; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
        .header h1 { color: #1e40af; margin: 0 0 5px 0; }
        .header p { color: #666; margin: 0; font-size: 0.9rem; }
        
        .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 0.85rem; color: #555; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f8fafc; color: #1e40af; text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-size: 0.85rem; text-transform: uppercase; }
        td { padding: 12px; border: 1px solid #e2e8f0; font-size: 0.9rem; }
        tr:nth-child(even) { background-color: #fdfdfd; }
        
        .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
        .badge-patient { background: #f3e8ff; color: #7e22ce; }
        .badge-doctor { background: #dbeafe; color: #1e40af; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        
        .footer { margin-top: 50px; font-size: 0.8rem; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        
        @media print {
            .no-print { display: none; }
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">🖨️ Print / Save as PDF</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #eee; border: none; border-radius: 8px; cursor: pointer; margin-left: 10px;">Close</button>
    </div>

    <div class="header">
        <h1>Med-Alert-Plus</h1>
        <p>Advanced Medical Management System</p>
    </div>

    <div class="meta">
        <div><strong>Report:</strong> <?= $reportTitle ?></div>
        <div><strong>Generated At:</strong> <?= $generatedAt ?></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($users as $user): ?>
                <tr>
                    <td><strong><?= htmlspecialchars($user['name']) ?></strong></td>
                    <td><?= htmlspecialchars($user['email']) ?></td>
                    <td><?= htmlspecialchars($user['phone'] ?: 'N/A') ?></td>
                    <td><span class="badge badge-<?= $user['role'] ?>"><?= ucfirst($user['role']) ?></span></td>
                    <td><span class="badge badge-<?= $user['status'] ?>"><?= ucfirst($user['status']) ?></span></td>
                    <td><?= date('M d, Y', strtotime($user['created_at'])) ?></td>
                </tr>
            <?php endforeach; if (empty($users)) echo '<tr><td colspan="6" style="text-align:center">No users found.</td></tr>'; ?>
        </tbody>
    </table>

    <div class="footer">
        Confidential Report — &copy; <?= date('Y') ?> Med-Alert-Plus Platform.
    </div>

    <script>
        // Auto-open print dialog
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
