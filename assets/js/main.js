document.addEventListener('DOMContentLoaded', () => {

    // Tab Switching functionality for Registration
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active from all
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));

                // Add active to clicked
                e.target.classList.add('active');
                const targetId = e.target.getAttribute('data-target');
                document.getElementById(targetId).classList.remove('hidden');
            });
        });
    }

    // Helper: Show Alert
    function showAlert(elementId, message, type) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.className = `alert ${type}`;
        el.innerText = message;
        el.classList.remove('hidden');
    }

    // Handle Form Submissions (Login)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const originalText = btn.innerText;
            btn.innerText = 'Logging in...';
            btn.disabled = true;

            const formData = new FormData(loginForm);
            
            try {
                const res = await fetch('auth/auth.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showAlert('loginAlert', data.message, 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                } else {
                    showAlert('loginAlert', data.message, 'error');
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                showAlert('loginAlert', 'A network error occurred.', 'error');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Handle Initial Registration
    const authForms = document.querySelectorAll('.auth-form');
    authForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Creating...';
            btn.disabled = true;

            const formData = new FormData(form);
            
            try {
                const res = await fetch('auth/auth.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                
                if (data.status === 'success') {
                    showAlert('registerAlert', data.message, 'success');
                    
                    // Hide forms and tabs, show OTP section
                    document.querySelector('.tabs').classList.add('hidden');
                    authForms.forEach(f => f.classList.add('hidden'));
                    
                    const otpSec = document.getElementById('otp-section');
                    otpSec.classList.remove('hidden');
                    
                    // Inject email to correct field
                    document.getElementById('otp-email').value = data.email;
                    
                } else {
                    showAlert('registerAlert', data.message, 'error');
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                showAlert('registerAlert', 'A network error occurred.', 'error');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    });

    // Handle OTP Verification
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = otpForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Verifying...';
            btn.disabled = true;

            const formData = new FormData(otpForm);

            try {
                const res = await fetch('auth/auth.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.status === 'success') {
                    showAlert('registerAlert', data.message, 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1500);
                } else {
                    showAlert('registerAlert', data.message, 'error');
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                showAlert('registerAlert', 'A network error occurred.', 'error');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Handle Specialization Suggestions (Registration)
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

    const specInput = document.getElementById('doc_specialization');
    const specSuggestions = document.getElementById('specialization-suggestions');

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

});
