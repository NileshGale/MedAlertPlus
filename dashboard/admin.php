<?php
session_start();
require_once '../config/db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    header("Location: ../index.html");
    exit;
}

$userName = $_SESSION['user_name'];

// 1. Stats
$totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$totalDoc = $pdo->query("SELECT COUNT(*) FROM doctors")->fetchColumn();
$pendingDoc = $pdo->query("SELECT COUNT(*) FROM doctors WHERE approval_status='pending'")->fetchColumn();

// 2. Pending Doctors
$pendingDoctors = $pdo->query("SELECT d.*, u.name, u.email, u.phone FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.approval_status = 'pending' ORDER BY u.created_at DESC")->fetchAll();

// 3. User Statistics for Charts
$patientCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role='patient'")->fetchColumn();
$doctorCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role='doctor'")->fetchColumn();

?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard — Med Alert Plus</title>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
:root {
  --primary: #1e40af; --primary-light: #3b82f6; --success: #10b981; --warning: #f59e0b;
  --danger: #ef4444; --text: #1e293b; --text-light: #475569; --muted: #94a3b8;
  --bg: #f8fafc; --sidebar-bg: #0f172a; --card: #ffffff; --border: #e2e8f0;
  --sidebar-w: 280px; --header-h: 72px; --rs: 12px; --transition: .25s ease;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Figtree', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
.dashboard-layout { display: flex; min-height: 100vh; }
.sidebar {
  width: var(--sidebar-w); background: var(--sidebar-bg); color: #fff;
  position: fixed; top: 0; bottom: 0; left: 0; z-index: 1000;
  display: flex; flex-direction: column; transition: transform var(--transition);
}
.sidebar-brand { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); text-decoration: none; color: #fff; }
.sb-logo-icon { width: 40px; height: 40px; background: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 10px; }
.sidebar-user { padding: 20px 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.su-avatar { width: 40px; height: 40px; background: linear-gradient(135deg,#EF4444,#DC2626); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; }
.main-content { flex: 1; margin-left: var(--sidebar-w); transition: margin var(--transition); }
.top-bar { height: var(--header-h); background: var(--card); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; position: sticky; top: 0; z-index: 900; }
.page-title { font-weight: 800; font-size: 20px; color: var(--text); }
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 32px; }
.stat-card { background: var(--card); padding: 24px; border-radius: var(--rs); border: 1px solid var(--border); display: flex; align-items: center; gap: 20px; }
.stat-num { font-size: 24px; font-weight: 800; }
.card { background: var(--card); border-radius: var(--rs); border: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; margin-bottom: 24px; }
.card-header { padding: 16px 24px; border-bottom: 1px solid var(--border); font-weight: 700; }
.card-body { padding: 24px; }
.badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
.badge-info { background: #dbeafe; color: #1e40af; }
.badge-purple { background: #f3e8ff; color: #7e22ce; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 12px 16px; border-bottom: 2px solid var(--border); color: var(--muted); font-size: 11px; text-transform: uppercase; }
td { padding: 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
.sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
.logout-btn {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  width: 100%; border-radius: 8px; color: #fca5a5; text-decoration: none;
  font-size: 14px; font-weight: 600; transition: 0.2s; background: rgba(239,68,68,0.1);
}
.logout-btn:hover { background: rgba(239,68,68,0.2); color: #f87171; }
</style>
</head>
<body>
<div class="dashboard-layout">
<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand"><div class="sb-logo-icon"><i class="fas fa-shield-heart"></i></div><div class="sb-logo-text"><span class="name">Med Alert</span><span class="tag">Admin Panel</span></div></div>
  <div class="sidebar-user"><div class="su-avatar">A</div><div class="su-info"><div class="su-name"><?= htmlspecialchars($userName) ?></div><div class="su-role">System Administrator</div></div></div>
  <nav class="sidebar-nav">
    <button class="nav-item active" onclick="showTab('overview')"><i class="fas fa-tachometer-alt"></i> Overview</button>
    <button class="nav-item" onclick="showTab('approvals')"><i class="fas fa-user-check"></i> Pending Approvals <span class="badge badge-danger"><?= $pendingDoc ?></span></button>
    <button class="nav-item" onclick="showTab('registrations')"><i class="fas fa-users"></i> User Management</button>
  </nav>
  <div class="sidebar-footer">
    <button class="nav-item" onclick="showTab('reports')"><i class="fas fa-file-pdf"></i> Reports</button>
    <a href="../auth/auth.php?action=logout_get" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
  </div>
</aside>
<div class="main-content">
  <header class="top-bar">
    <div class="page-title">Admin Control Center</div>
    <div class="top-bar-right"><button class="theme-btn" onclick="toggleTheme()"><i class="fas fa-moon"></i></button></div>
  </header>
  <div class="page-content">
    <!-- Overview Tab -->
    <div class="tab-pane active" id="tab-overview">
      <div class="stats-row">
        <div class="stat-card"><div class="stat-icon" style="background:#eff6ff;color:#3b82f6"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-num"><?= $totalUsers ?></div><div class="stat-label">Total Users</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#ecfdf5;color:#10b981"><i class="fas fa-user-md"></i></div><div class="stat-info"><div class="stat-num"><?= $totalDoc ?></div><div class="stat-label">Doctors</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:#fff7ed;color:#f59e0b"><i class="fas fa-user-clock"></i></div><div class="stat-info"><div class="stat-num"><?= $pendingDoc ?></div><div class="stat-label">Pending Approval</div></div></div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:24px;">
         <div class="card">
            <div class="card-header">User Distribution</div>
            <div class="card-body">
               <canvas id="userDistChart" height="300"></canvas>
            </div>
         </div>
         <div class="card">
            <div class="card-header">Doctor Approvals Quick View</div>
            <div class="card-body">
               <?php foreach(array_slice($pendingDoctors, 0, 5) as $pd): ?>
                  <div style="display:flex;align-items:center;gap:15px;padding:12px 0;border-bottom:1px solid var(--border)">
                     <div style="flex:1">
                        <div style="font-weight:700">Dr. <?= htmlspecialchars($pd['name']) ?></div>
                        <div style="font-size:12px;color:var(--muted)"><?= htmlspecialchars($pd['specialization']) ?></div>
                     </div>
                     <button class="btn btn-primary btn-sm" onclick="showTab('approvals')">Review</button>
                  </div>
               <?php endforeach; if(empty($pendingDoctors)) echo '<div class="empty-state">No pending approvals</div>'; ?>
            </div>
         </div>
      </div>
    </div>

    <!-- Approvals Tab -->
    <div class="tab-pane" id="tab-approvals">
       <div class="card">
          <div class="card-header">Pending Doctor Registrations</div>
          <div class="card-body">
             <table>
                <thead><tr><th>Name</th><th>Specialization</th><th>License</th><th>Contact</th><th>Actions</th></tr></thead>
                <tbody>
                   <?php foreach($pendingDoctors as $pd): ?>
                      <tr>
                         <td><strong>Dr. <?= htmlspecialchars($pd['name']) ?></strong><br><small><?= $pd['email'] ?></small></td>
                         <td><?= htmlspecialchars($pd['specialization']) ?></td>
                         <td><code style="background:#f1f5f9;padding:2px 5px;border-radius:4px"><?= htmlspecialchars($pd['license_number']) ?></code></td>
                         <td><?= htmlspecialchars($pd['phone']) ?></td>
                         <td>
                            <div style="display:flex;gap:10px">
                               <button class="btn" style="background:#10b981;color:#fff" onclick="adminAction('approve_doctor', {doctor_id:<?= $pd['id'] ?>, user_id:<?= $pd['user_id'] ?>})">Approve</button>
                               <button class="btn" style="background:#ef4444;color:#fff" onclick="adminAction('reject_doctor', {doctor_id:<?= $pd['id'] ?>, user_id:<?= $pd['user_id'] ?>})">Reject</button>
                            </div>
                         </td>
                      </tr>
                   <?php endforeach; if(empty($pendingDoctors)) echo '<tr><td colspan="5" class="empty-state">No pending doctor registrations</td></tr>'; ?>
                </tbody>
             </table>
          </div>
       </div>
    </div>

    <!-- User Management Tab -->
    <div class="tab-pane" id="tab-registrations">
       <div class="card">
          <div class="card-header">
             <span>Registered Users</span>
             <div style="display:flex;gap:10px">
                <select id="userFilterRole" onchange="loadUserList()" style="padding:5px 10px;border-radius:8px;border:1px solid var(--border)">
                   <option value="all">All Roles</option>
                   <option value="doctor">Doctors</option>
                   <option value="patient">Patients</option>
                </select>
                <button class="btn btn-primary" onclick="downloadUserList()"><i class="fas fa-download"></i> PDF Report</button>
             </div>
          </div>
          <div class="card-body" id="userManagementTable">
             <!-- AJAX Loaded -->
              <div class="empty-state">Loading user list...</div>
          </div>
       </div>
    </div>

    <!-- Reports Tab -->
    <div class="tab-pane" id="tab-reports">
       <div class="card">
          <div class="card-header">System Reports</div>
          <div class="card-body">
             <div class="empty-state">Generate and download comprehensive health and system usage reports.</div>
          </div>
       </div>
    </div>
  </div>
</div>
</div>
<script src="../assets/js/dashboard.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
   const ctx = document.getElementById('userDistChart').getContext('2d');
   new Chart(ctx, {
      type: 'doughnut',
      data: {
         labels: ['Patients', 'Doctors'],
         datasets: [{
            data: [<?= $patientCount ?>, <?= $doctorCount ?>],
            backgroundColor: ['#8b5cf6', '#3b82f6'],
            borderWidth: 0
         }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
   });
});
</script>
</body>
</html>
