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
    reports: ['Medical Reports', 'Upload and manage your health reports'],
    analytics: ['Health Analytics', 'Log and visualize your vital trends'],
    profile: ['My Profile', 'Update your personal information'],
    approvals: ['Doctor Approvals', 'Review pending doctor registrations'],
    doctors: ['Manage Doctors', 'All registered doctors'],
    patients: ['Manage Patients', 'All registered patients'],
    registrations: ['Recent Registrations', 'New user registrations with filters'],
    schedule: ['My Schedule', 'Set your weekly availability'],
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
}

// ---- Sidebar Toggle ----
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-circle', info: 'info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type === 'error' ? 'error' : type}`;
  toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)'; setTimeout(() => toast.remove(), 300); }, 3500);
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
function addTimeField() {
  const container = document.getElementById('reminderTimesContainer');
  const div = document.createElement('div');
  div.style = "display:flex;gap:10px;margin-bottom:10px";
  div.innerHTML = `<input type="time" name="times[]" required style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;">
                   <button type="button" onclick="this.parentElement.remove()" style="background:var(--bg);border:1px solid var(--border);padding:10px;border-radius:8px;color:var(--danger)"><i class="fas fa-trash"></i></button>`;
  container.appendChild(div);
}

const medForm = document.getElementById('medicineForm');
if (medForm) {
  medForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(medForm);
    const times = Array.from(document.querySelectorAll('input[name="times[]"]')).map(i => i.value);
    formData.set('reminder_times', JSON.stringify(times));
    
    try {
      const res = await fetch('../api/patient_api.php', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        medForm.reset();
        // Reset time fields to one
        document.getElementById('reminderTimesContainer').innerHTML = `<label style="display:block;margin-bottom:5px;font-size:13px;font-weight:600">Reminder Times (Set Timers)</label>
                   <div style="display:flex;gap:10px;margin-bottom:10px">
                      <input type="time" name="times[]" required style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;">
                      <button type="button" onclick="addTimeField()" style="background:var(--bg);border:1px solid var(--border);padding:10px;border-radius:8px;"><i class="fas fa-plus"></i></button>
                   </div>`;
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
      list.innerHTML = data.data.map(m => `
        <div style="padding:15px;border:1px solid var(--border);border-radius:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">${m.medicine_name}</div>
            <div style="font-size:12px;color:var(--muted)">${m.dosage} · ${m.frequency} · Times: ${JSON.parse(m.reminder_times).join(', ')}</div>
            <div style="font-size:12px;margin-top:4px;color:${m.today_status === 'taken' ? '#166534' : (m.today_status === 'skipped' ? '#991b1b' : 'var(--muted)')}">
              Today: ${m.today_status ? m.today_status.toUpperCase() : 'Not marked'}
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
            <button class="btn" onclick="markMedicineAdherence(${m.id}, 'taken')" style="background:#ecfdf5;color:#166534;"><i class="fas fa-check"></i> Taken</button>
            <button class="btn" onclick="markMedicineAdherence(${m.id}, 'skipped')" style="background:#fff7ed;color:#92400e;"><i class="fas fa-forward"></i> Skipped</button>
            <button class="btn" onclick="deleteMedicine(${m.id}, '${m.medicine_name.replace(/'/g, "\\'")}')" style="color:var(--danger);background:rgba(239,68,68,0.1)"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('');
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
    container.innerHTML = filtered.map(a => `
      <div style="padding:14px;border:1px solid var(--border);border-radius:10px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
          <div>
            <div style="font-weight:700;">Dr. ${a.doctor_name}</div>
            <div style="font-size:12px;color:var(--muted);">${a.specialization || ''} · ${a.clinic_name || 'Clinic'}</div>
          </div>
          <span class="badge ${(a.status === 'confirmed' || a.status === 'completed') ? 'badge-success' : (a.status === 'pending' ? 'badge-warning' : 'badge-danger')}">${a.status}</span>
        </div>
        <div style="margin-top:10px;font-size:13px;color:var(--text-light);">
          <i class="fas fa-calendar"></i> ${a.appointment_date} ${a.appointment_time} · ${a.type}
        </div>
        ${a.meet_link ? `<div style="margin-top:8px;font-size:13px;"><a href="${a.meet_link}" target="_blank" rel="noopener">Join Meet Link</a></div>` : ''}
        ${a.doctor_notes ? `<div style="margin-top:8px;font-size:13px;"><strong>Doctor Notes:</strong> ${a.doctor_notes}</div>` : ''}
        ${a.prescription ? `<div style="margin-top:6px;font-size:13px;"><strong>Prescription:</strong> ${a.prescription}</div>` : ''}
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          ${(a.status === 'pending' || a.status === 'confirmed') ? `<button class="btn" style="background:rgba(239,68,68,0.1);color:var(--danger);" onclick="cancelPatientAppointment(${a.id})">Cancel</button>` : ''}
          <button class="btn" style="background:#f8fafc;color:#1f2937;" onclick="toggleAppointmentDetails(${a.id})">Details</button>
        </div>
        <div id="patient-appointment-details-${a.id}" style="display:none;margin-top:10px;padding:10px;border:1px dashed var(--border);border-radius:8px;background:#f8fafc;">
          <div style="font-size:13px;"><strong>Clinic:</strong> ${a.clinic_name || '-'}</div>
          <div style="font-size:13px;"><strong>Type:</strong> ${a.type}</div>
          <div style="font-size:13px;"><strong>Status:</strong> ${a.status}</div>
        </div>
      </div>
    `).join('');
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

// ---- Patient: Symptom Checker ----
function generateSymptomInputs() {
  const count = document.getElementById('symptomCount').value;
  if (count < 1) return;
  const container = document.getElementById('symptomInputsContainer');
  container.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    container.innerHTML += `<div style="margin-bottom:15px">
      <label style="display:block;margin-bottom:5px;font-size:13px;font-weight:600">Symptom ${i}</label>
      <input type="text" name="symptoms[]" required placeholder="e.g. Fever, Headache..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;">
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
  if (line) p.set('address_line', line);
  if (city) p.set('city', city);
  if (state) p.set('state', state);
  if (postal) p.set('postal_code', postal);
  if (country) p.set('country', country);
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
   const link = prompt('Enter Google Meet Link:', current || 'https://meet.google.com/');
   if (!link) return;
   fetch('../api/doctor_api.php', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `action=save_meet_link&id=${id}&link=${encodeURIComponent(link)}`
   }).then(r => r.json()).then(d => {
      if (d.success) showToast('Meet link updated!', 'success');
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

async function loadPatientReports() {
  const container = document.getElementById('patientReportsList');
  if (!container) return;
  try {
    const res = await fetch('../api/dashboard_data.php?type=patient_reports');
    const json = await res.json();
    if (!json.success || !json.data || json.data.length === 0) {
      container.innerHTML = '<div class="empty-state">No reports uploaded yet.</div>';
      return;
    }
    const q = (document.getElementById('reportSearchInput')?.value || '').trim().toLowerCase();
    const type = document.getElementById('reportTypeFilter')?.value || 'all';
    const rows = json.data.filter((r) => {
      const name = (r.file_name || '').toLowerCase();
      const ft = (r.file_type || '').toLowerCase();
      const matchesQ = !q || name.includes(q);
      const matchesType = type === 'all' || ft === type;
      return matchesQ && matchesType;
    });
    if (!rows.length) {
      container.innerHTML = '<div class="empty-state">No reports match your search/filter.</div>';
      return;
    }
    container.innerHTML = rows.map(r => `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-weight:700;">${r.file_name}</div>
          <div style="font-size:12px;color:var(--muted);">${r.file_type || '-'} · ${r.uploaded_at}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <a class="btn" href="../uploads/${r.file_path}" target="_blank" rel="noopener" style="background:#eff6ff;color:#1e40af;">View</a>
          <button class="btn" style="background:#f8fafc;color:#1f2937;" onclick="previewPatientReport('${r.file_type || ''}', '../uploads/${r.file_path}')">Preview</button>
          <button class="btn" style="background:rgba(239,68,68,0.1);color:var(--danger);" onclick="deletePatientReport(${r.id})">Delete</button>
        </div>
      </div>
    `).join('');
    container.innerHTML += '<div id="reportPreviewBox" style="margin-top:12px;"></div>';
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Could not load reports.</div>';
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
    whatsapp: json.data.whatsapp_number || '',
    emergency: json.data.emergency_contact || ''
  }).forEach(([k, v]) => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) el.value = v;
  });
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
    container.innerHTML = json.data.map(a => `
      <div style="padding:14px;border:1px solid var(--border);border-radius:10px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <div>
            <div style="font-weight:700;">${a.patient_name}</div>
            <div style="font-size:12px;color:var(--muted);">${a.patient_phone || 'No phone'} · ${a.type}</div>
          </div>
          <span class="badge ${(a.status === 'confirmed' || a.status === 'completed') ? 'badge-success' : (a.status === 'pending' ? 'badge-warning' : 'badge-danger')}">${a.status}</span>
        </div>
        <div style="margin-top:8px;font-size:13px;color:var(--text-light);">
          <i class="fas fa-calendar"></i> ${a.appointment_date} ${a.appointment_time}
        </div>
        ${a.meet_link ? `<div style="margin-top:6px;font-size:13px;"><strong>Meet:</strong> <a href="${a.meet_link}" target="_blank" rel="noopener">${a.meet_link}</a></div>` : ''}
        ${a.patient_notes ? `<div style="margin-top:6px;font-size:13px;color:var(--muted);"><strong>Patient notes:</strong> ${a.patient_notes}</div>` : ''}
        <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;">
          ${a.status === 'pending' ? `<button class="btn btn-primary" onclick="doctorUpdateAppointmentStatus(${a.id}, 'confirm_appointment')"><i class="fas fa-check"></i> Confirm</button>` : ''}
          ${a.status === 'confirmed' ? `<button class="btn" style="background:#ecfdf5;color:#166534;" onclick="doctorUpdateAppointmentStatus(${a.id}, 'complete_appointment')"><i class="fas fa-flag-checkered"></i> Complete</button>` : ''}
          ${(a.status === 'pending' || a.status === 'confirmed') ? `<button class="btn" style="background:rgba(239,68,68,0.08);color:var(--danger);" onclick="doctorUpdateAppointmentStatus(${a.id}, 'cancel_appointment')"><i class="fas fa-times"></i> Cancel</button>` : ''}
          <button class="btn" style="background:#dbeafe;color:#1e40af;" onclick="manageMeetLink(${a.id}, ${a.meet_link ? `'${encodeURIComponent(a.meet_link)}'` : 'null'})"><i class="fas fa-video"></i> Meet link</button>
          <button class="btn" style="background:#f9fafb;color:#111827;" onclick="manageAppointment(${a.id})"><i class="fas fa-notes-medical"></i> Notes</button>
        </div>
      </div>
    `).join('');
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
    <div style="display:grid;grid-template-columns:130px 100px 1fr 1fr 1fr;gap:10px;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid var(--border);font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;">
      <div>Day</div>
      <div>Availability</div>
      <div>Start Time</div>
      <div>End Time</div>
      <div>Slot (Mins)</div>
    </div>
  `;

  wrapper.innerHTML = headerHtml + days.map(day => {
    const row = map[day] || { is_available: 0, start_time: '09:00:00', end_time: '17:00:00', slot_duration: 30 };
    return `
      <div style="display:grid;grid-template-columns:130px 100px 1fr 1fr 1fr;gap:10px;align-items:center;margin-bottom:10px;">
        <strong style="text-transform:capitalize;font-size:14px;color:var(--text);">${day}</strong>
        <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" name="${day}_available" ${parseInt(row.is_available, 10) ? 'checked' : ''}> Open</label>
        <input type="time" name="${day}_start" value="${(row.start_time || '09:00:00').slice(0,5)}" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:13px;width:100%;">
        <input type="time" name="${day}_end" value="${(row.end_time || '17:00:00').slice(0,5)}" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:13px;width:100%;">
        <input type="number" min="5" step="5" name="${day}_slot" value="${row.slot_duration || 30}" placeholder="Mins" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:13px;width:100%;">
      </div>
    `;
  }).join('');
}

async function loadDoctorPatients() {
  const container = document.getElementById('doctorPatientsList');
  if (!container) return;
  const res = await fetch('../api/dashboard_data.php?type=doctor_patients');
  const json = await res.json();
  if (!json.success || !json.data || json.data.length === 0) {
    container.innerHTML = '<div class="empty-state">No patients found yet.</div>';
    return;
  }
  container.innerHTML = json.data.map(p => `
    <div style="padding:12px 0;border-bottom:1px solid var(--border);">
      <div style="font-weight:700;">${p.name}</div>
      <div style="font-size:12px;color:var(--muted);">${p.email} · ${p.phone || '-'} · Last visit: ${p.last_appointment || '-'}</div>
    </div>
  `).join('');
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
}

function downloadUserList() {
   const role = document.getElementById('userFilterRole')?.value || 'all';
   window.open(`../api/export_pdf.php?role=${role}`, '_blank');
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
  loadAvailableDoctors(selectedDoctorId);
  modal.style.display = 'flex';
}

function closeModal(id) {
   document.getElementById(id).style.display = 'none';
}

const apptForm = document.getElementById('appointmentForm');
if (apptForm) {
   apptForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(apptForm);
      try {
         const res = await fetch('../api/patient_api.php', { method: 'POST', body: formData });
         const data = await res.json();
         if (data.success) {
            showToast(data.message, 'success');
            closeModal('bookingModal');
            apptForm.reset();
            if (typeof showTab === 'function') showTab('appointments');
         } else showToast(data.message, 'error');
      } catch (err) { showToast('Booking failed', 'error'); }
   });
}

const vitalsFm = document.getElementById('vitalsForm');
if (vitalsFm) {
   vitalsFm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(vitalsFm);
      try {
         const res = await fetch('../api/patient_api.php', { method: 'POST', body: formData });
         const data = await res.json();
         if (data.success) {
            showToast(data.message, 'success');
            vitalsFm.reset();
            loadHealthAnalytics();
         } else showToast(data.message, 'error');
      } catch (err) { showToast('Saving failed', 'error'); }
   });
}

let vChart1 = null;
let vChart2 = null;

async function loadHealthAnalytics() {
   const container = document.getElementById('vitalsSummary');
   if (!container) return;
   
   try {
      const res = await fetch('../api/dashboard_data.php?type=vitals_history');
      const json = await res.json();
      if (!json.success || !json.data || json.data.length === 0) {
         container.innerHTML = '<div class="empty-state">No vitals logged yet. Start by logging today\'s metrics!</div>';
         return;
      }
      
      const latest = json.data[json.data.length - 1];
      let bmiHtml = '';
      if (latest.weight && latest.height) {
         const bmi = (latest.weight / ((latest.height/100) * (latest.height/100))).toFixed(1);
         let category = 'Normal';
         let color = 'var(--success)';
         if (bmi < 18.5) { category = 'Underweight'; color = '#3b82f6'; }
         else if (bmi >= 25 && bmi < 30) { category = 'Overweight'; color = '#f97316'; }
         else if (bmi >= 30) { category = 'Obese'; color = 'var(--danger)'; }
         
         bmiHtml = `
            <div style="text-align:center; padding:20px; background:#f8fafc; border-radius:15px">
               <div style="font-size:3rem; font-weight:800; color:${color}">${bmi}</div>
               <div style="font-weight:600; text-transform:uppercase; letter-spacing:1px">${category}</div>
               <div style="font-size:0.8rem; color:var(--text-light); margin-top:10px">Based on latest log: ${latest.log_date}</div>
            </div>
         `;
      }
      
      container.innerHTML = `
         ${bmiHtml}
         <div style="margin-top:20px">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
               <span>Latest Blood Pressure:</span>
               <strong style="color:var(--primary)">${latest.bp_systolic || '--'}/${latest.bp_diastolic || '--'} mmHg</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
               <span>Latest Blood Sugar:</span>
               <strong style="color:var(--secondary)">${latest.sugar_level || '--'} mg/dL</strong>
            </div>
         </div>
      `;
      
      // Update Charts
      const labels = json.data.map(d => d.log_date);
      const weights = json.data.map(d => d.weight);
      const sys = json.data.map(d => d.bp_systolic);
      const dia = json.data.map(d => d.bp_diastolic);
      const sugar = json.data.map(d => d.sugar_level);
      
      if (vChart1) vChart1.destroy();
      if (vChart2) vChart2.destroy();
      
      const ctx1 = document.getElementById('mainVitalsChart')?.getContext('2d');
      if (ctx1) {
         vChart1 = new Chart(ctx1, {
            type: 'line',
            data: {
               labels: labels,
               datasets: [
                  { label: 'Weight (kg)', data: weights, borderColor: '#3b82f6', tension: 0.3, fill: false },
                  { label: 'BP Systolic', data: sys, borderColor: '#ef4444', tension: 0.3, fill: false },
                  { label: 'BP Diastolic', data: dia, borderColor: '#f97316', tension: 0.3, fill: false }
               ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
         });
      }
      
      const ctx2 = document.getElementById('sugarChart')?.getContext('2d');
      if (ctx2) {
         vChart2 = new Chart(ctx2, {
            type: 'bar',
            data: {
               labels: labels,
               datasets: [{ label: 'Blood Sugar (mg/dL)', data: sugar, backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', borderWidth: 2 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
         });
      }
      
   } catch (err) { console.error(err); }
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
                              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)">
                                  <div>
                                      <div style="font-weight:700">Dr. ${a.doctor_name || 'Doctor'}</div>
                                      <div style="font-size:12px;color:var(--muted)">${a.appointment_date} at ${a.appointment_time}</div>
                                  </div>
                                  <span class="badge ${a.status==='confirmed'?'badge-success':(a.status==='pending'?'badge-warning':'badge-danger')}">${a.status}</span>
                              </div>
                           `).join('');
                       }
                   }
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
               }
           }
           
           if (role === 'patient') {
               const today = new Date().toISOString().split('T')[0];
               if (document.getElementById('bookingDateInput')) document.getElementById('bookingDateInput').min = today;
               if (document.getElementById('vitalsLogDateObj')) {
                   document.getElementById('vitalsLogDateObj').max = today;
                   document.getElementById('vitalsLogDateObj').value = today;
               }
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

const reportUploadForm = document.getElementById('reportUploadForm');
if (reportUploadForm) {
  reportUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(reportUploadForm);
    const res = await fetch('../api/patient_api.php', { method: 'POST', body: fd });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Uploaded', 'success');
      reportUploadForm.reset();
      loadPatientReports();
    } else {
      showToast(json.message || 'Upload failed', 'error');
    }
  });
}

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
    if (json.success) setTimeout(() => showTab('overview'), 600);
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
    if (json.success) setTimeout(() => showTab('overview'), 600);
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
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const schedule = days.map((day) => ({
      day,
      available: doctorScheduleForm.querySelector(`[name="${day}_available"]`)?.checked ? 1 : 0,
      start: doctorScheduleForm.querySelector(`[name="${day}_start"]`)?.value || '09:00',
      end: doctorScheduleForm.querySelector(`[name="${day}_end"]`)?.value || '17:00',
      slot: parseInt(doctorScheduleForm.querySelector(`[name="${day}_slot"]`)?.value || '30', 10)
    }));
    const body = new URLSearchParams({ action: 'save_schedule', schedule: JSON.stringify(schedule) }).toString();
    const res = await fetch('../api/doctor_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const json = await res.json();
    showToast(json.message || (json.success ? 'Schedule saved' : 'Save failed'), json.success ? 'success' : 'error');
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
