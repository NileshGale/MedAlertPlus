// ============================================================
// assets/js/dashboard.js — Shared Dashboard Utilities
// ============================================================

// ---- Custom Confirm Modal (replaces native confirm()) ----
function showConfirm(message, { confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' } = {}) {
  return new Promise((resolve) => {
    // Remove any existing modal
    document.getElementById('customConfirmOverlay')?.remove();

    const colors = { warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6' };
    const icons = { warning: 'exclamation-triangle', danger: 'trash-alt', info: 'info-circle' };
    const accentColor = colors[type] || colors.warning;
    const iconName = icons[type] || icons.warning;

    const overlay = document.createElement('div');
    overlay.id = 'customConfirmOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;animation:confirmFadeIn .2s ease';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;box-shadow:0 24px 48px rgba(0,0,0,0.15);text-align:center;animation:confirmSlideIn .25s ease">
        <div style="width:56px;height:56px;border-radius:50%;background:${accentColor}15;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <i class="fas fa-${iconName}" style="font-size:24px;color:${accentColor}"></i>
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#1e293b;margin-bottom:8px">Are you sure?</h3>
        <p style="font-size:14px;color:#64748b;line-height:1.5;margin-bottom:24px">${message}</p>
        <div style="display:flex;gap:12px;justify-content:center">
          <button id="confirmCancel" style="flex:1;padding:10px 20px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s">${cancelText}</button>
          <button id="confirmOk" style="flex:1;padding:10px 20px;border-radius:10px;border:none;background:${accentColor};color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 12px ${accentColor}40">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Add animations via a style tag if not already present
    if (!document.getElementById('confirmModalStyles')) {
      const style = document.createElement('style');
      style.id = 'confirmModalStyles';
      style.textContent = `
        @keyframes confirmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes confirmSlideIn { from { opacity: 0; transform: scale(0.95) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        #confirmCancel:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; }
        #confirmOk:hover { filter: brightness(1.1); transform: translateY(-1px); }
      `;
      document.head.appendChild(style);
    }

    const cleanup = (result) => { overlay.remove(); resolve(result); };
    overlay.querySelector('#confirmOk').addEventListener('click', () => cleanup(true));
    overlay.querySelector('#confirmCancel').addEventListener('click', () => cleanup(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { cleanup(false); document.removeEventListener('keydown', handler); }
      if (e.key === 'Enter') { cleanup(true); document.removeEventListener('keydown', handler); }
    });
  });
}

/** Patient overview stat cards → tab + optional appointment filter */
function patientOverviewStatGo(target) {
  if (target === 'medicines') {
    showTab('medicines');
    return;
  }
  if (target === 'symptoms') {
    showTab('symptoms');
    return;
  }
  const statusSel = document.getElementById('patientAppointmentStatusFilter');
  if (target === 'appointments-pending') {
    if (statusSel) statusSel.value = 'pending';
    showTab('appointments');
    return;
  }
  if (target === 'appointments-all') {
    if (statusSel) statusSel.value = 'all';
    showTab('appointments');
  }
}

// ---- Tab Navigation ----
function showTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pane = document.getElementById('tab-' + name);
  if (pane) pane.classList.add('active');

  const titles = {
    overview: ['Dashboard Overview', 'Welcome back!'],
    appointments: ['My Appointments', 'View and manage your appointments'],
    medicines: ['Medicine Reminders', 'Manage your daily medication schedule'],
    symptoms: ['AI Symptom Checker', 'Describe your symptoms for analysis'],
    clinics: ['Find Nearby Clinics', 'Search and locate clinics near you'],
    reports: ['System Reporting & Insights', 'Analytics and emergency logs overview'],
    analytics: ['Health Analytics', 'Log and visualize your vital trends'],
    profile: ['My Profile', 'Update your personal information'],
    approvals: ['Doctor Approvals', 'Review pending doctor registrations'],
    doctors: ['Manage Doctors', 'All registered doctors'],
    patients: ['Manage Patients', 'All registered patients'],
    registrations: ['Recent Registrations', 'New user registrations with filters'],
    schedule: ['My Schedule', 'Set your weekly availability'],
    admin_patients: ['All patients', 'Directory — update or remove accounts'],
    admin_doctors: ['All doctors', 'Directory — update or remove accounts'],
  };
  const [title, sub] = titles[name] || ['Dashboard', ''];
  const titleEl = document.getElementById('pageTitle');
  const subEl   = document.getElementById('pageSubtitle');
  if (titleEl) titleEl.textContent = title;
  if (subEl)   subEl.textContent   = sub;

  // Mark nav active
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('onclick') === `showTab('${name}')`) {
      btn.classList.add('active');
    }
  });

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar')?.classList.remove('open');
  }

  // Load specific data per tab
  if (name === 'medicines') loadMedicines();
  if (name === 'analytics') loadHealthAnalytics();
  if (name === 'appointments') {
    if (document.getElementById('patientAppointmentsList')) loadPatientAppointments();
    if (document.getElementById('doctorAppointmentsList')) loadDoctorAppointments();
  }
  if (name === 'reports' && document.getElementById('patientReportsList')) loadPatientReports();
  if (name === 'profile') {
    if (document.getElementById('patientProfileForm')) loadPatientProfile();
    if (document.getElementById('doctorProfileForm')) loadDoctorProfile();
  }
  if (name === 'schedule' && document.getElementById('doctorScheduleRows')) loadDoctorSchedule();
  if (name === 'patients' && document.getElementById('doctorPatientsList')) loadDoctorPatients();
  if (name === 'approvals' && document.getElementById('adminApprovalsTableBody')) loadAdminApprovals();
  if (name === 'admin_patients' && document.getElementById('adminPatientsTableBody')) loadAdminPatientsList();
  if (name === 'admin_doctors' && document.getElementById('adminDoctorsTableBody')) loadAdminDoctorsList();
  if (name === 'reports') {
    if (document.getElementById('patientReportsList')) loadPatientReports();
    if (document.getElementById('adminSosLogsTableBody')) loadAdminReports();
  }
}

// ---- Sidebar Toggle ----
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  // Clear existing toasts to ensure only one is shown at a time
  container.innerHTML = '';

  const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-circle', info: 'info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type === 'error' ? 'error' : type}`;
  toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> <span style="flex:1; word-break:break-word;">${message}</span> <i class="fas fa-times" style="cursor:pointer; opacity:0.6; font-size:16px; padding:4px;" onclick="this.closest('.toast').remove()" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'"></i>`;
  container.appendChild(toast);
  setTimeout(() => { if (document.body.contains(toast)) { toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)'; setTimeout(() => { if (document.body.contains(toast)) toast.remove(); }, 300); } }, 3500);
}

function formatApptTimeDisplay(t) {
  if (t == null || t === '') return '';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

// ---- Alert Helper ----
function showAlert(el, msg, type) {
  if (!el) return;
  el.className = 'alert alert-' + type;
  el.innerHTML = msg;
  el.style.display = 'flex';
  if (type === 'success') setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
}

// ---- Password Toggle ----
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn?.querySelector('i');
  if (!input) return;
  if (input.type === 'password') { input.type = 'text'; if (icon) icon.className = 'fas fa-eye-slash'; }
  else { input.type = 'password'; if (icon) icon.className = 'fas fa-eye'; }
}

// ---- Close on outside click ----
document.addEventListener('click', (e) => {
  const panel  = document.getElementById('notifPanel');
  const notifBtn = document.querySelector('.notif-btn');
  if (panel && notifBtn && !panel.contains(e.target) && !notifBtn.contains(e.target)) {
    panel.style.display = 'none';
  }
  const sidebar = document.getElementById('sidebar');
  const ham     = document.querySelector('.hamburger');
  if (window.innerWidth <= 768 && sidebar && ham && !sidebar.contains(e.target) && !ham.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// ---- Keyboard shortcuts ----
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    const panel = document.getElementById('notifPanel');
    if (panel) panel.style.display = 'none';
  }
});
// ---- Theme Management ----
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', target);
  localStorage.setItem('medalert_theme', target);
  const icon = document.querySelector('#themeToggle i');
  if (icon) icon.className = target === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  
  // Re-run health analytics if tab is active to update chart colors
  if (document.getElementById('tab-analytics')?.classList.contains('active')) {
      loadHealthAnalytics();
  }
}

function initTheme() {
  const saved = localStorage.getItem('medalert_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const icon = document.querySelector('#themeToggle i');
  if (icon) icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}
document.addEventListener('DOMContentLoaded', initTheme);

// ---- Emergency SOS ----
async function triggerSOS() {
  if (!await showConfirm('This will alert your emergency contacts and nearby doctors.', { confirmText: 'Send SOS', type: 'danger' })) return;
  
  showToast('Fetching location...', 'info');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    try {
      const res = await fetch('../api/sos_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=trigger_sos&lat=${latitude}&lng=${longitude}`
      });
      const data = await res.json();
      if (data.success) {
        showToast('EMERGENCY ALERT SENT! Help is on the way.', 'success');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Connection error. Please call emergency services.', 'error');
    }
  }, (err) => {
    showToast('Location access needed for better help. Sending alert without GPS...', 'warning');
    triggerSOSNoGps();
  });
}

async function triggerSOSNoGps() {
  const res = await fetch('../api/sos_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `action=trigger_sos`
  });
  const data = await res.json();
  if (data.success) showToast('EMERGENCY ALERT SENT (without GPS)!', 'success');
}

// ---- Patient: Medicine Reminders ----

function selectMedType(type, el) {
  document.getElementById('medTypeInput').value = type;
  document.querySelectorAll('.med-type-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function selectMedColor(color, el) {
  document.getElementById('medColorInput').value = color;
  document.querySelectorAll('.color-dot').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function toggleMedInstr(instr, el) {
  const input = document.getElementById('medInstrInput');
  let current = input.value ? input.value.split(', ') : [];
  if (current.includes(instr)) {
    current = current.filter(i => i !== instr);
    el.classList.remove('active');
  } else {
    current.push(instr);
    el.classList.add('active');
  }
  input.value = current.join(', ');
}

const medForm = document.getElementById('medicineForm');
if (medForm) {
  const emailDailyRow = document.getElementById('emailDailyTimeRow');
  const emailSendCb = medForm.querySelector('input[name="send_email"]');
  const syncEmailDailyRow = () => {
    if (emailDailyRow) emailDailyRow.style.display = emailSendCb?.checked ? 'block' : 'none';
  };
  emailSendCb?.addEventListener('change', syncEmailDailyRow);
  syncEmailDailyRow();

  medForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(medForm);
    const timeVal = formData.get('medication_time');
    formData.set('reminder_times', JSON.stringify(timeVal ? [timeVal] : []));
    
    try {
      const res = await fetch('../api/patient_api.php', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        medForm.reset();
        const emailDaily = document.getElementById('medicineEmailDailyTime');
        const reminderEmail = document.getElementById('medicineReminderEmail');
        if (emailDaily) emailDaily.value = '';
        if (reminderEmail) reminderEmail.value = '';
        const emailCb = medForm.querySelector('input[name="send_email"]');
        if (emailCb) emailCb.checked = true;
        loadMedicines();
      } else showToast(data.message, 'error');
    } catch (err) { showToast('Server error', 'error'); }
  });
}

async function loadMedicines() {
  const list = document.getElementById('medicineList');
  if (!list) return;
  try {
    const res = await fetch('../api/dashboard_data.php?type=medicines');
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) { list.innerHTML = '<div class="empty-state">No reminders set.</div>'; return; }
      const summaryHtml = document.getElementById('adherenceSummary')?.outerHTML || '';
      list.innerHTML = data.data.map(m => {
        let typeIcon = 'fa-pills';
        if (m.medicine_type === 'syrup') typeIcon = 'fa-prescription-bottle';
        else if (m.medicine_type === 'capsule') typeIcon = 'fa-capsules';
        else if (m.medicine_type === 'injection') typeIcon = 'fa-syringe';

        const color = m.color_tag || '#3b82f6';
        const timesArr = JSON.parse(m.reminder_times || '[]');
        
        let courseInfo = '';
        if (m.start_date) {
            const start = new Date(m.start_date);
            const today = new Date();
            const diffTime = Math.abs(today - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            courseInfo = `Day ${diffDays}`;
            if (m.end_date) {
                const end = new Date(m.end_date);
                const totalTime = Math.abs(end - start);
                const totalDays = Math.ceil(totalTime / (1000 * 60 * 60 * 24));
                courseInfo += ` of ${totalDays}`;
            }
        }

        return `
        <div style="padding:16px; border:1px solid var(--border); border-radius:16px; margin-bottom:16px; background:var(--card); position:relative; overflow:hidden; transition:0.3s;" onmouseover="this.style.borderColor='${color}'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="position:absolute; top:0; left:0; height:100%; width:4px; background:${color}"></div>
          
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:15px;">
            <div style="display:flex; gap:15px; align-items:flex-start;">
              <div style="width:44px; height:44px; border-radius:10px; background:${color}15; color:${color}; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">
                <i class="fas ${typeIcon}"></i>
              </div>
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="font-weight:750; font-size:16px; color:var(--text);">${m.medicine_name}</div>
                    ${courseInfo ? `<span style="font-size:10px; font-weight:700; background:var(--bg); padding:2px 8px; border-radius:10px; color:var(--muted);">${courseInfo}</span>` : ''}
                </div>
                <div style="font-size:13px; color:var(--muted); margin-top:2px;">
                    <strong>${m.dosage}</strong> · ${m.frequency.toUpperCase()}
                </div>
                
                <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
                    ${timesArr.map(t => `<span style="font-size:11px; font-weight:700; color:var(--primary); background:var(--primary-light); padding:2px 8px; border-radius:6px;"><i class="far fa-clock"></i> ${t}</span>`).join('')}
                    ${m.instructions ? `<span style="font-size:11px; font-weight:700; color:#0369a1; background:#f0f9ff; padding:2px 8px; border-radius:6px;"><i class="fas fa-info-circle"></i> ${m.instructions}</span>` : ''}
                </div>

                <div style="margin-top:10px; font-size:12px; font-weight:600; display:flex; align-items:center; gap:6px; color:${m.today_status === 'taken' ? 'var(--success)' : (m.today_status === 'skipped' ? 'var(--danger)' : 'var(--muted)')}">
                  <i class="fas fa-${m.today_status === 'taken' ? 'check-circle' : (m.today_status === 'skipped' ? 'times-circle' : 'circle')}"></i>
                  Today: ${m.today_status ? m.today_status.toUpperCase() : 'NOT MARKED YET'}
                </div>
              </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="btn" onclick="markMedicineAdherence(${m.id}, 'taken')" style="background:#ecfdf5; color:#166534; border:none; padding:8px 12px; font-size:12px;"><i class="fas fa-check"></i> Taken</button>
              <button class="btn" onclick="markMedicineAdherence(${m.id}, 'skipped')" style="background:#fff7ed; color:#92400e; border:none; padding:8px 12px; font-size:12px;"><i class="fas fa-forward"></i> Skip</button>
              <button class="btn" onclick="deleteMedicine(${m.id}, '${m.medicine_name.replace(/'/g, "\\'")}')" style="background:rgba(239,68,68,0.05); color:var(--danger); border:none; width:100%;"><i class="fas fa-trash"></i></button>
            </div>
          </div>

          ${m.notes ? `<div style="margin-top:12px; padding:10px; background:var(--bg); border-radius:8px; font-size:12px; color:var(--text-light); font-style:italic;">"${m.notes}"</div>` : ''}
        </div>
        `;
      }).join('');
      if (summaryHtml) {
        list.innerHTML = summaryHtml + list.innerHTML;
      }
      loadMedicineAdherenceSummary();
    }
  } catch (err) {}
}

async function loadMedicineAdherenceSummary() {
  try {
    const res = await fetch('../api/dashboard_data.php?type=medicine_adherence_summary');
    const json = await res.json();
    if (!json.success) return;
    const d = json.data || { taken: 0, skipped: 0, weekly_rate: 0 };
    const html = `<strong>Weekly Adherence:</strong> ${d.weekly_rate}% · Taken: ${d.taken} · Skipped: ${d.skipped}`;
    const el = document.getElementById('adherenceSummary');
    const overviewEl = document.getElementById('overviewAdherenceSummary');
    if (el) el.innerHTML = html;
    if (overviewEl) overviewEl.innerHTML = html;
  } catch (e) {}
}

async function markMedicineAdherence(reminderId, status) {
  const body = new URLSearchParams({
    action: 'mark_medicine_adherence',
    reminder_id: String(reminderId),
    status
  }).toString();
  try {
    const res = await fetch('../api/patient_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const json = await res.json();
    if (json.success) {
      showToast('Adherence saved', 'success');
      loadMedicines();
    } else {
      showToast(json.message || 'Update failed', 'error');
    }
  } catch (e) {
    showToast('Server error', 'error');
  }
}

async function loadPatientNotifications() {
  const list = document.getElementById('notifList');
  const badge = document.getElementById('notifBadge');
  const deleteAllBtn = document.getElementById('notifDeleteAllBtn');
  if (!list) return;
  try {
    const res = await fetch('../api/dashboard_data.php?type=patient_notifications');
    const json = await res.json();
    if (!json.success || !json.data || json.data.length === 0) {
      list.innerHTML = '<div class="empty-state">No notifications</div>';
      if (badge) badge.style.display = 'none';
      if (deleteAllBtn) deleteAllBtn.style.display = 'none';
      return;
    }
    if (deleteAllBtn) deleteAllBtn.style.display = '';
    const unread = json.data.filter(n => !Number(n.is_read)).length;
    if (badge) {
      badge.style.display = unread > 0 ? 'flex' : 'none';
      badge.textContent = unread > 9 ? '9+' : String(unread);
    }
    list.innerHTML = json.data.map(n => {
      const unreadClass = !Number(n.is_read) ? ' unread' : '';
      const apptId = Number(n.appointment_id) || 0;
      const nid = Number(n.id);
      const ctaHtml = (n.cta === 'reschedule' && apptId) ? `
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" style="font-size:12px;padding:6px 12px;" onclick="event.stopPropagation();patientRespondReschedule(${apptId},'accept');">Accept</button>
          <button type="button" class="btn" style="font-size:12px;padding:6px 12px;background:rgba(239,68,68,0.1);color:var(--danger);" onclick="event.stopPropagation();patientRespondReschedule(${apptId},'reject');">Reject</button>
        </div>` : '';
      return `
      <div class="notif-item${unreadClass}" style="flex-direction:column;align-items:stretch;cursor:default;">
        <div style="width:100%;display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;font-size:13px;">${escapeHtml(n.title)}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;line-height:1.45;">${escapeHtml(n.message)}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:6px;">${escapeHtml(n.created_at)}</div>
          </div>
          <button type="button" class="notif-delete-one" title="Delete" onclick="event.stopPropagation();patientDeleteNotification(${nid});" style="flex-shrink:0;margin-top:0;">Delete</button>
        </div>
        ${ctaHtml}
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = '<div class="empty-state">Could not load notifications</div>';
    if (deleteAllBtn) deleteAllBtn.style.display = 'none';
  }
}

async function patientDeleteNotification(notifId) {
  if (!notifId) return;
  try {
    const res = await fetch('../api/patient_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=delete_notification&id=${encodeURIComponent(String(notifId))}`
    });
    const json = await res.json();
    if (json.success) {
      showToast('Notification removed', 'success');
      loadPatientNotifications();
    } else showToast(json.message || 'Could not delete', 'error');
  } catch (e) {
    showToast('Server error', 'error');
  }
}

async function patientDeleteAllNotifications() {
  if (!await showConfirm('Delete all notifications? This cannot be undone.', { confirmText: 'Delete all', type: 'danger' })) return;
  try {
    const res = await fetch('../api/patient_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=delete_all_notifications'
    });
    const json = await res.json();
    if (json.success) {
      showToast('All notifications cleared', 'success');
      loadPatientNotifications();
    } else showToast(json.message || 'Could not delete', 'error');
  } catch (e) {
    showToast('Server error', 'error');
  }
}

async function patientRespondReschedule(apptId, decision) {
  if (!['accept', 'reject'].includes(decision)) return;
  const isAcc = decision === 'accept';
  const detail = isAcc ? 'Your appointment will move to the proposed date and time.' : 'You will keep your original appointment.';
  if (!await showConfirm(`${isAcc ? 'Accept' : 'Reject'} the doctor\'s proposed new time? ${detail}`, { confirmText: isAcc ? 'Accept' : 'Reject', cancelText: 'Cancel', type: isAcc ? 'info' : 'warning' })) return;
  const action = isAcc ? 'accept_reschedule' : 'reject_reschedule';
  try {
    const res = await fetch('../api/patient_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=${action}&id=${apptId}`
    });
    const json = await res.json();
    if (json.success) {
      showToast(isAcc ? 'Appointment updated to the new time.' : 'You kept the original appointment time.', 'success');
      loadPatientAppointments();
      loadPatientNotifications();
    } else {
      showToast(json.message || 'Action failed', 'error');
    }
  } catch (e) {
    showToast('Server error', 'error');
  }
}

async function loadPatientAppointments() {
  const container = document.getElementById('patientAppointmentsList');
  if (!container) return;
  try {
    const res = await fetch('../api/dashboard_data.php?type=patient_appointments');
    const json = await res.json();
    if (!json.success || !json.data || json.data.length === 0) {
      container.innerHTML = '<div class="empty-state">No appointments found.</div>';
      return;
    }
    const statusFilter = document.getElementById('patientAppointmentStatusFilter')?.value || 'all';
    const typeFilter = document.getElementById('patientAppointmentTypeFilter')?.value || 'all';
    const filtered = json.data.filter((a) => (statusFilter === 'all' || a.status === statusFilter) && (typeFilter === 'all' || a.type === typeFilter));
    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">No appointments match selected filters.</div>';
      return;
    }
    container.innerHTML = filtered.map(a => {
      const propTime = a.proposed_appointment_time ? formatApptTimeDisplay(a.proposed_appointment_time) : '';
      const proposeBlock = a.proposed_appointment_date ? `
        <div style="margin-top:12px;padding:12px;background:#fffbeb;border-radius:12px;border:1px solid #fcd34d;font-size:13px;text-align:left;">
          <strong style="color:#92400e"><i class="fas fa-exclamation-circle"></i> New time proposed:</strong> 
          <div style="margin-top:4px;">${a.proposed_appointment_date} @ ${propTime || a.proposed_appointment_time}</div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" style="padding:6px 12px;font-size:12px" onclick="patientRespondReschedule(${a.id},'accept')">Accept</button>
            <button type="button" class="btn" style="padding:6px 12px;font-size:12px;background:rgba(239,68,68,0.1);color:var(--danger);" onclick="patientRespondReschedule(${a.id},'reject')">Reject</button>
          </div>
        </div>` : '';
      
      return `
      <div class="patient-appointment-card ${a.status}">
        ${a.status === 'cancelled' ? `<div class="patient-appt-delete" title="Delete record" onclick="patientDeleteCancelledAppointment(${a.id})"><i class="fas fa-trash-alt"></i></div>` : ''}
        <div class="patient-appt-dr-name">Dr. ${a.doctor_name}</div>
        <div class="patient-appt-specialty">${a.specialization || 'Specialist'} · ${a.clinic_name || 'Clinic'}</div>
        <div class="patient-appt-status ${a.status}">${a.status}</div>

        <div class="patient-appt-info-row">
          <i class="far fa-calendar-alt"></i>
          <span>${a.appointment_date} at ${formatApptTimeDisplay(a.appointment_time)}</span>
        </div>
        
        <div class="patient-appt-info-row">
          <i class="fas fa-video"></i>
          <span>${a.type.toUpperCase()} Consultation</span>
        </div>

        ${proposeBlock}
        
        ${a.meet_link ? `
          <div class="patient-appt-info-row" style="margin-top:4px;">
            <i class="fas fa-link"></i>
            <a href="${a.meet_link}" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;">Join Meeting</a>
          </div>
        ` : ''}

        ${a.patient_notes ? `
          <div class="patient-appt-notes">
            <i class="fas fa-pen-nib"></i>
            <div><strong>My Notes:</strong> ${a.patient_notes}</div>
          </div>
        ` : ''}
        
        ${a.doctor_notes ? `
          <div class="patient-appt-notes" style="background:#f0fdf4;padding:10px;border-radius:8px;border:1px solid #dcfce7;color:#166534;">
            <i class="fas fa-clipboard-check"></i>
            <div><strong>Doctor's Notes:</strong> ${a.doctor_notes}</div>
          </div>
        ` : ''}

        <div class="patient-appt-footer">
          <button class="patient-btn-details" onclick="toggleAppointmentDetails(${a.id})">
            <i class="fas fa-info-circle"></i> View Details
          </button>
          
          <div style="margin-left: auto; display: flex; gap: 8px;">
            ${(a.status === 'pending' || a.status === 'confirmed') ? `<button class="btn" style="background:rgba(239,68,68,0.1);color:var(--danger);border:none;" onclick="cancelPatientAppointment(${a.id})"><i class="fas fa-times"></i> Cancel</button>` : ''}
            ${(a.status === 'pending') ? `<button class="btn" style="background:var(--bg);border:1px solid var(--border);" onclick="openUpdateAppointmentModal(${a.id})"><i class="fas fa-edit"></i> Update</button>` : ''}
          </div>
        </div>

        <div id="patient-appointment-details-${a.id}" style="display:none;margin-top:15px;padding:15px;background:var(--bg);border-radius:12px;font-size:13px;color:var(--text-light);line-height:1.6;border:1px solid var(--border);">
          <div style="margin-bottom:8px;"><i class="fas fa-hospital" style="width:16px;margin-right:8px;color:var(--muted)"></i> <strong>Clinic:</strong> ${a.clinic_name || '-'}</div>
          <div style="margin-bottom:8px;"><i class="fas fa-notes-medical" style="width:16px;margin-right:8px;color:var(--muted)"></i> <strong>Treatment Type:</strong> ${a.type}</div>
          ${a.prescription ? `<div style="margin-top:12px;padding:12px;background:#fff;border:1px solid var(--border);border-radius:10px;color:var(--text);"><strong><i class="fas fa-prescription-bottle-medical" style="color:var(--primary);margin-right:6px;"></i> Prescription:</strong><br>${a.prescription}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Could not load appointments.</div>';
  }
}

function toggleAppointmentDetails(id) {
  const el = document.getElementById(`patient-appointment-details-${id}`);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function cancelPatientAppointment(id) {
  if (!await showConfirm('Cancel this appointment? This action cannot be undone.', { confirmText: 'Yes, Cancel', type: 'danger' })) return;
  const res = await fetch('../api/patient_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `action=cancel_appointment&id=${id}`
  });
  const json = await res.json();
  if (json.success) {
    showToast('Appointment cancelled', 'success');
    loadPatientAppointments();
  } else {
    showToast(json.message || 'Failed to cancel', 'error');
  }
}

async function patientDeleteCancelledAppointment(id) {
  if (!await showConfirm('Permanently delete this appointment record?', { confirmText: 'Delete', type: 'danger' })) return;
  const res = await fetch('../api/patient_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `action=delete_cancelled_appointment&id=${id}`
  });
  const json = await res.json();
  if (json.success) {
    showToast('Appointment record removed', 'success');
    loadPatientAppointments();
  } else {
    showToast(json.message || 'Error deleting appointment', 'error');
  }
}

async function deleteMedicine(id, name) {
  try {
    const res = await fetch('../api/patient_api.php', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
      body: `action=delete_medicine&id=${id}` 
    });
    const data = await res.json();
    if (data.success) { 
      showToast(`successfully deleted reminder of ${name}`, 'success'); 
      const el = document.getElementById(`reminder-${id}`);
      if (el) el.remove();
      // If we're on the overview, reload to update stats
      if (document.getElementById('tab-overview').classList.contains('active')) {
          setTimeout(() => location.reload(), 800);
      }
      loadMedicines(); 
    } else {
      showToast(data.message || 'Action failed', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

// ---- Patient: Symptom Checker Valid List & Spellcheck ----
const VALID_SYMPTOMS = [
  'fever', 'cough', 'sore throat', 'headache', 'nausea', 'sensitivity to light',
  'stomach pain', 'diarrhea', 'bloating', 'back pain', 'stiffness', 'muscle ache',
  'shortness of breath', 'wheezing', 'chest tightness', 'skin rash', 'itching', 'redness'
];

function getLevenshteinDistance(s, t) {
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) { arr[i] = [i]; }
    for (let j = 0; j <= s.length; j++) { arr[0][j] = j; }
    for (let i = 1; i <= t.length; i++) {
        for (let j = 1; j <= s.length; j++) {
            arr[i][j] = Math.min(arr[i-1][j-1] + (s[j-1] === t[i-1] ? 0 : 1), arr[i-1][j] + 1, arr[i][j-1] + 1);
        }
    }
    return arr[t.length][s.length];
}

function checkSymptomSpell(input) {
    const val = input.value.trim().toLowerCase();
    const suggestionBox = input.parentElement.nextElementSibling;
    if (val.length < 3 || VALID_SYMPTOMS.includes(val)) {
        suggestionBox.style.display = 'none';
        return;
    }
    let best = null, minDist = 3;
    VALID_SYMPTOMS.forEach(s => {
        const d = getLevenshteinDistance(val, s);
        if (d < minDist) { minDist = d; best = s; }
    });
    if (best) {
        suggestionBox.innerHTML = `Did you mean: <span class="suggestion-link" onclick="applySymptomSuggestion(this, '${best}')">${best}</span>?`;
        suggestionBox.style.display = 'block';
    } else {
        suggestionBox.style.display = 'none';
    }
}

function applySymptomSuggestion(linkEl, suggestion) {
    const suggestionBox = linkEl.parentElement;
    const input = suggestionBox.previousElementSibling.querySelector('input');
    if (input) {
        input.value = suggestion;
        suggestionBox.style.display = 'none';
        input.focus();
        // Fire input event to toggle the clear icon if needed
        input.dispatchEvent(new Event('input'));
    }
}

// ---- Patient: Symptom Checker ----
function generateSymptomInputs() {
  const count = document.getElementById('symptomCount').value;
  if (count < 1) return;
  const container = document.getElementById('symptomInputsContainer');
  container.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    container.innerHTML += `<div style="margin-bottom:15px">
      <label style="display:block;margin-bottom:5px;font-size:13px;font-weight:600">Symptom ${i}</label>
      <div style="position:relative">
         <input type="text" name="symptoms[]" required placeholder="e.g. Fever, Headache..." 
                style="width:100%;padding:10px 35px 10px 10px;border:1px solid var(--border);border-radius:8px;transition:all 0.2s;"
                oninput="this.nextElementSibling.style.display = this.value ? 'block' : 'none'; checkSymptomSpell(this);">
         <i class="fas fa-times-circle" 
            onclick="this.previousElementSibling.value=''; this.style.display='none'; this.previousElementSibling.focus(); this.parentElement.nextElementSibling.style.display='none';" 
            style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--muted); cursor:pointer; font-size:14px; display:none; transition:color 0.2s;"
            onmouseover="this.style.color='var(--danger)'" 
            onmouseout="this.style.color='var(--muted)'"></i>
      </div>
      <div class="symptom-suggestion"></div>
    </div>`;
  }
  document.getElementById('symptomStep1').style.display = 'none';
  document.getElementById('symptomCheckerForm').style.display = 'block';
}

const sympForm = document.getElementById('symptomCheckerForm');
if (sympForm) {
  sympForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(sympForm);
    formData.append('action', 'get_diagnosis');
    try {
      const res = await fetch('../api/symptom_api.php', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        document.getElementById('resDisease').innerText = data.disease;
        document.getElementById('resMeds').innerText = data.medicines;
        document.getElementById('resRemedies').innerText = data.home_remedies;
        
        // Hide the inputs form
        sympForm.style.display = 'none';
        
        // Ensure home remedies part is initially hidden or separated
        document.getElementById('resRemediesContainer').style.display = 'none';
        document.getElementById('resSummaryContainer').style.display = 'block';
        
        // Show result div
        const resultDiv = document.getElementById('symptomResult');
        resultDiv.style.display = 'block';
        
        // Save to DB
        const sympsArr = formData.getAll('symptoms[]');
        fetch('../api/patient_api.php', { 
           method: 'POST', 
           headers: {'Content-Type':'application/x-www-form-urlencoded'}, 
           body: `action=save_symptom_check&symptoms=${encodeURIComponent(sympsArr.join(','))}&diagnosis=${encodeURIComponent(data.disease)}&medicines=${encodeURIComponent(data.medicines)}&remedies=${encodeURIComponent(data.home_remedies)}` 
        });
      }
    } catch (err) { showToast('Analysis failed', 'error'); }
  });
}

function resetSymptomChecker() {
  const res = document.getElementById('symptomResult');
  const step1 = document.getElementById('symptomStep1');
  const form = document.getElementById('symptomCheckerForm');
  if (res) res.style.display = 'none';
  if (step1) step1.style.display = 'block';
  if (form) { form.reset(); form.style.display = 'none'; }
}

// ---- Patient: Clinic Search (Google + OpenStreetMap fallback) ----
let clinicGeoPoint = null;
let clinicSuggestTimer = null;
let clinicSuggestSeq = 0;

function escClinic(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function buildClinicSearchParams(extra) {
  const p = new URLSearchParams({ type: 'clinics', ...extra });
  const line = document.getElementById('clinicAddressLine')?.value?.trim() || '';
  const city = document.getElementById('clinicCity')?.value?.trim() || '';
  const state = document.getElementById('clinicState')?.value?.trim() || '';
  const postal = document.getElementById('clinicPostal')?.value?.trim() || '';
  const country = document.getElementById('clinicCountry')?.value?.trim() || 'India';
  const maxKm = document.getElementById('clinicDistanceKm')?.value || '10';
  if (line) p.set('address_line', line);
  if (city) p.set('city', city);
  if (state) p.set('state', state);
  if (postal) p.set('postal_code', postal);
  if (country) p.set('country', country);
  p.set('max_km', maxKm);
  return p;
}

function fillClinicAddressFields(s) {
  if (!s) return;
  const line = document.getElementById('clinicAddressLine');
  const city = document.getElementById('clinicCity');
  const state = document.getElementById('clinicState');
  const postal = document.getElementById('clinicPostal');
  const country = document.getElementById('clinicCountry');
  if (line) line.value = s.address_line || s.display_name || '';
  if (city && s.city) city.value = s.city;
  if (state && s.state) state.value = s.state;
  if (postal && s.postal_code) postal.value = s.postal_code;
  if (country && s.country) country.value = s.country;
  if (typeof s.lat === 'number' && typeof s.lng === 'number') {
    clinicGeoPoint = { lat: s.lat, lng: s.lng };
  }
}

function hideClinicSuggestions() {
  const box = document.getElementById('clinicAddressSuggestions');
  if (box) {
    box.innerHTML = '';
    box.style.display = 'none';
  }
}

function showClinicSuggestions(list) {
  const box = document.getElementById('clinicAddressSuggestions');
  if (!box) return;
  if (!Array.isArray(list) || list.length === 0) {
    hideClinicSuggestions();
    return;
  }
  box.innerHTML = list.map((s) => {
    const payload = encodeURIComponent(JSON.stringify(s));
    return `<button type="button" data-s="${payload}" style="display:block;width:100%;text-align:left;background:transparent;border:none;border-bottom:1px solid var(--border);padding:10px 12px;cursor:pointer;font-family:inherit;font-size:13px;color:var(--text)">${escClinic(s.display_name || '')}</button>`;
  }).join('');
  box.style.display = 'block';
  box.querySelectorAll('button[data-s]').forEach((btn) => {
    btn.onclick = () => {
      try {
        const s = JSON.parse(decodeURIComponent(btn.getAttribute('data-s')));
        fillClinicAddressFields(s);
      } catch (e) {}
      hideClinicSuggestions();
    };
  });
}

async function suggestClinicAddress() {
  const line = document.getElementById('clinicAddressLine')?.value?.trim() || '';
  const country = document.getElementById('clinicCountry')?.value?.trim() || '';
  if (line.length < 3) {
    hideClinicSuggestions();
    return;
  }
  clinicSuggestSeq += 1;
  const currentSeq = clinicSuggestSeq;
  const p = new URLSearchParams({ type: 'clinic_address_suggest', q: line, country });
  try {
    const res = await fetch('../api/dashboard_data.php?' + p.toString(), { credentials: 'same-origin' });
    const json = await res.json();
    if (currentSeq !== clinicSuggestSeq) return;
    if (json.success) showClinicSuggestions(json.data || []);
  } catch (e) {
    hideClinicSuggestions();
  }
}

function initClinicAddressAutocomplete() {
  const input = document.getElementById('clinicAddressLine');
  if (!input || input.dataset.suggestReady === '1') return;
  input.dataset.suggestReady = '1';
  input.addEventListener('input', () => {
    clinicGeoPoint = null;
    if (clinicSuggestTimer) clearTimeout(clinicSuggestTimer);
    clinicSuggestTimer = setTimeout(suggestClinicAddress, 280);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#clinicAddressSuggestions') && !e.target.closest('#clinicAddressLine')) {
      hideClinicSuggestions();
    }
  });
}

function useMyLocationForClinics() {
  const statusEl = document.getElementById('clinicGeoStatus');
  if (!navigator.geolocation) {
    showToast('Location is not supported in this browser.', 'warning');
    return;
  }
  if (statusEl) statusEl.textContent = 'Getting location...';
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      clinicGeoPoint = { lat, lng };
      try {
        const p = new URLSearchParams({ type: 'clinic_reverse_geocode', lat: String(lat), lng: String(lng) });
        const res = await fetch('../api/dashboard_data.php?' + p.toString(), { credentials: 'same-origin' });
        const json = await res.json();
        if (json.success && json.data) {
          fillClinicAddressFields(json.data);
        }
      } catch (e) {}
      if (statusEl) statusEl.textContent = 'Location selected. Searching clinics near you...';
      await searchClinics({ lat, lng });
      if (statusEl) statusEl.textContent = 'Showing nearby clinics from your current location.';
    },
    () => {
      if (statusEl) statusEl.textContent = '';
      showToast('Could not read location. Allow permission or enter address manually.', 'warning');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
}

async function searchClinics(geo) {
  const container = document.getElementById('clinicResults');
  if (!container) return;
  const city = document.getElementById('clinicCity')?.value?.trim() || '';
  const activeGeo = geo || clinicGeoPoint;
  if (!activeGeo && !city) {
    showToast('Enter city/address or click "Use my location".', 'warning');
    return;
  }
  const p = buildClinicSearchParams();
  if (activeGeo && typeof activeGeo.lat === 'number' && typeof activeGeo.lng === 'number') {
    p.set('lat', String(activeGeo.lat));
    p.set('lng', String(activeGeo.lng));
  }
  container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Searching clinics and hospitals...</div>';

  try {
    const res = await fetch('../api/dashboard_data.php?' + p.toString(), { credentials: 'same-origin' });
    const data = await res.json();
    if (!data.success) {
      container.innerHTML = '<div class="empty-state">' + escClinic(data.message || 'Search failed.') + '</div>';
      return;
    }
    if (!data.data || data.data.length === 0) {
      container.innerHTML = '<div class="empty-state">No clinics found for this location. Try another nearby area.</div>';
      return;
    }
    container.innerHTML = data.data.map((c) => {
      const name = escClinic(c.clinic_name || c.name);
      const addr = escClinic(c.clinic_address || c.address || '');
      const doc = escClinic(c.doctor_name || '—');
      const fee = escClinic(c.fees || '—');
      const contact = escClinic(c.contact || '—');
      const usingApprox = !c.distance_text && (c.distance_km !== null && c.distance_km !== undefined);
      const distance = c.distance_text || (usingApprox ? Number(c.distance_km).toFixed(2) + ' km away' : '');
      const duration = c.duration_text ? ` (${c.duration_text})` : '';
      const mapsUrl = c.maps_url || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((c.clinic_name || '') + ' ' + (c.clinic_address || '')));
      const webSafe = typeof c.website === 'string' && /^https?:\/\//i.test(c.website) ? c.website.replace(/"/g, '') : '';
      const web = webSafe ? `<a href="${webSafe}" target="_blank" rel="noopener" style="font-size:13px;color:var(--primary-light)">Website</a>` : '';
      const docForBook = JSON.stringify(c.doctor_name || 'Doctor');
      const book = c.id > 0
        ? `<button type="button" class="btn btn-primary" style="margin-top:10px" onclick="openBookingModal(${c.id}, ${docForBook})">Book appointment</button>`
        : '<p style="font-size:12px;color:var(--muted);margin-top:10px">External listing — call or visit to book.</p>';
      const src = c.source === 'platform'
        ? '<span class="badge badge-success" style="font-size:10px">On platform</span>'
        : '<span class="badge" style="font-size:10px;background:#e0e7ff;color:#3730a3">Live map data</span>';
      return `
        <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
            <div style="font-weight:800;font-size:17px">${name}</div>${src}
          </div>
          <div style="color:var(--text-light);font-size:13px;line-height:1.5"><i class="fas fa-map-marker-alt"></i> ${addr}</div>
          ${distance ? `<div style="font-size:12px;color:#2563eb;"><i class="fas fa-route"></i> ${distance}${duration}${usingApprox ? ' · approx' : ''}</div>` : ''}
          <div style="font-size:13px"><strong>Doctor:</strong> ${doc}</div>
          <div style="font-size:13px"><strong>Consultation / fees:</strong> ${fee}</div>
          <div style="font-size:13px"><strong>Contact:</strong> ${contact !== '—' ? `<a href="tel:${String(c.contact).replace(/\s/g, '')}">${contact}</a>` : contact}</div>
          ${web}
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;align-items:center">
            <a class="btn" style="background:#ecfdf5;color:#166534;text-decoration:none;display:inline-flex;align-items:center;gap:8px" href="${mapsUrl.replace(/"/g, '%22')}" target="_blank" rel="noopener"><i class="fas fa-directions"></i> Open in Google Maps</a>
          </div>
          ${book}
        </div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = '<div class="empty-state">Could not load clinics. Check your internet and try again.</div>';
  }
}

// ---- Doctor: Actions ----
async function toggleClinicStatus() {
  const label = document.getElementById('statusLabel');
  const current = label.innerText.toLowerCase();
  const next = current === 'open' ? 'closed' : 'open';
  
  const res = await fetch('../api/doctor_api.php', { 
     method: 'POST', 
     headers: {'Content-Type':'application/x-www-form-urlencoded'}, 
     body: `action=toggle_clinic_status&status=${next}` 
  });
  const data = await res.json();
  if (data.success) {
     label.innerText = next;
     label.className = `badge badge-${next==='open'?'success':'danger'}`;
     showToast('Clinic status updated to ' + next.toUpperCase(), 'info');
  }
}

function manageAppointment(id) {
   const notes = prompt('Enter Patient Notes/Diagnosis:');
   if (notes === null) return;
   const presc = prompt('Enter Prescription:');
   fetch('../api/doctor_api.php', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `action=save_notes&id=${id}&notes=${encodeURIComponent(notes)}&prescription=${encodeURIComponent(presc)}`
   }).then(r => r.json()).then(d => {
      if (d.success) showToast('Record saved!', 'success');
   });
}

function manageMeetLink(id, current) {
   const raw = current && current !== 'null' ? decodeURIComponent(current) : 'https://meet.google.com/';
   const link = prompt('Enter Google Meet Link:', raw);
   if (!link) return;
   fetch('../api/doctor_api.php', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `action=save_meet_link&id=${id}&link=${encodeURIComponent(link)}`
   }).then(r => r.json()).then(d => {
      if (d.success) { showToast('Meet link updated!', 'success'); if (typeof loadDoctorAppointments === 'function') loadDoctorAppointments(); }
   });
}

function openRescheduleModal(apptId, currentDate, currentTime) {
  document.getElementById('rescheduleOverlay')?.remove();
  const tVal = formatApptTimeDisplay(currentTime);
  const overlay = document.createElement('div');
  overlay.id = 'rescheduleOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:400px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.15);font-family:inherit">
      <h3 style="font-size:18px;font-weight:700;margin-bottom:6px;color:#1e293b">Propose new time</h3>
      <p style="font-size:13px;color:#64748b;margin-bottom:16px;line-height:1.5">The patient receives a notification and must accept before the schedule changes.</p>
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Date</label>
      <input type="date" id="rescheduleDateInput" value="${currentDate || ''}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Time</label>
      <input type="time" id="rescheduleTimeInput" value="${tVal}" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px;font-family:inherit" />
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button type="button" id="rescheduleCancelBtn" class="btn" style="background:#f1f5f9;color:#475569">Cancel</button>
        <button type="button" id="rescheduleSaveBtn" class="btn btn-primary">Send to patient</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#rescheduleCancelBtn').addEventListener('click', close);
  const dateIn = overlay.querySelector('#rescheduleDateInput');
  const today = new Date().toISOString().slice(0, 10);
  if (dateIn) dateIn.min = today;
  overlay.querySelector('#rescheduleSaveBtn').addEventListener('click', async () => {
    const date = overlay.querySelector('#rescheduleDateInput').value;
    const time = overlay.querySelector('#rescheduleTimeInput').value;
    if (!date || !time) { showToast('Pick date and time', 'warning'); return; }
    const body = new URLSearchParams({ action: 'propose_reschedule', id: String(apptId), date, time }).toString();
    try {
      const res = await fetch('../api/doctor_api.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const json = await res.json();
      if (json.success) {
        showToast('Patient notified. Awaiting their response.', 'success');
        close();
        loadDoctorAppointments();
      } else showToast(json.message || 'Failed', 'error');
    } catch (e) { showToast('Server error', 'error'); }
  });
}

// ---- Admin: Actions ----
async function adminAction(action, params) {
  if (!await showConfirm('Are you sure you want to perform this action?', { confirmText: 'Yes, Proceed', type: 'warning' })) return;
  const body = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch('../api/admin_api.php', { 
     method: 'POST', 
     headers: {'Content-Type':'application/x-www-form-urlencoded'}, 
     body 
  });
  const data = await res.json();
  if (data.success) {
     showToast(data.message || 'Action completed', 'success');
     setTimeout(() => location.reload(), 1000);
  } else showToast(data.message, 'error');
}

async function loadUserList() {
   const role = document.getElementById('userFilterRole')?.value || 'all';
   const container = document.getElementById('userManagementTable');
   if (!container) return;
   try {
      const res = await fetch(`../api/dashboard_data.php?type=users&role=${role}`);
      const data = await res.json();
      if (data.success) {
         if (data.data.length === 0) { container.innerHTML = '<div class="empty-state">No users found.</div>'; return; }
         container.innerHTML = `<table style="width:100%; border-collapse:collapse">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>${data.data.map(u => `<tr>
               <td>${u.name}</td>
               <td>${u.email}</td>
               <td><span class="badge ${u.role==='doctor'?'badge-info':'badge-purple'}">${u.role}</span></td>
               <td><span class="badge ${u.status==='active'?'badge-success':'badge-warning'}">${u.status}</span></td>
               <td>${u.created_at}</td>
            </tr>`).join('')}</tbody>
         </table>`;
      }
   } catch(e) {}
}

async function loadAdminApprovals() {
   const container = document.getElementById('adminApprovalsTableBody');
   const quickView = document.getElementById('adminApprovalsQuickView');
   try {
      const res = await fetch('../api/dashboard_data.php?type=pending_doctors');
      const data = await res.json();
      if (!data.success) return;
      
      const pds = data.data || [];
      
      if (quickView) {
          if (pds.length === 0) {
              quickView.innerHTML = '<div class="empty-state">No pending approvals</div>';
          } else {
              quickView.innerHTML = pds.slice(0, 5).map(pd => `
                  <div style="display:flex;align-items:center;gap:15px;padding:12px 0;border-bottom:1px solid var(--border)">
                     <div style="flex:1">
                        <div style="font-weight:700">Dr. ${pd.name}</div>
                        <div style="font-size:12px;color:var(--muted)">${pd.specialization}</div>
                     </div>
                     <button class="btn btn-primary btn-sm" onclick="showTab('approvals')">Review</button>
                  </div>
              `).join('');
          }
      }
      
      if (container) {
          if (pds.length === 0) {
              container.innerHTML = '<tr><td colspan="5" class="empty-state">No pending doctor registrations</td></tr>';
          } else {
              container.innerHTML = pds.map(pd => `
                  <tr>
                     <td><strong>Dr. ${pd.name}</strong><br><small>${pd.email}</small></td>
                     <td>${pd.specialization}</td>
                     <td><code style="background:#f1f5f9;padding:2px 5px;border-radius:4px">${pd.license_number}</code></td>
                     <td>${pd.phone}</td>
                     <td>
                        <div style="display:flex;gap:10px">
                           <button class="btn" style="background:#10b981;color:#fff" onclick="adminAction('approve_doctor', {doctor_id:${pd.id}, user_id:${pd.user_id}})">Approve</button>
                           <button class="btn" style="background:#ef4444;color:#fff" onclick="adminAction('reject_doctor', {doctor_id:${pd.id}, user_id:${pd.user_id}})">Reject</button>
                        </div>
                     </td>
                  </tr>
              `).join('');
          }
      }
   } catch (e) { console.error("Could not load pending doctors", e); }
}

let _adminPatientListCache = [];
let _adminDoctorListCache = [];

async function refreshAdminOverviewStats() {
  try {
    const res = await fetch('../api/dashboard_data.php?type=initial_load');
    const json = await res.json();
    if (!json.success || !json.data?.stats) return;
    const st = json.data.stats;
    const p = Number(st.patients ?? 0);
    const d = Number(st.doctors ?? 0);
    const pend = st.pending ?? 0;
    const su = document.getElementById('stat-users');
    const sd = document.getElementById('stat-doctors');
    const sp = document.getElementById('stat-pending');
    const spo = document.getElementById('stat-pending-overview');
    if (su) su.textContent = p;
    if (sd) sd.textContent = d;
    if (sp) sp.textContent = pend;
    if (spo) spo.textContent = pend;
    if (typeof drawUserDistributionChart === 'function') drawUserDistributionChart(p, d);
  } catch (e) {}
}

async function loadAdminPatientsList() {
  const tbody = document.getElementById('adminPatientsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading...</td></tr>';
  try {
    const res = await fetch('../api/dashboard_data.php?type=admin_patients_list');
    const json = await res.json();
    if (!json.success) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Could not load patients.</td></tr>';
      _adminPatientListCache = [];
      return;
    }
    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No patients found.</td></tr>';
      _adminPatientListCache = [];
      return;
    }
    _adminPatientListCache = json.data;
    tbody.innerHTML = json.data.map((p) => `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.email)}</td>
        <td>${escapeHtml(p.phone || '—')}</td>
        <td><span class="badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}">${escapeHtml(p.status)}</span></td>
        <td style="font-size:12px;color:var(--muted)">${escapeHtml(p.created_at)}</td>
        <td style="white-space:nowrap">
          <button type="button" class="btn btn-primary btn-sm" onclick="adminOpenPatientEditor(${Number(p.user_id)})">Update profile</button>
          <button type="button" class="btn btn-sm" style="background:#fee2e2;color:#dc2626;margin-left:6px" onclick="adminDeletePatientConfirm(${Number(p.user_id)})">Delete</button>
        </td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load.</td></tr>';
    _adminPatientListCache = [];
  }
}

async function loadAdminDoctorsList() {
  const tbody = document.getElementById('adminDoctorsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading...</td></tr>';
  try {
    const res = await fetch('../api/dashboard_data.php?type=admin_doctors_list');
    const json = await res.json();
    if (!json.success) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Could not load doctors.</td></tr>';
      _adminDoctorListCache = [];
      return;
    }
    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No doctors found.</td></tr>';
      _adminDoctorListCache = [];
      return;
    }
    _adminDoctorListCache = json.data;
    tbody.innerHTML = json.data.map((d) => `
      <tr>
        <td><strong>${escapeHtml(d.name)}</strong></td>
        <td>${escapeHtml(d.email)}</td>
        <td>${escapeHtml(d.phone || '—')}</td>
        <td>${escapeHtml(d.specialization || '—')}</td>
        <td><span class="badge ${d.approval_status === 'approved' ? 'badge-success' : (d.approval_status === 'pending' ? 'badge-warning' : 'badge-danger')}">${escapeHtml(d.approval_status)}</span></td>
        <td style="font-size:12px;color:var(--muted)">${escapeHtml(d.created_at)}</td>
        <td style="white-space:nowrap">
          <button type="button" class="btn btn-primary btn-sm" onclick="adminOpenDoctorEditor(${Number(d.user_id)})">Update profile</button>
          <button type="button" class="btn btn-sm" style="background:#fee2e2;color:#dc2626;margin-left:6px" onclick="adminDeleteDoctorConfirm(${Number(d.user_id)})">Delete</button>
        </td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load.</td></tr>';
    _adminDoctorListCache = [];
  }
}

function adminOpenPatientEditor(userId) {
  const p = _adminPatientListCache.find((x) => Number(x.user_id) === Number(userId));
  if (!p) return;
  document.getElementById('adminPatientModalOverlay')?.remove();
  const g = p.gender || '';
  const ageVal = p.age != null && p.age !== '' ? String(p.age) : '';
  const overlay = document.createElement('div');
  overlay.id = 'adminPatientModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:420px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.15);font-family:inherit">
      <h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#1e293b">Update patient</h3>
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Name</label>
      <input type="text" id="admPatName" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Email</label>
      <input type="email" id="admPatEmail" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Phone</label>
      <input type="text" id="admPatPhone" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Age</label>
      <input type="number" id="admPatAge" min="0" max="130" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Gender</label>
      <select id="admPatGender" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px;font-family:inherit">
        <option value="">—</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button type="button" id="admPatCancel" class="btn btn-sm" style="background:#f1f5f9;color:#475569">Cancel</button>
        <button type="button" id="admPatSave" class="btn btn-primary btn-sm">Save &amp; email user</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#admPatName').value = p.name || '';
  overlay.querySelector('#admPatEmail').value = p.email || '';
  overlay.querySelector('#admPatPhone').value = p.phone || '';
  if (ageVal !== '') overlay.querySelector('#admPatAge').value = ageVal;
  overlay.querySelector('#admPatGender').value = g;
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#admPatCancel').addEventListener('click', close);
  overlay.querySelector('#admPatSave').addEventListener('click', async () => {
    const body = new URLSearchParams({
      action: 'admin_update_patient',
      user_id: String(p.user_id),
      name: overlay.querySelector('#admPatName').value.trim(),
      email: overlay.querySelector('#admPatEmail').value.trim(),
      phone: overlay.querySelector('#admPatPhone').value.trim(),
      age: overlay.querySelector('#admPatAge').value,
      gender: overlay.querySelector('#admPatGender').value
    }).toString();
    try {
      const res = await fetch('../api/admin_api.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Saved', 'success');
        close();
        await loadAdminPatientsList();
        await refreshAdminOverviewStats();
      } else showToast(json.message || 'Failed', 'error');
    } catch (e) {
      showToast('Server error', 'error');
    }
  });
}

function adminOpenDoctorEditor(userId) {
  const d = _adminDoctorListCache.find((x) => Number(x.user_id) === Number(userId));
  if (!d) return;
  document.getElementById('adminDoctorModalOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'adminDoctorModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:420px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.15);font-family:inherit">
      <h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#1e293b">Update doctor</h3>
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Name</label>
      <input type="text" id="admDocName" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Email</label>
      <input type="email" id="admDocEmail" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Phone</label>
      <input type="text" id="admDocPhone" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Specialization</label>
      <input type="text" id="admDocSpec" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:inherit" />
      <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px">Clinic name</label>
      <input type="text" id="admDocClinic" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px;font-family:inherit" />
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button type="button" id="admDocCancel" class="btn btn-sm" style="background:#f1f5f9;color:#475569">Cancel</button>
        <button type="button" id="admDocSave" class="btn btn-primary btn-sm">Save &amp; email user</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#admDocName').value = d.name || '';
  overlay.querySelector('#admDocEmail').value = d.email || '';
  overlay.querySelector('#admDocPhone').value = d.phone || '';
  overlay.querySelector('#admDocSpec').value = d.specialization || '';
  overlay.querySelector('#admDocClinic').value = d.clinic_name || '';
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#admDocCancel').addEventListener('click', close);
  overlay.querySelector('#admDocSave').addEventListener('click', async () => {
    const body = new URLSearchParams({
      action: 'admin_update_doctor',
      user_id: String(d.user_id),
      name: overlay.querySelector('#admDocName').value.trim(),
      email: overlay.querySelector('#admDocEmail').value.trim(),
      phone: overlay.querySelector('#admDocPhone').value.trim(),
      specialization: overlay.querySelector('#admDocSpec').value.trim(),
      clinic_name: overlay.querySelector('#admDocClinic').value.trim()
    }).toString();
    try {
      const res = await fetch('../api/admin_api.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Saved', 'success');
        close();
        await loadAdminDoctorsList();
        await refreshAdminOverviewStats();
      } else showToast(json.message || 'Failed', 'error');
    } catch (e) {
      showToast('Server error', 'error');
    }
  });
}

async function adminDeletePatientConfirm(userId) {
  if (!await showConfirm('Delete this patient account? An email will be sent to their address. This cannot be undone.', { confirmText: 'Delete account', type: 'danger' })) return;
  const body = new URLSearchParams({ action: 'admin_delete_patient', user_id: String(userId) }).toString();
  try {
    const res = await fetch('../api/admin_api.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Removed', 'success');
      await loadAdminPatientsList();
      await refreshAdminOverviewStats();
    } else showToast(json.message || 'Failed', 'error');
  } catch (e) {
    showToast('Server error', 'error');
  }
}

async function adminDeleteDoctorConfirm(userId) {
  if (!await showConfirm('Delete this doctor account? An email will be sent to their address. This cannot be undone.', { confirmText: 'Delete account', type: 'danger' })) return;
  const body = new URLSearchParams({ action: 'admin_delete_doctor', user_id: String(userId) }).toString();
  try {
    const res = await fetch('../api/admin_api.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Removed', 'success');
      await loadAdminDoctorsList();
      await refreshAdminOverviewStats();
    } else showToast(json.message || 'Failed', 'error');
  } catch (e) {
    showToast('Server error', 'error');
  }
}


function previewPatientReport(fileType, url) {
  const box = document.getElementById('reportPreviewBox');
  if (!box) return;
  const ft = (fileType || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ft)) {
    box.innerHTML = `<div style="margin-top:8px;"><img src="${url}" alt="Report preview" style="max-width:100%;border:1px solid var(--border);border-radius:8px;"></div>`;
    return;
  }
  if (ft === 'pdf') {
    box.innerHTML = `<iframe src="${url}" title="PDF Preview" style="width:100%;height:420px;border:1px solid var(--border);border-radius:8px;"></iframe>`;
    return;
  }
  box.innerHTML = `<div style="padding:10px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;">Preview is not supported for this file type. Use View to open it.</div>`;
}

async function deletePatientReport(id) {
  if (!await showConfirm('Delete this report? This action cannot be undone.', { confirmText: 'Delete', type: 'danger' })) return;
  const res = await fetch('../api/patient_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `action=delete_report&id=${id}`
  });
  const json = await res.json();
  if (json.success) {
    showToast('Report deleted', 'success');
    loadPatientReports();
  } else {
    showToast(json.message || 'Delete failed', 'error');
  }
}

async function loadPatientProfile() {
  const form = document.getElementById('patientProfileForm');
  if (!form) return;
  const res = await fetch('../api/dashboard_data.php?type=patient_profile');
  const json = await res.json();
  if (!json.success || !json.data) return;
  Object.entries({
    name: json.data.name || '',
    phone: json.data.phone || '',
    age: json.data.age || '',
    gender: json.data.gender || '',
    blood_group: json.data.blood_group || '',
    address: json.data.address || '',
    emergency: json.data.emergency_contact || ''
  }).forEach(([k, v]) => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) el.value = v;
  });

  // Handle Profile Image
  const imgUrl = json.data.profile_image ? `../uploads/${json.data.profile_image}` : null;
  const initial = (json.data.name || 'U').charAt(0).toUpperCase();

  // Update Profile Tab Preview
  const previewImg = document.getElementById('profileImageDisplay');
  const previewInit = document.getElementById('profileImageInitial');
  if (imgUrl) {
    if (previewImg) { previewImg.src = imgUrl; previewImg.style.display = 'block'; }
    if (previewInit) previewInit.style.display = 'none';
  } else {
    if (previewImg) previewImg.style.display = 'none';
    if (previewInit) { previewInit.textContent = initial; previewInit.style.display = 'block'; }
  }

  // Update Dashboard Wide Avatars (Sidebar & Top Bar)
  document.querySelectorAll('.su-avatar, .top-avatar').forEach(el => {
    if (imgUrl) {
      el.innerHTML = `<img src="${imgUrl}" onerror="this.style.display='none'; this.parentElement.textContent='${initial}'" alt="Avatar">`;
    } else {
      el.textContent = initial;
    }
  });

  // Toggle Remove Button
  const removeBtn = document.getElementById('removeProfileImageBtn');
  if (removeBtn) removeBtn.style.display = imgUrl ? 'inline-flex' : 'none';
}

// Profile Image Preview Listener
document.addEventListener('change', (e) => {
  if (e.target.id === 'profileImageInput') {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const previewImg = document.getElementById('profileImageDisplay');
        const previewInit = document.getElementById('profileImageInitial');
        if (previewImg) {
          previewImg.src = event.target.result;
          previewImg.style.display = 'block';
        }
        if (previewInit) previewInit.style.display = 'none';

        // Show Remove Button during preview
        const removeBtn = document.getElementById('removeProfileImageBtn');
        if (removeBtn) removeBtn.style.display = 'inline-flex';
      };
      reader.readAsDataURL(file);
    }
  }
});

async function removeProfileImage() {
  if (!await showConfirm('Are you sure you want to remove your profile photo?', { confirmText: 'Remove', type: 'danger' })) return;
  
  const role = window.location.pathname.toLowerCase().includes('doctor.') ? 'doctor' : 'patient';
  const api = role === 'doctor' ? '../api/doctor_api.php' : '../api/patient_api.php';
  
  const res = await fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'action=remove_profile_image'
  });
  
  const json = await res.json();
  if (json.success) {
    showToast('Photo removed', 'success');
    if (role === 'doctor') loadDoctorProfile();
    else loadPatientProfile();
    
    // Clear the file input if any
    const input = document.getElementById('profileImageInput');
    if (input) input.value = '';
  } else {
    showToast(json.message || 'Removal failed', 'error');
  }
}

async function loadDoctorAppointments() {
  const container = document.getElementById('doctorAppointmentsList');
  if (!container) return;
  try {
    const res = await fetch('../api/dashboard_data.php?type=doctor_appointments');
    const json = await res.json();
    if (!json.success || !json.data || json.data.length === 0) {
      container.innerHTML = '<div class="empty-state">No appointments found.</div>';
      return;
    }
    container.innerHTML = json.data.map(a => {
      const timeShort = formatApptTimeDisplay(a.appointment_time);
      const propTime = a.proposed_appointment_time ? formatApptTimeDisplay(a.proposed_appointment_time) : '';
      const statusClass = a.status === 'confirmed' || a.status === 'completed' ? 'badge-success' : (a.status === 'pending' ? 'badge-warning' : 'badge-danger');
      
      return `
      <div class="doctor-appointment-card ${a.status}">
        <div class="dr-appt-main">
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="patient-avatar-circle" id="appt-avatar-${a.id}" style="width:40px; height:40px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; overflow:hidden; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                ${a.profile_image && a.profile_image.trim() ? `<img src="../uploads/${a.profile_image}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span>${a.patient_name.charAt(0)}</span>'" style="width:100%; height:100%; object-fit:cover;">` : `<span>${a.patient_name.charAt(0)}</span>`}
              </div>
              <div>
                <div class="dr-appt-patient-name" style="margin-bottom:2px;">${a.patient_name}</div>
                <div class="dr-appt-meta" style="font-size:11px;">
                  <span><i class="fas fa-phone-alt"></i> ${a.patient_phone || 'No phone'}</span>
                  <span>·</span>
                  <span style="font-weight:700;color:var(--primary);">${a.type.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:6px;">
              <span class="badge" style="background:#f0f7ff; color:#0052cc; border:none; padding:3px 8px; font-size:10px; border-radius:4px;">
                <i class="fas fa-birthday-cake"></i> ${a.age ? a.age + ' yrs' : '-'}
              </span>
              <span class="badge" style="background:#fff0f6; color:#c4127b; border:none; padding:3px 8px; font-size:10px; border-radius:4px;">
                <i class="fas fa-${(a.gender||'').toLowerCase() === 'female' ? 'venus' : 'mars'}"></i> ${a.gender || '-'}
              </span>
              <span class="badge" style="background:#fff1f0; color:#cf1322; border:none; padding:3px 8px; font-size:10px; border-radius:4px;">
                <i class="fas fa-tint"></i> ${a.blood_group || '-'}
              </span>
              ${a.disease ? `
                <span class="badge" style="background:#f6ffed; color:#389e0d; border:none; padding:3px 8px; font-size:10px; border-radius:4px;">
                  <i class="fas fa-stethoscope"></i> ${a.disease}
                </span>
              ` : ''}
            </div>
            
            <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
              <div class="dr-appt-info-row">
                <i class="fas fa-calendar-day"></i>
                <span>${a.appointment_date} at ${timeShort}</span>
              </div>

              ${a.proposed_appointment_date ? `
                <div style="margin-top:4px;padding:8px 12px;background:#fffbeb;border-radius:8px;border:1px solid #fcd34d;font-size:12px;color:#92400e;">
                  <i class="fas fa-hourglass-half"></i> <strong>Awaiting approval:</strong> ${a.proposed_appointment_date} @ ${propTime || a.proposed_appointment_time}
                </div>
              ` : ''}

              ${a.status !== 'cancelled' && a.meet_link ? `
                <div class="dr-appt-info-row" style="margin-top:2px;">
                  <i class="fas fa-video"></i>
                  <a href="${a.meet_link}" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;">Join Call</a>
                </div>
              ` : ''}
            </div>
            
            ${a.patient_notes ? `
              <div class="dr-appt-notes">
                <i class="fas fa-comment-medical" style="color:var(--muted);margin-top:2px;"></i>
                <div><strong>Patient Notes:</strong> ${a.patient_notes}</div>
              </div>
            ` : ''}
          </div>

          <div class="dr-appt-right">
            <span class="badge ${statusClass}" style="padding: 6px 12px; font-size: 10px;">${a.status}</span>
            ${a.status === 'cancelled' ? `
              <button type="button" class="dr-btn-delete" onclick="doctorDeleteCancelledAppointment(${a.id})">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
            ` : ''}
          </div>
        </div>

        ${a.status !== 'cancelled' ? `
        <div class="dr-appt-footer">
          ${a.status === 'pending' ? `<button class="btn btn-primary" onclick="doctorUpdateAppointmentStatus(${a.id}, 'confirm_appointment')"><i class="fas fa-check"></i> Confirm</button>` : ''}
          ${a.status === 'confirmed' ? `<button class="btn" style="background:#ecfdf5;color:#166534;border:1px solid #bbf7d0;" onclick="doctorUpdateAppointmentStatus(${a.id}, 'complete_appointment')"><i class="fas fa-flag-checkered"></i> Complete</button>` : ''}
          <button class="btn" style="background:rgba(239,68,68,0.08);color:var(--danger);border:none;" onclick="doctorUpdateAppointmentStatus(${a.id}, 'cancel_appointment')"><i class="fas fa-times"></i> Cancel</button>
          <button type="button" class="btn" style="background:var(--bg);border:1px solid var(--border);" onclick="openRescheduleModal(${a.id}, '${a.appointment_date}', '${timeShort}')"><i class="fas fa-calendar-alt"></i> Reschedule</button>
          <button class="btn" style="background:#eff6ff;color:#1e40af;border:1px solid #dbeafe;" onclick="manageMeetLink(${a.id}, ${a.meet_link ? `'${encodeURIComponent(a.meet_link)}'` : 'null'})"><i class="fas fa-link"></i> Link</button>
          <button class="btn" style="background:var(--card);color:var(--text);border:1px solid var(--border);" onclick="manageAppointment(${a.id})"><i class="fas fa-file-medical"></i> Record</button>
        </div>
        ` : ''}
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Could not load appointments.</div>';
  }
}

async function loadDoctorSchedule() {
  const wrapper = document.getElementById('doctorScheduleRows');
  if (!wrapper) return;
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const res = await fetch('../api/dashboard_data.php?type=doctor_schedule');
  const json = await res.json();
  const map = {};
  (json.data || []).forEach(r => { map[r.day_of_week] = r; });
  wrapper.className = '';

  // Add Header Row for Clarity
  const headerHtml = `
    <div style="display:grid;grid-template-columns:130px 100px 1fr 1fr;gap:10px;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid var(--border);font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;">
      <div>Day</div>
      <div>Availability</div>
      <div>Start Time</div>
      <div>End Time</div>
    </div>
  `;

  wrapper.innerHTML = headerHtml + days.map(day => {
    const row = map[day] || { is_available: 0, start_time: '09:00:00', end_time: '17:00:00', slot_duration: 30 };
    const isOpen = parseInt(row.is_available, 10) === 1;
    return `
      <div id="row-${day}" class="schedule-row ${isOpen ? '' : 'inactive'}" style="display:grid;grid-template-columns:130px 100px 1fr 1fr;gap:10px;align-items:center;margin-bottom:10px;padding:8px;border-radius:12px;transition:0.3s;">
        <strong style="text-transform:capitalize;font-size:14px;color:var(--text);">${day}</strong>
        <label class="switch" title="Toggle Availability">
          <input type="checkbox" name="${day}_available" ${isOpen ? 'checked' : ''} onchange="toggleScheduleRow('${day}')">
          <span class="slider"></span>
        </label>
        <input type="time" name="${day}_start" value="${(row.start_time || '09:00:00').slice(0,5)}" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:13px;width:100%;" onchange="validateScheduleRow('${day}')">
        <input type="time" name="${day}_end" value="${(row.end_time || '17:00:00').slice(0,5)}" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:13px;width:100%;" onchange="validateScheduleRow('${day}')">
      </div>
    `;
  }).join('');
}

function toggleScheduleRow(day) {
  const row = document.getElementById(`row-${day}`);
  const sitsOn = row.querySelector(`[name="${day}_available"]`).checked;
  if (sitsOn) row.classList.remove('inactive');
  else row.classList.add('inactive');
}

function validateScheduleRow(day) {
  const startEl = document.querySelector(`[name="${day}_start"]`);
  const endEl = document.querySelector(`[name="${day}_end"]`);
  if (!startEl || !endEl) return true;

  const startValue = startEl.value;
  const endValue = endEl.value;
  
  if (startValue && endValue && startValue >= endValue) {
    startEl.classList.add('input-error');
    endEl.classList.add('input-error');
    return false;
  } else {
    startEl.classList.remove('input-error');
    endEl.classList.remove('input-error');
    return true;
  }
}

function copyMondayToAll() {
  const mondayStart = document.querySelector('[name="monday_start"]')?.value;
  const mondayEnd = document.querySelector('[name="monday_end"]')?.value;
  
  if (!mondayStart || !mondayEnd) {
    showToast('Please set Monday hours first', 'warning');
    return;
  }

  const days = ['tuesday','wednesday','thursday','friday','saturday','sunday'];
  days.forEach(day => {
    const available = document.querySelector(`[name="${day}_available"]`);
    if (available && available.checked) {
       const start = document.querySelector(`[name="${day}_start"]`);
       const end = document.querySelector(`[name="${day}_end"]`);
       if (start) start.value = mondayStart;
       if (end) end.value = mondayEnd;
       validateScheduleRow(day);
    }
  });
  showToast('Applied Monday hours to all open days', 'success');
}

async function loadDoctorPatients() {
  const container = document.getElementById('doctorPatientsList');
  if (!container) return;
  const res = await fetch('../api/dashboard_data.php?type=doctor_patients');
  const json = await res.json();
  console.log('Doctor Patients Data:', json.data);
  if (!json.success || !json.data || json.data.length === 0) {
    container.innerHTML = '<div class="empty-state">No patients found yet.</div>';
    return;
  }
  container.innerHTML = json.data.map(p => `
    <div style="padding:16px; border:1px solid var(--border); border-radius:16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-start; background:var(--card); transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
      <div style="display:flex; gap:16px;">
        <div class="patient-avatar-circle" id="pat-avatar-${p.id}" style="width:56px; height:56px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:20px; overflow:hidden; border:2px solid #fff; box-shadow:0 3px 6px rgba(0,0,0,0.1); flex-shrink:0;">
          ${p.profile_image && p.profile_image.trim() ? `<img src="../uploads/${p.profile_image}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span>${p.name.charAt(0)}</span>'" style="width:100%; height:100%; object-fit:cover;">` : `<span>${p.name.charAt(0)}</span>`}
        </div>
        <div>
          <div style="font-weight:700; color:var(--text); font-size:16px; margin-bottom:2px;">${p.name}</div>
          <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">
            <i class="far fa-envelope"></i> ${p.email} · <i class="fas fa-phone-alt"></i> ${p.phone || '-'}
          </div>
          
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
            <span class="badge" style="background:#f0f7ff; color:#0052cc; border:none; padding:3px 8px; font-size:10px; border-radius:4px;">
              <i class="fas fa-birthday-cake"></i> ${p.age ? p.age + ' yrs' : '-'}
            </span>
            <span class="badge" style="background:#fff0f6; color:#c4127b; border:none; padding:3px 8px; font-size:10px; border-radius:4px;">
              <i class="fas fa-${(p.gender||'').toLowerCase() === 'female' ? 'venus' : 'mars'}"></i> ${p.gender || '-'}
            </span>
            <span class="badge" style="background:#fff1f0; color:#cf1322; border:none; padding:3px 8px; font-size:10px; border-radius:4px;">
              <i class="fas fa-tint"></i> ${p.blood_group || '-'}
            </span>
            ${p.disease ? `
              <span class="badge" style="background:#f6ffed; color:#389e0d; border:none; padding:3px 8px; font-size:10px; border-radius:4px;">
                <i class="fas fa-stethoscope"></i> ${p.disease}
              </span>
            ` : ''}
          </div>

          <div style="font-size:11px; color:var(--muted); display:flex; align-items:center; gap:12px;">
            <span><i class="fas fa-id-badge" style="color:var(--primary);"></i> ID: #${p.id}</span>
            ${p.address ? `<span><i class="fas fa-map-marker-alt"></i> ${p.address}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <div style="font-size:10px; color:var(--muted); font-weight:600; text-transform:uppercase;">Last Visit: ${p.last_appointment ? p.last_appointment.split(' ')[0] : 'Never'}</div>
        <button class="btn btn-primary" style="font-size:12px; padding:8px 16px; display:flex; align-items:center; gap:8px; border-radius:8px;" onclick="viewPatientReportsByDoctor(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.age || '-'}', '${p.gender || '-'}', '${p.blood_group || '-'}', '${p.profile_image || ''}')">
          <i class="fas fa-file-medical"></i> Medical Report
        </button>
      </div>
    </div>
  `).join('');
}

async function viewPatientReportsByDoctor(patientId, patientName, age, gender, blood, profileImage) {
  const modal = document.getElementById('doctorPatientReportsModal');
  const title = document.getElementById('reportsModalTitle');
  const subtitle = document.getElementById('reportsModalSubtitle');
  const content = document.getElementById('reportsModalContent');
  if (!modal || !content) return;

  // Header with Avatar
  const avatarHtml = (profileImage && profileImage.trim())
    ? `<img src="../uploads/${profileImage}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\'width:40px; height:40px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.1);\'>${patientName.charAt(0)}</div>'" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.1);">`
    : `<div style="width:40px; height:40px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.1);">${patientName.charAt(0)}</div>`;

  title.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px;">
      ${avatarHtml}
      <span>${patientName}</span>
    </div>
  `;
  
  if (subtitle) {
    subtitle.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;">
        <span class="badge" style="background:rgba(0,82,204,0.05); color:#0052cc; border:none; font-size:10px;">Age: ${age}</span>
        <span class="badge" style="background:rgba(196,18,123,0.05); color:#c4127b; border:none; font-size:10px;">Sex: ${gender}</span>
        <span class="badge" style="background:rgba(207,19,34,0.05); color:#cf1322; border:none; font-size:10px;">Blood: ${blood}</span>
      </div>
    `;
  }
  content.innerHTML = '<div class="empty-state">Loading reports...</div>';
  modal.style.display = 'flex';

  try {
    const res = await fetch(`../api/dashboard_data.php?type=doctor_patient_reports&patient_id=${patientId}`);
    const json = await res.json();
    if (json.success && json.data && json.data.length > 0) {
      content.innerHTML = `
        <div class="reports-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:15px; padding:5px;">
          ${json.data.map(r => {
            let icon = 'fa-file-alt';
            let color = '#64748b';
            if (r.file_type === 'pdf') { icon = 'fa-file-pdf'; color = '#ef4444'; }
            else if (['jpg', 'jpeg', 'png'].includes(r.file_type)) { icon = 'fa-file-image'; color = '#3b82f6'; }
            else if (['doc', 'docx'].includes(r.file_type)) { icon = 'fa-file-word'; color = '#2563eb'; }

            return `
              <div style="border:1px solid var(--border); border-radius:10px; padding:12px; background:var(--bg); text-align:center;">
                <div style="font-size:24px; color:${color}; margin-bottom:8px;"><i class="fas ${icon}"></i></div>
                <div style="font-size:11px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.file_name}">${r.file_name}</div>
                <div style="font-size:10px; color:var(--muted); margin:4px 0 10px;">${new Date(r.uploaded_at).toLocaleDateString()}</div>
                <a href="../uploads/${r.file_path}" target="_blank" class="btn" style="width:100%; padding:4px; font-size:11px; background:var(--card); border:1px solid var(--border); display:inline-block; text-decoration:none; color:var(--primary);">View</a>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="empty-state" style="text-align:center; padding:30px;">
          <i class="fas fa-folder-open" style="font-size:40px; color:var(--muted); opacity:0.3; margin-bottom:15px; display:block;"></i>
          <p style="color:var(--muted);">${json.message || 'No reports uploaded for this patient.'}</p>
        </div>
      `;
    }
  } catch (err) {
    content.innerHTML = '<div class="empty-state">Error loading records.</div>';
    console.error(err);
  }
}

async function loadDoctorProfile() {
  const form = document.getElementById('doctorProfileForm');
  if (!form) return;
  const res = await fetch('../api/dashboard_data.php?type=doctor_profile');
  const json = await res.json();
  if (!json.success || !json.data) return;
  Object.entries({
    name: json.data.name || '',
    phone: json.data.phone || '',
    specialization: json.data.specialization || '',
    qualification: json.data.qualification || '',
    experience: json.data.experience_years || '',
    clinic_name: json.data.clinic_name || '',
    clinic_phone: json.data.clinic_phone || '',
    fees: json.data.fees || '',
    clinic_address: json.data.clinic_address || ''
  }).forEach(([k, v]) => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) el.value = v;
  });

  // Handle Profile Image
  const imgUrl = json.data.profile_image ? `../uploads/${json.data.profile_image}` : null;
  const initial = (json.data.name || 'D').charAt(0).toUpperCase();

  // Update Profile Tab Preview
  const previewImg = document.getElementById('profileImageDisplay');
  const previewInit = document.getElementById('profileImageInitial');
  if (imgUrl) {
    if (previewImg) { previewImg.src = imgUrl; previewImg.style.display = 'block'; }
    if (previewInit) previewInit.style.display = 'none';
  } else {
    if (previewImg) previewImg.style.display = 'none';
    if (previewInit) { previewInit.textContent = initial; previewInit.style.display = 'block'; }
  }

  // Update Dashboard Wide Avatars (Sidebar & Top Bar)
  document.querySelectorAll('.su-avatar, .top-avatar').forEach(el => {
    if (imgUrl) {
      el.innerHTML = `<img src="${imgUrl}" onerror="this.style.display='none'; this.parentElement.textContent='${initial}'" alt="Avatar">`;
    } else {
      el.textContent = initial;
    }
  });

  // Toggle Remove Button
  const removeBtn = document.getElementById('removeProfileImageBtn');
  if (removeBtn) removeBtn.style.display = imgUrl ? 'inline-flex' : 'none';
}

async function downloadUserList() {
   const role = document.getElementById('userFilterRole')?.value || 'all';

   try {
      const res = await fetch(`../api/dashboard_data.php?type=users&role=${role}`);
      const json = await res.json();

      if (!json.success || !json.data) throw new Error('Data fetch failed');

      // Create hidden report container
      const container = document.createElement('div');
      container.style.padding = '40px';
      container.style.fontFamily = "'Inter', sans-serif";
      
      const title = role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1) + 's';
      
      container.innerHTML = `
         <div style="text-align:center; border-bottom:2px solid #1e40af; margin-bottom:30px; padding-bottom:15px;">
            <h1 style="color:#1e40af; margin:0;">Med Alert Plus</h1>
            <p style="color:#64748b; margin:5px 0;">Comprehensive User Registration Report</p>
         </div>
         <div style="display:flex; justify-content:space-between; margin-bottom:20px; font-size:12px; color:#475569;">
            <span><strong>Role Filter:</strong> ${title}</span>
            <span><strong>Generated:</strong> ${new Date().toLocaleString()}</span>
         </div>
         <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
               <tr style="background:#f8fafc; border:1px solid #e2e8f0;">
                  <th style="padding:10px; text-align:left; border:1px solid #e2e8f0;">Name</th>
                  <th style="padding:10px; text-align:left; border:1px solid #e2e8f0;">Email</th>
                  <th style="padding:10px; text-align:left; border:1px solid #e2e8f0;">Phone</th>
                  <th style="padding:10px; text-align:center; border:1px solid #e2e8f0;">Role</th>
                  <th style="padding:10px; text-align:center; border:1px solid #e2e8f0;">Status</th>
               </tr>
            </thead>
            <tbody>
               ${json.data.map(u => `
                  <tr>
                     <td style="padding:10px; border:1px solid #e2e8f0;"><strong>${u.name}</strong></td>
                     <td style="padding:10px; border:1px solid #e2e8f0;">${u.email}</td>
                     <td style="padding:10px; border:1px solid #e2e8f0;">${u.phone || 'N/A'}</td>
                     <td style="padding:10px; border:1px solid #e2e8f0; text-align:center;">${u.role.toUpperCase()}</td>
                     <td style="padding:10px; border:1px solid #e2e8f0; text-align:center;">${u.status.toUpperCase()}</td>
                  </tr>
               `).join('')}
            </tbody>
         </table>
         <div style="margin-top:30px; text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:10px;">
            Confidential Admin Report - Generated via Med Alert Plus Dashboard
         </div>
      `;

      const opt = {
         margin: 10,
         filename: `User_Report_${role}_${new Date().getTime()}.pdf`,
         image: { type: 'jpeg', quality: 0.98 },
         html2canvas: { scale: 2 },
         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().from(container).set(opt).save();
      showToast('Report downloaded successfully', 'success');

   } catch (err) {
      console.error(err);
      showToast('Failed to generate report', 'error');
   }
}

function showHomeRemedies() {
    document.getElementById('resSummaryContainer').style.display = 'none';
    document.getElementById('resRemediesContainer').style.display = 'block';
}

function openBookingModal(id, name) {
   openPatientBookingModal(id, name);
}

async function loadAvailableDoctors(selectedDoctorId = null) {
  const sel = document.getElementById('bookDocId');
  const countEl = document.getElementById('availableDoctorsCount');
  if (!sel) return;
  sel.innerHTML = '<option value="">Loading doctors...</option>';
  try {
    const res = await fetch('../api/dashboard_data.php?type=available_doctors');
    const json = await res.json();
    const doctors = (json.success && Array.isArray(json.data)) ? json.data : [];
    if (doctors.length === 0) {
      sel.innerHTML = '<option value="">No registered doctors available</option>';
      if (countEl) countEl.textContent = 'Available doctors: 0';
      return;
    }
    sel.innerHTML = '<option value="">Select doctor</option>' + doctors.map((d) => {
      const openTag = (d.clinic_status === 'open') ? 'Open' : 'Closed';
      return `<option value="${d.id}">Dr. ${d.doctor_name} - ${d.specialization || 'General'} (${d.clinic_name || 'Clinic'}) [${openTag}]</option>`;
    }).join('');
    if (selectedDoctorId) {
      sel.value = String(selectedDoctorId);
    }
    if (countEl) countEl.textContent = `Available doctors: ${doctors.length}`;
  } catch (e) {
    sel.innerHTML = '<option value="">Failed to load doctors</option>';
    if (countEl) countEl.textContent = 'Available doctors: 0';
  }
}

function openPatientBookingModal(selectedDoctorId = null, _name = null) {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;
  
  // Reset form to "Book" state
  const form = document.getElementById('appointmentForm');
  if (form) {
    form.reset();
    const apptIdIn = document.getElementById('bookingApptId');
    if (apptIdIn) apptIdIn.value = '';
    const actionIn = form.querySelector('input[name="action"]');
    if (actionIn) actionIn.value = 'book_appointment';
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Confirm Booking';
  }
  
  const titleEl = document.getElementById('bookingModalTitle');
  if (titleEl) titleEl.textContent = 'Book Appointment';
  
  const docSel = document.getElementById('bookDocId');
  if (docSel) docSel.disabled = false;

  loadAvailableDoctors(selectedDoctorId);
  const dIn = document.getElementById('bookingDateInput');
  if (dIn) {
    const today = new Date().toISOString().slice(0, 10);
    dIn.min = today;
    if (dIn.value && dIn.value < today) dIn.value = today;
  }
  modal.style.display = 'flex';
}

async function openUpdateAppointmentModal(apptId) {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  try {
    // We need to fetch all appointments to get the details of this one
    // or we could add an API to fetch a single appointment. 
    // For now, let's fetch the list again or use a cache if we had one.
    // Since loadPatientAppointments doesn't cache, let's fetch.
    const res = await fetch('../api/dashboard_data.php?type=patient_appointments');
    const json = await res.json();
    if (!json.success) return;
    const a = json.data.find(x => Number(x.id) === Number(apptId));
    if (!a) return;

    const form = document.getElementById('appointmentForm');
    if (!form) return;

    // Set "Update" state
    const titleEl = document.getElementById('bookingModalTitle');
    if (titleEl) titleEl.textContent = 'Update Appointment';
    
    const apptIdIn = document.getElementById('bookingApptId');
    if (apptIdIn) apptIdIn.value = apptId;
    
    const actionIn = form.querySelector('input[name="action"]');
    if (actionIn) actionIn.value = 'update_appointment';
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Changes';

    // Populate fields
    await loadAvailableDoctors(a.doctor_id);
    const docSel = document.getElementById('bookDocId');
    if (docSel) docSel.disabled = true; // Cannot change doctor

    form.querySelector('[name="type"]').value = a.type;
    form.querySelector('[name="date"]').value = a.appointment_date;
    form.querySelector('[name="time"]').value = formatApptTimeDisplay(a.appointment_time);
    form.querySelector('[name="notes"]').value = a.patient_notes || '';

    modal.style.display = 'flex';
  } catch (e) {
    showToast('Could not load appointment details', 'error');
  }
}

/** @returns {string|null} error message or null if ok */
function validatePatientBookingForm(dateStr, timeStr) {
  if (!dateStr || !timeStr) return 'Date and time are required.';
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr < today) return 'Cannot book a date in the past.';
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!m) return 'Choose a valid time.';
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const total = h * 60 + min;
  if (total < 10 * 60 || total > 18 * 60) {
    return 'Time must be between 10:00 AM and 6:00 PM.';
  }
  const start = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
  if (Number.isNaN(start.getTime())) return 'Invalid date or time.';
  if (start.getTime() <= Date.now()) return 'Choose a future time (not in the past).';
  return null;
}

function closeModal(id) {
   document.getElementById(id).style.display = 'none';
}

const apptForm = document.getElementById('appointmentForm');
if (apptForm) {
  apptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Enable doctor select temporarily to include it in FormData if needed by backend validation (though we ignore it for update)
    const docSel = document.getElementById('bookDocId');
    const wasDisabled = docSel ? docSel.disabled : false;
    if (docSel) docSel.disabled = false;
    const dataObj = new FormData(apptForm);
    if (docSel) docSel.disabled = wasDisabled;

    const dateVal = dataObj.get('date');
    const timeVal = dataObj.get('time');
    const err = validatePatientBookingForm(typeof dateVal === 'string' ? dateVal : '', typeof timeVal === 'string' ? timeVal : '');
    if (err) { showToast(err, 'warning'); return; }

    try {
      const res = await fetch('../api/patient_api.php', { method: 'POST', body: dataObj });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        closeModal('bookingModal');
        loadPatientAppointments();
        // Update stats if on overview
        if (typeof initDashboard === 'function') initDashboard(); 
        if (typeof showTab === 'function') showTab('appointments');
      } else showToast(data.message, 'error');
    } catch (err) { showToast('Server error', 'error'); }
  });
}

// ---- Health Analytics Logic ----
let vChart1 = null, vChart2 = null;

async function loadHealthAnalytics() {
  try {
    const res = await fetch('../api/dashboard_data.php?type=patient_vitals');
    const json = await res.json();
    if (!json.success) return;

    const vitals = json.data || [];
    updateHealthSummary(vitals);
    renderVitalsCharts(vitals);
    renderVitalsHistory(vitals);
  } catch (e) {
    console.error('Failed to load health analytics', e);
  }
}

function generateHealthSummaryHtml(last) {
  if (!last) return '<div class="empty-state">No vitals logged yet.</div>';

  let bmiHtml = '';
  if (last.weight && last.height) {
    const bmi = (last.weight / Math.pow(last.height / 100, 2)).toFixed(1);
    let cat = 'Normal', color = 'var(--success)';
    if (bmi < 18.5) { cat = 'Underweight'; color = '#3b82f6'; }
    else if (bmi >= 25 && bmi < 30) { cat = 'Overweight'; color = 'var(--warning)'; }
    else if (bmi >= 30) { cat = 'Obese'; color = 'var(--danger)'; }
    
    bmiHtml = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:36px;font-weight:800;color:${color}">${bmi}</div>
        <div style="font-size:14px;font-weight:600;color:var(--text-light)">BMI Index: <span style="color:${color}">${cat}</span></div>
      </div>
    `;
  }

  let bpHtml = '';
  if (last.bp_systolic && last.bp_diastolic) {
    let bpCat = 'Normal', bpColor = 'var(--success)';
    if (last.bp_systolic >= 140 || last.bp_diastolic >= 90) { bpCat = 'Stage 2 Hypertension'; bpColor = 'var(--danger)'; }
    else if (last.bp_systolic >= 130 || last.bp_diastolic >= 80) { bpCat = 'Stage 1 Hypertension'; bpColor = 'var(--warning)'; }
    else if (last.bp_systolic >= 120) { bpCat = 'Elevated'; bpColor = '#fcd34d'; }

    bpHtml = `
      <div style="padding:15px;background:var(--bg);border-radius:12px;margin-bottom:15px;border:1px solid var(--border)">
        <div style="font-size:12px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">Blood Pressure</div>
        <div style="font-size:18px;font-weight:700">${last.bp_systolic}/${last.bp_diastolic} <span style="font-size:12px;font-weight:600;color:${bpColor};margin-left:8px">${bpCat}</span></div>
      </div>
    `;
  }

  let sugarHtml = '';
  if (last.sugar_level) {
    let sCat = 'Normal', sColor = 'var(--success)';
    if (last.sugar_level >= 200) { sCat = 'High (Diabetic)'; sColor = 'var(--danger)'; }
    else if (last.sugar_level >= 140) { sCat = 'Pre-diabetic'; sColor = 'var(--warning)'; }

    sugarHtml = `
      <div style="padding:15px;background:var(--bg);border-radius:12px;border:1px solid var(--border)">
        <div style="font-size:12px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">Blood Sugar</div>
        <div style="font-size:18px;font-weight:700">${last.sugar_level} mg/dL <span style="font-size:12px;font-weight:600;color:${sColor};margin-left:8px">${sCat}</span></div>
      </div>
    `;
  }

  return bmiHtml + bpHtml + sugarHtml;
}

function updateHealthSummary(vitals) {
  const container = document.getElementById('vitalsSummary');
  const snapshot = document.getElementById('patientVitalsSnapshot');
  if (!vitals || vitals.length === 0) {
    const empty = '<div class="empty-state">No vitals logged yet.</div>';
    if (container) container.innerHTML = empty;
    if (snapshot) snapshot.innerHTML = empty;
    return;
  }

  const last = vitals[vitals.length - 1]; 
  const html = generateHealthSummaryHtml(last);
  if (container) container.innerHTML = html;
  if (snapshot) snapshot.innerHTML = html;
}

function renderVitalsCharts(vitals) {
  const ctx1 = document.getElementById('mainVitalsChart')?.getContext('2d');
  const ctx2 = document.getElementById('sugarChart')?.getContext('2d');
  if (!ctx1 || !ctx2) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#cbd5e1' : '#475569';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const labels = vitals.map(v => new Date(v.log_date).toLocaleDateString(undefined, {month:'short', day:'numeric'}));
  
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor, font: { family: 'Figtree', weight: '600' } }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor }
      }
    }
  };

  if (vChart1) vChart1.destroy();
  vChart1 = new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Weight (kg)', data: vitals.map(v => v.weight), borderColor: '#3b82f6', backgroundColor: '#3b82f6', tension: 0.3, yAxisID: 'y' },
        { label: 'BP Systolic', data: vitals.map(v => v.bp_systolic), borderColor: '#ef4444', backgroundColor: '#ef4444', tension: 0.3, yAxisID: 'y1' }
      ]
    },
    options: {
      ...commonOptions,
      scales: { 
        x: commonOptions.scales.x,
        y: { ...commonOptions.scales.y, type: 'linear', display: true, position: 'left', title: {display:true, text:'Weight', color: textColor} },
        y1: { type: 'linear', display: true, position: 'right', grid:{drawOnChartArea:false}, title: {display:true, text:'BP', color: textColor}, ticks: {color: textColor} }
      }
    }
  });

  if (vChart2) vChart2.destroy();
  vChart2 = new Chart(ctx2, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Blood Sugar (mg/dL)', data: vitals.map(v => v.sugar_level), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 }]
    },
    options: commonOptions
  });
}

function renderVitalsHistory(vitals) {
  const container = document.getElementById('vitalsHistory');
  if (!container) return;
  if (vitals.length === 0) {
    container.innerHTML = '<div class="empty-state">No historical logs.</div>';
    return;
  }

  let html = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:var(--bg);text-align:left;">
          <th style="padding:12px 16px;border-bottom:1px solid var(--border)">Date</th>
          <th style="padding:12px 16px;border-bottom:1px solid var(--border)">Weight</th>
          <th style="padding:12px 16px;border-bottom:1px solid var(--border)">BP</th>
          <th style="padding:12px 16px;border-bottom:1px solid var(--border)">Sugar</th>
          <th style="padding:12px 16px;border-bottom:1px solid var(--border)">Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  [...vitals].reverse().forEach(v => {
    html += `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid var(--border)">${new Date(v.log_date).toLocaleDateString()}</td>
        <td style="padding:12px 16px;border-bottom:1px solid var(--border)">${v.weight || '-'} kg</td>
        <td style="padding:12px 16px;border-bottom:1px solid var(--border)">${v.bp_systolic || '-'}/${v.bp_diastolic || '-'}</td>
        <td style="padding:12px 16px;border-bottom:1px solid var(--border)">${v.sugar_level || '-'} mg/dL</td>
        <td style="padding:12px 16px;border-bottom:1px solid var(--border)">
          <button onclick="deleteVitalsRecord(${v.id})" style="border:none;background:none;color:var(--danger);cursor:pointer;padding:4px"><i class="fas fa-trash-alt"></i></button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

async function deleteVitalsRecord(id) {
  if (!await showConfirm('Delete this vital log entry?', { confirmText: 'Delete', type: 'danger' })) return;
  const res = await fetch('../api/patient_api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `action=delete_vitals&id=${id}`
  });
  if ((await res.json()).success) {
    showToast('Log entry removed', 'success');
    loadHealthAnalytics();
  }
}

const vitalsForm = document.getElementById('vitalsForm');
if (vitalsForm) {
  vitalsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(vitalsForm);
    const res = await fetch('../api/patient_api.php', { method: 'POST', body: fd });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Logged', 'success');
      vitalsForm.reset();
      loadHealthAnalytics();
    } else {
      showToast(json.message || 'Failed', 'error');
    }
  });
}

// Init sub-tab loads
async function initDashboard() {
   let role = '';
   const path = window.location.pathname.toLowerCase();
   if (path.includes('patient.')) role = 'patient';
   if (path.includes('doctor.')) role = 'doctor';
   if (path.includes('admin.')) role = 'admin';

   if (role) {
       try {
           const res = await fetch('../api/dashboard_data.php?type=initial_load');
           if (res.redirected) { window.location.href = '../login.html'; return; }
           const json = await res.json();
           
           if (!json.success || !json.user || json.user.role !== role) {
               window.location.href = '../login.html';
               return;
           }

           // Populate user info
           document.querySelectorAll('.su-name').forEach(el => el.textContent = role === 'doctor' ? 'Dr. ' + json.user.name : json.user.name);
           document.querySelectorAll('.su-avatar, .top-avatar').forEach(el => el.textContent = (json.user.name || 'U').charAt(0).toUpperCase());

           if (role === 'doctor' && json.user.specialization) {
               document.querySelectorAll('.su-role').forEach(el => el.textContent = json.user.specialization);
               const cl = document.getElementById('clinicToggleLabel');
               if (cl) {
                   cl.className = 'badge ' + (json.user.clinic_status === 'open' ? 'badge-success' : 'badge-danger');
                   cl.textContent = json.user.clinic_status.toUpperCase();
               }
           }

           // Populate stats
           if (json.data && json.data.stats) {
               const st = json.data.stats;
               if (role === 'patient') {
                   if (document.getElementById('stat-totalAppt')) document.getElementById('stat-totalAppt').textContent = st.totalAppt || 0;
                   if (document.getElementById('stat-totalMeds')) document.getElementById('stat-totalMeds').textContent = st.totalMeds || 0;
                   if (document.getElementById('stat-pendingAppt')) document.getElementById('stat-pendingAppt').textContent = st.pendingAppt || 0;
                   if (document.getElementById('stat-sympChecks')) document.getElementById('stat-sympChecks').textContent = st.sympChecks || 0;
                   
                   const upCont = document.getElementById('patientUpcomingAppts');
                   if (upCont && json.data.upcoming) {
                       if (json.data.upcoming.length === 0) upCont.innerHTML = '<div class="empty-state">No upcoming appointments.</div>';
                       else {
                           upCont.innerHTML = json.data.upcoming.map(a => `
                               <div class="patient-appointment-card ${a.status}" style="padding: 16px; margin-bottom: 12px; font-size: 13px;">
                                   <div class="patient-appt-dr-name" style="font-size: 16px;">Dr. ${a.doctor_name || 'Doctor'}</div>
                                   <div class="patient-appt-status ${a.status}" style="margin-bottom: 8px;">${a.status}</div>
                                   <div class="patient-appt-info-row" style="font-size: 12px;">
                                       <i class="far fa-calendar-alt"></i>
                                       <span>${a.appointment_date} at ${formatApptTimeDisplay(a.appointment_time)}</span>
                                   </div>
                                   ${a.proposed_appointment_date ? `<div style="color:#b45309;font-weight:600;font-size:11px;margin-top:4px;"><i class="fas fa-exclamation-circle"></i> New time proposed — check appointments</div>` : ''}
                                   <div class="patient-appt-footer" style="margin-top: 12px;">
                                       <button class="patient-btn-details" style="padding: 8px 16px; font-size: 12px;" onclick="showTab('appointments')">
                                           <i class="fas fa-calendar-check"></i> Manage
                                       </button>
                                   </div>
                               </div>
                            `).join('');
                       }
                   }
                   // Fetch Vitals for Snapshot
                   loadHealthAnalytics();
                   loadPatientReports();
                   loadPatientProfile();
               }
               if (role === 'admin') {
                   const patientN = Number(st.patients ?? 0);
                   const doctorN = Number(st.doctors ?? 0);
                   if (document.getElementById('stat-users')) document.getElementById('stat-users').textContent = patientN;
                   if (document.getElementById('stat-doctors')) document.getElementById('stat-doctors').textContent = doctorN;
                   if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = st.pending || 0;
                   if (document.getElementById('stat-pending-overview')) document.getElementById('stat-pending-overview').textContent = st.pending || 0;
                   if (typeof drawUserDistributionChart === 'function') drawUserDistributionChart(patientN, doctorN);
               }
               if (role === 'doctor') {
                   if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = st.total || 0;
                   if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = st.pending || 0;
                   if (document.getElementById('stat-today')) document.getElementById('stat-today').textContent = st.today || 0;
                   
                   loadDoctorProfile();
               }
           }
           
           if (role === 'patient') {
               const today = new Date().toISOString().split('T')[0];
               if (document.getElementById('bookingDateInput')) document.getElementById('bookingDateInput').min = today;
               if (document.getElementById('vitalsLogDateObj')) {
                   document.getElementById('vitalsLogDateObj').max = today;
                   document.getElementById('vitalsLogDateObj').value = today;
               }
               if (document.getElementById('notifList')) loadPatientNotifications();
           }
       } catch (err) {
           console.error("Dashboard init error:", err);
       }
   }

   if (document.getElementById('medicineList')) {
     loadMedicines();
     if (role === 'patient') {
       const pingReminders = () => {
         fetch('../api/patient_reminder_ping.php', { credentials: 'same-origin' })
           .then((r) => r.json())
           .then((j) => {
             if (j.success && j.dispatched > 0 && typeof loadMedicines === 'function') loadMedicines();
           })
           .catch(() => {});
       };
       setTimeout(pingReminders, 8000);
       setInterval(pingReminders, 60000);
     }
   }
   if (document.getElementById('userManagementTable')) loadUserList();
   if (document.getElementById('patientAppointmentsList')) loadPatientAppointments();
   if (document.getElementById('patientReportsList')) loadPatientReports();
   if (document.getElementById('patientProfileForm')) loadPatientProfile();
   if (document.getElementById('doctorAppointmentsList')) loadDoctorAppointments();
   if (document.getElementById('doctorScheduleRows')) loadDoctorSchedule();
   if (document.getElementById('doctorPatientsList')) loadDoctorPatients();
   if (document.getElementById('doctorProfileForm')) loadDoctorProfile();
   if (document.getElementById('clinicAddressLine')) initClinicAddressAutocomplete();
   if (typeof initMedicineSuggestions === 'function') initMedicineSuggestions();
   if (typeof loadMedicineAdherenceSummary === 'function') loadMedicineAdherenceSummary();
}

document.addEventListener('DOMContentLoaded', initDashboard);


document.getElementById('patientAppointmentStatusFilter')?.addEventListener('change', loadPatientAppointments);
document.getElementById('patientAppointmentTypeFilter')?.addEventListener('change', loadPatientAppointments);
document.getElementById('reportSearchInput')?.addEventListener('input', loadPatientReports);
document.getElementById('reportTypeFilter')?.addEventListener('change', loadPatientReports);

const patientProfileForm = document.getElementById('patientProfileForm');
if (patientProfileForm) {
  patientProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(patientProfileForm);
    const res = await fetch('../api/patient_api.php', { method: 'POST', body: fd });
    const json = await res.json();
    showToast(json.message || (json.success ? 'Saved' : 'Failed'), json.success ? 'success' : 'error');
    if (json.success) {
        loadPatientProfile(); // Reload to update dashboard avatars
        setTimeout(() => showTab('overview'), 600);
    }
  });
}

const doctorProfileForm = document.getElementById('doctorProfileForm');
if (doctorProfileForm) {
  doctorProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(doctorProfileForm);
    const res = await fetch('../api/doctor_api.php', { method: 'POST', body: fd });
    const json = await res.json();
    showToast(json.message || (json.success ? 'Saved' : 'Failed'), json.success ? 'success' : 'error');
    if (json.success) {
        loadDoctorProfile(); // Sync avatars after save
        setTimeout(() => showTab('overview'), 600);
    }
  });

  // Doctor Specialization Suggestions (Profile Update)
  const medicalSpecializations = [
      "Cardiologist", "Dermatologist", "Endocrinologist", "Gastroenterologist", 
      "Hematologist", "Infectious Disease Specialist", "Nephrologist", 
      "Neurologist", "Obstetrician/Gynecologist (OB/GYN)", "Oncologist", 
      "Ophthalmologist", "Orthopedic Surgeon", "Otolaryngologist (ENT)", 
      "Pediatrician", "Psychiatrist", "Pulmonologist", "Radiologist", 
      "Rheumatologist", "Urologist", "Anesthesiologist", "Dermatopathologist", 
      "Emergency Medicine Specialist", "Family Medicine Physician", "Geriatrician", 
      "Medical Geneticist", "Pathologist", "Physical Medicine and Rehabilitation Specialist", 
      "Plastic Surgeon", "Preventive Medicine Specialist"
  ];

  const specInput = document.getElementById('doc_specialization_update');
  const specSuggestions = document.getElementById('specialization-suggestions-update');

  if (specInput && specSuggestions) {
      specInput.addEventListener('input', () => {
          const query = specInput.value.toLowerCase();
          specSuggestions.innerHTML = '';
          
          if (query.length < 2) {
              specSuggestions.style.display = 'none';
              return;
          }

          const filtered = medicalSpecializations.filter(s => s.toLowerCase().includes(query));
          
          if (filtered.length > 0) {
              specSuggestions.style.display = 'block';
              filtered.forEach(s => {
                  const div = document.createElement('div');
                  div.className = 'suggestion-item';
                  div.innerText = s;
                  div.onclick = () => {
                      specInput.value = s;
                      specSuggestions.style.display = 'none';
                  };
                  specSuggestions.appendChild(div);
              });
          } else {
              specSuggestions.style.display = 'none';
          }
      });

      document.addEventListener('click', (e) => {
          if (e.target !== specInput) specSuggestions.style.display = 'none';
      });
  }
}

const doctorScheduleForm = document.getElementById('doctorScheduleForm');
if (doctorScheduleForm) {
  doctorScheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      const schedule = days.map((day) => {
        if (!validateScheduleRow(day) && doctorScheduleForm.querySelector(`[name="${day}_available"]`).checked) {
            throw new Error(`Invalid time range on ${day}`);
        }
        return {
          day,
          available: doctorScheduleForm.querySelector(`[name="${day}_available"]`)?.checked ? 1 : 0,
          start: doctorScheduleForm.querySelector(`[name="${day}_start"]`)?.value || '09:00',
          end: doctorScheduleForm.querySelector(`[name="${day}_end"]`)?.value || '17:00',
          slot: 30 // Removed from UI, defaulting to 30 mins
        };
      });
      const body = new URLSearchParams({ action: 'save_schedule', schedule: JSON.stringify(schedule) }).toString();
      const res = await fetch('../api/doctor_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const json = await res.json();
      showToast(json.message || (json.success ? 'Schedule saved' : 'Save failed'), json.success ? 'success' : 'error');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function doctorUpdateAppointmentStatus(id, action) {
  if (!['confirm_appointment','cancel_appointment','complete_appointment'].includes(action)) return;
  // Simple confirmation for destructive actions
  if (action === 'cancel_appointment' && !await showConfirm('Cancel this appointment? This action cannot be undone.', { confirmText: 'Yes, Cancel', type: 'danger' })) return;
  const body = new URLSearchParams({ action, id }).toString();
  try {
    const res = await fetch('../api/doctor_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const json = await res.json();
    if (json.success) {
      showToast('Appointment updated', 'success');
      loadDoctorAppointments();
    } else {
      showToast(json.message || 'Update failed', 'error');
    }
  } catch (e) {
    showToast('Server error', 'error');
  }
}

async function doctorDeleteCancelledAppointment(id) {
  if (!id) return;
  if (!await showConfirm('Remove this cancelled appointment from your list permanently?', { confirmText: 'Delete', type: 'danger' })) return;
  try {
    const res = await fetch('../api/doctor_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'delete_cancelled_appointment', id: String(id) }).toString()
    });
    const json = await res.json();
    if (json.success) {
      showToast('Appointment removed', 'success');
      loadDoctorAppointments();
    } else {
      showToast(json.message || 'Could not delete', 'error');
    }
  } catch (e) {
    showToast('Server error', 'error');
  }
}

// ---- Medicine Suggestion Logic ----
const commonMedicines = [
  "Paracetamol", "Ibuprofen", "Aspirin", "Metformin", "Amoxicillin", "Lisinopril", 
  "Atorvastatin", "Amlodipine", "Simvastatin", "Omeprazole", "Levothyroxine", 
  "Albuterol", "Gabapentin", "Hydrochlorothiazide", "Losartan", "Sertraline", 
  "Montelukast", "Furosemide", "Fluticasone", "Cyclobenzaprine", "Ciprofloxacin",
  "Pantoprazole", "Prednisone", "Meloxicam", "Zolpidem", "Trazodone", "Tramadol",
  "Carvedilol", "Warfarin", "Clopidogrel", "Cetirizine", "Loratadine", "Fexofenadine",
  "Doxycycline", "Azithromycin", "Cephalexin", "Metoprolol", "Atenolol", "Propranolol"
];

function initMedicineSuggestions() {
  const input = document.getElementById('medicine_name_input');
  const suggestionBox = document.getElementById('medicine-suggestions');
  if (!input || !suggestionBox) return;

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    if (val.length < 2) {
      suggestionBox.style.display = 'none';
      return;
    }

    const matches = commonMedicines.filter(m => m.toLowerCase().includes(val));
    const fuzzyMatches = commonMedicines.filter(m => {
      const dist = getLevenshteinDistance(val, m.toLowerCase());
      return dist > 0 && dist <= 2 && !m.toLowerCase().includes(val);
    });

    let html = '';
    if (matches.length > 0) {
      html += `<div class="suggestion-header">Suggestions</div>`;
      matches.slice(0, 5).forEach(m => {
        html += `<div class="suggestion-item" onclick="selectMedicineSuggestion('${m}')">${m}</div>`;
      });
    }

    if (fuzzyMatches.length > 0 && matches.length < 3) {
      html += `<div class="suggestion-header">Did you mean?</div>`;
      fuzzyMatches.slice(0, 3).forEach(m => {
        html += `<div class="suggestion-item" onclick="selectMedicineSuggestion('${m}')">${m}</div>`;
      });
    }

    if (html) {
      suggestionBox.innerHTML = html;
      suggestionBox.style.display = 'block';
    } else {
      suggestionBox.style.display = 'none';
    }
  });

  // Hide suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
      suggestionBox.style.display = 'none';
    }
  });
}

function selectMedicineSuggestion(name) {
  const input = document.getElementById('medicine_name_input');
  const suggestionBox = document.getElementById('medicine-suggestions');
  if (input) {
    input.value = name;
    suggestionBox.style.display = 'none';
  }
}

function getLevenshteinDistance(s1, s2) {
  const m = s1.length, n = s2.length;
  const d = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

// ---- Medical Reports Logic ----
let allPatientReports = [];

async function loadPatientReports() {
  const container = document.getElementById('patientReportsList');
  if (!container) return;

  try {
    const res = await fetch('../api/dashboard_data.php?type=patient_reports');
    const json = await res.json();
    if (json.success) {
      allPatientReports = json.data || [];
      renderPatientReports(allPatientReports);
    }
  } catch (e) {
    console.error('Failed to load reports', e);
  }
}

function renderPatientReports(reports) {
  const container = document.getElementById('patientReportsList');
  if (!container) return;

  if (!Array.isArray(reports) || reports.length === 0) {
    container.innerHTML = `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <select id="reportTypeFilter" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;">
          <option value="all">All Types</option>
        </select>
      </div>
      <div class="empty-state" style="text-align:center;padding:40px 20px;color:var(--muted);">
        <i class="fas fa-file-medical-alt" style="font-size:40px;margin-bottom:15px;display:block;opacity:0.3;"></i>
        <p>No reports uploaded yet. Upload your first medical report to get started!</p>
      </div>
    `;
    return;
  }

  let html = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
      <select id="reportTypeFilter" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;">
        <option value="all" ${document.getElementById('reportTypeFilter')?.value === 'all' ? 'selected' : ''}>All Types (Showing All Uploaded Reports)</option>
        <option value="pdf" ${document.getElementById('reportTypeFilter')?.value === 'pdf' ? 'selected' : ''}>PDF Records</option>
        <option value="doc" ${document.getElementById('reportTypeFilter')?.value === 'doc' ? 'selected' : ''}>DOC / Word</option>
        <option value="docx" ${document.getElementById('reportTypeFilter')?.value === 'docx' ? 'selected' : ''}>DOCX / Word</option>
        <option value="jpg" ${document.getElementById('reportTypeFilter')?.value === 'jpg' ? 'selected' : ''}>JPG Images</option>
        <option value="jpeg" ${document.getElementById('reportTypeFilter')?.value === 'jpeg' ? 'selected' : ''}>JPEG Images</option>
        <option value="png" ${document.getElementById('reportTypeFilter')?.value === 'png' ? 'selected' : ''}>PNG Images</option>
      </select>
    </div>
    <div id="reportsContainer" style="display:flex; flex-direction:column; gap:12px; max-height:500px; overflow-y:auto; padding:5px;">
  `;

  reports.forEach(r => {
    let catIcon = '<i class="fas fa-file-medical"></i>';
    const cat = r.category || 'General Report';
    if (cat.includes('Blood')) catIcon = '<i class="fas fa-tint" style="color:#ef4444"></i>';
    else if (cat.includes('Imaging')) catIcon = '<i class="fas fa-x-ray" style="color:#3b82f6"></i>';
    else if (cat.includes('Prescription')) catIcon = '<i class="fas fa-prescription" style="color:#10b981"></i>';
    else if (cat.includes('Vaccination')) catIcon = '<i class="fas fa-syringe" style="color:#8b5cf6"></i>';
    else if (cat.includes('Urine')) catIcon = '<i class="fas fa-flask" style="color:#f59e0b"></i>';

    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px; border:1px solid var(--border); border-radius:12px; background:var(--bg); transition:var(--transition);">
        <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
          <div style="width:36px; height:36px; border-radius:8px; background:var(--card); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; border:1px solid var(--border);">
            ${catIcon}
          </div>
          <div style="min-width:0; flex:1;">
            <div style="font-size:13px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.file_name}">${r.file_name}</div>
            <div style="font-size:10px; color:var(--muted); margin-top:2px;">
              <span style="font-weight:600; color:var(--primary);">${cat}</span> · 
              <span>${r.report_date || r.uploaded_at.split(' ')[0]}</span>
            </div>
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn" style="background:var(--primary); color:#fff; border:none; padding:6px 10px; font-size:10px; border-radius:6px;" onclick="summarizePatientReport(${r.id}, '${r.file_name.replace(/'/g, "\\'")}')">
            <i class="fas fa-robot"></i> AI
          </button>
          <a class="btn" href="../uploads/${r.file_path}" target="_blank" style="background:var(--card); color:var(--text); border:1px solid var(--border); padding:6px 10px; font-size:10px; border-radius:6px;">
            <i class="fas fa-eye"></i>
          </a>
          <button class="btn" style="background:rgba(239,68,68,0.05); color:var(--danger); border:none; padding:6px 10px; font-size:10px; border-radius:6px;" onclick="deletePatientReport(${r.id})">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
  setupReportFilters();
}

function setupReportFilters() {
  const typeFilter = document.getElementById('reportTypeFilter');
  if (typeFilter) typeFilter.addEventListener('change', filterReports);
}

function filterReports() {
  const type = document.getElementById('reportTypeFilter')?.value || 'all';
  const filtered = allPatientReports.filter(r => type === 'all' || r.file_type === type);
  renderPatientReports(filtered);
}

async function summarizePatientReport(reportId, filename) {
  const modal = document.getElementById('aiSummaryModal');
  const content = document.getElementById('aiSummaryContent');
  if (!modal || !content) return;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:15px;padding:20px;">
      <i class="fas fa-circle-notch fa-spin" style="font-size:32px;color:var(--primary)"></i>
      <p style="color:var(--muted);font-weight:600">Analyzing report...</p>
    </div>
  `;
  modal.style.display = 'flex';

  try {
    const res = await fetch('../api/ai_summarizer.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `report_id=${reportId}&filename=${encodeURIComponent(filename)}`
    });
    const json = await res.json();
    if (json.success) {
      setTimeout(() => { content.innerHTML = json.summary; }, 600);
    } else {
      content.innerHTML = `<div style="padding:20px;text-align:center;color:var(--danger)">${json.message || 'Error'}</div>`;
    }
  } catch (e) {
    content.innerHTML = `<div style="padding:20px;text-align:center;color:var(--danger)">Connection error</div>`;
  }
}

async function deletePatientReport(id) {
  if (!await showConfirm('Delete this medical report?', { confirmText: 'Delete', type: 'danger' })) return;

  try {
    const res = await fetch('../api/patient_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=delete_report&id=${id}`
    });
    const json = await res.json();
    if (json.success) {
      showToast('Report deleted', 'success');
      loadPatientReports();
    } else showToast(json.message || 'Deletion failed', 'error');
  } catch (err) {
    showToast('Server error', 'error');
  }
}

// Form Listener for Reports
const reportForm = document.getElementById('reportUploadForm');
if (reportForm) {
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const fd = new FormData(reportForm);
    const btn = reportForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    
    btn.disabled = true;
    btn.textContent = 'Uploading...';

    try {
      const res = await fetch('../api/patient_api.php', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        reportForm.reset();
        loadPatientReports();
      } else showToast(json.message, 'error');
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}


// ---- Admin Reports & Analytics ----
let adminApptChart = null;
let adminTrendChart = null;

async function loadAdminReports() {
    try {
        // 1. Load Statistics and Charts Data
        const res = await fetch('../api/dashboard_data.php?type=admin_reports');
        const json = await res.json();
        if (json.success) {
            const d = json.data;
            
            // Update Summary Cards
            if (document.getElementById('rep-sos-total')) document.getElementById('rep-sos-total').textContent = d.sos.total;
            if (document.getElementById('rep-appt-total')) {
                const totalAppts = d.apptType.reduce((acc, curr) => acc + parseInt(curr.count), 0);
                document.getElementById('rep-appt-total').textContent = totalAppts;
            }
            if (document.getElementById('rep-ai-total')) document.getElementById('rep-ai-total').textContent = d.engagement.reports;
            if (document.getElementById('rep-symp-total')) document.getElementById('rep-symp-total').textContent = d.engagement.symptoms;

            renderAdminCharts(d);
        }

        // 2. Load SOS Logs Table
        const resLogs = await fetch('../api/dashboard_data.php?type=admin_sos_logs');
        const jsonLogs = await resLogs.json();
        const logsBody = document.getElementById('adminSosLogsTableBody');
        if (jsonLogs.success && logsBody) {
            if (jsonLogs.data.length === 0) {
                logsBody.innerHTML = '<tr><td colspan="4" class="empty-state">No SOS alerts recorded.</td></tr>';
            } else {
                logsBody.innerHTML = jsonLogs.data.map(log => `
                    <tr>
                        <td>
                            <div style="font-weight:600;">${escapeHtml(log.patient_name)}</div>
                            <div style="font-size:11px; color:var(--muted);">${escapeHtml(log.phone)}</div>
                        </td>
                        <td>
                            <a href="https://www.google.com/maps?q=${log.latitude},${log.longitude}" target="_blank" style="color:var(--primary); text-decoration:none;">
                                <i class="fas fa-map-marker-alt"></i> View Map
                            </a>
                        </td>
                        <td>${new Date(log.created_at).toLocaleString()}</td>
                        <td>
                            <span class="badge ${log.status === 'active' ? 'badge-danger' : 'badge-success'}">
                                ${log.status.toUpperCase()}
                            </span>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error("Error loading admin reports:", e);
    }
}

function renderAdminCharts(data) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    // 1. Appointment Type Chart (Pie)
    const ctxAppt = document.getElementById('apptTypeChart')?.getContext('2d');
    if (ctxAppt) {
        if (adminApptChart) adminApptChart.destroy();
        adminApptChart = new Chart(ctxAppt, {
            type: 'doughnut',
            data: {
                labels: data.apptType.map(t => t.type.charAt(0).toUpperCase() + t.type.slice(1)),
                datasets: [{
                    data: data.apptType.map(t => t.count),
                    backgroundColor: ['#3b82f6', '#10b981'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } }
                }
            }
        });
    }

    // 2. Growth Trend Chart (Line)
    const ctxTrend = document.getElementById('growthTrendChart')?.getContext('2d');
    if (ctxTrend) {
        if (adminTrendChart) adminTrendChart.destroy();
        adminTrendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: data.trends.map(t => t.month),
                datasets: [{
                    label: 'Appointments',
                    data: data.trends.map(t => t.count),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: textColor } },
                    x: { grid: { display: false }, ticks: { color: textColor } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function exportData(type) {
    window.location.href = `../api/admin_export.php?type=${type}`;
}
