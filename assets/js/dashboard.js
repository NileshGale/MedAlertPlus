// ============================================================
// assets/js/dashboard.js — Shared Dashboard Utilities
// ============================================================

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
  if (!confirm('TRIGGER EMERGENCY SOS? This will alert your emergency contacts and nearby doctors.')) return;
  
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
      list.innerHTML = data.data.map(m => `
        <div style="padding:15px;border:1px solid var(--border);border-radius:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">${m.medicine_name}</div>
            <div style="font-size:12px;color:var(--muted)">${m.dosage} · ${m.frequency} · Times: ${JSON.parse(m.reminder_times).join(', ')}</div>
          </div>
          <button class="btn" onclick="deleteMedicine(${m.id}, '${m.medicine_name.replace(/'/g, "\\'")}')" style="color:var(--danger);background:rgba(239,68,68,0.1)"><i class="fas fa-trash"></i></button>
        </div>
      `).join('');
    }
  } catch (err) {}
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

// ---- Patient: Clinic Search (Real API Integration) ----
async function searchClinics() {
  const addr = document.getElementById('clinicAddress').value;
  const container = document.getElementById('clinicResults');
  if (!addr) { showToast('Please enter a location', 'warning'); return; }
  container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Searching for clinics in ' + addr + '...</div>';
  
  try {
     const res = await fetch('../api/dashboard_data.php?type=clinics&query=' + encodeURIComponent(addr));
     const data = await res.json();
     if (data.success) {
        if (!data.data || data.data.length === 0) { container.innerHTML = '<div class="empty-state">No clinics found in this area.</div>'; return; }
        container.innerHTML = data.data.map(c => `
           <div class="card" style="padding:20px">
              <div style="font-weight:800;font-size:18px;margin-bottom:5px">${c.clinic_name || c.name}</div>
              <div style="color:var(--text-light);font-size:13px;margin-bottom:10px"><i class="fas fa-map-marker-alt"></i> ${c.clinic_address || c.address}</div>
              <div style="display:flex;gap:15px;font-size:12px;margin-bottom:15px">
                 <span><i class="fas fa-clock"></i> ${c.open_time || '09:00'} - ${c.close_time || '20:00'}</span>
                 <span class="badge ${c.clinic_status==='open'?'badge-success':'badge-danger'}">${(c.clinic_status || 'open').toUpperCase()}</span>
              </div>
              <div style="margin-bottom:15px"><strong>Doctor:</strong> ${c.doctor_name || 'Dr. Professional'} | <strong>Fee:</strong> $${c.fees || '50'}</div>
              <button class="btn btn-primary" onclick="openBookingModal(${c.id || '0'}, '${c.doctor_name || 'Doctor'}')">Book Online Appointment</button>
           </div>
        `).join('');
     }
  } catch (err) { container.innerHTML = '<div class="empty-state">Could not connect to clinic database.</div>'; }
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
  if (!confirm('Are you sure you want to perform this action?')) return;
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

function downloadUserList() {
   const role = document.getElementById('userFilterRole')?.value || 'all';
   window.open(`../api/export_pdf.php?role=${role}`, '_blank');
}

function showHomeRemedies() {
    document.getElementById('resSummaryContainer').style.display = 'none';
    document.getElementById('resRemediesContainer').style.display = 'block';
}

function openBookingModal(id, name) {
   document.getElementById('bookDocId').value = id;
   document.getElementById('bookDocName').value = 'Dr. ' + name;
   document.getElementById('bookingModal').style.display = 'flex';
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
document.addEventListener('DOMContentLoaded', () => {
   if (document.getElementById('medicineList')) loadMedicines();
   if (document.getElementById('userManagementTable')) loadUserList();
   initMedicineSuggestions();
});

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
