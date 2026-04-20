# 🏥 Med-Alert-Plus
> **A Unified 360-Degree Healthcare Management & Wellness Ecosystem**

Med-Alert-Plus is a comprehensive healthcare platform designed to bridge the gap between patients, doctors, and administrators. It combines proactive medicine management, intelligent symptom checking, and seamless appointment workflows into a single, high-performance web application.

---

## 🌟 Project Overview
Med-Alert-Plus aims to modernize health tracking and medical consultations. By centralizing patient records, automating medicine reminders via multiple channels, and providing AI-driven insights, the platform ensures that users stay on top of their health while doctors manage their clinics with maximum efficiency.

### 🎯 Key Objectives:
- **Zero-Miss Medication**: Automated Email reminders via PHPMailer.
- **Proactive Health Insights**: AI-powered analysis of symptoms and reports.
- **Unified Scheduling**: A robust booking system for physical and virtual consultations.
- **Emergency Preparedness**: Instant SOS alerts with real-time geolocation.

---

## 🏗️ System Architecture & Modules

### 👤 Patient Module (Health Companion)
The patient interface is designed for simplicity and empowerment.
- **Smart Reminders**: Schedule medicines with frequency-based triggers (Morning, Afternoon, Evening).
- **Symptom Checker**: Enter symptoms to receive an AI-generated preliminary diagnosis and treatment suggestions.
- **SOS Emergency**: One-tap SOS button that captures GPS coordinates for immediate help.
- **Health Vitals Log**: Track Blood Pressure (BP), Sugar levels, BMI, and height/weight over time.
- **Digital Health Vault**: Securely upload and manage medical reports and prescriptions.

### 👨‍⚕️ Doctor Module (Virtual Clinic)
A professional dashboard for healthcare providers to manage their practice.
- **Patient Engagement**: View detailed patient history and vitals before consultations.
- **Appointment Lifecycle**: Confirm, reschedule, or cancel bookings with automated notifications.
- **Clinic Management**: Set availability slots, specify fees, and manage clinic operational status (Open/Closed).
- **Digital Prescriptions**: Generate and store prescriptions directly within the platform.

### 🛠️ Admin Module (Governance & Analytics)
The "Brain" of the system, providing oversight and data insights.
- **Dynamic Analytics**: Real-time charts showing distribution of Doctors vs. Patients.
- **User Verification**: Review and approve doctor registrations (License/Qualification check).
- **System Monitoring**: Manage all system logs, appointments, and global settings.

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (Modern UI), JavaScript (ES6+), Chart.js |
| **Backend** | PHP 8.1+ |
| **Database** | MySQL (MariaDB) |
| **Server** | Apache (XAMPP / Localhost) |
| **Security** | BCrypt Hashing, Session Management, OTP Verification |

---

## 🔌 Core Integrations (APIs)

- **📧 PHPMailer**: Enterprise-grade email automation for medication reminders and appointment alerts.
- **🤖 Artificial Intelligence**: Integrated logic for symptom pattern recognition and medical report summarization.
- **📍 Google Maps / OSM**: Hybrid integration for SOS geolocation and finding nearby clinics.

---

## 📖 Feature Guide & User Manual

### 👤 Patient Module (Health Companion)
*How to use the platform as a patient:*

#### 1. **Add & Track Medication**
- **Step 1**: Navigate to the **Medicines** tab in the sidebar.
- **Step 2**: Click the `[+ Add Medicine]` button.
- **Step 3**: Enter the medicine name (e.g., "Aspirin") and select the frequency (e.g., "Twice a day").
- **Step 4**: The system will automatically generate slots (Morning/Evening). You will receive an **Email Reminder** 5 minutes before each dose.
- **Step 5**: Click the `[Checkmark]` icon on your dashboard cards to mark a dose as "Taken."

#### 2. **Book an Appointment**
- **Step 1**: Go to the **Find Clinics** tab.
- **Step 2**: Use the search bar to find specialized clinics (e.g., "Cardiology") near you.
- **Step 3**: Select a doctor and click `[Book Appointment]`.
- **Step 4**: Choose between **Physical** or **Online** consultation and select your preferred time.

#### 3. **AI Symptom Checker**
- **Step 1**: Click **Symptom Checker** in the sidebar.
- **Step 2**: Type how you are feeling (e.g., "I have a sharp headache and nausea").
- **Step 3**: Click `[Analyze Symptoms]`. A "Feature Info" popup will appear with AI-generated suggestions and a summary.

#### 4. **SOS Emergency**
- **Single Click**: Tap the floating **[SOS]** button.
- **Behind the Scenes**: The app captures your exact GPS location and sends a high-priority alert to every active doctor and administrator in the system.

---

### 👨‍⚕️ Doctor Module (Virtual Clinic)
*How to manage your clinic and patients:*

#### 1. **Clinic Status (Smart Toggle)**
- **Default Behavior**: The clinic is automatically **OPEN** from 9 AM to 10 PM.
- **Manual Override**: Click the `[Open/Closed]` badge in the top bar to change your status manually.
- **Override Popup**: If you try to open at night or close during the day, a confirmation modal will ask: *"Do you want to manually override defaults?"* Click **Confirm** to proceed.

#### 2. **Managing Appointments**
- **Confirm**: Click `[Confirm]` on a pending request to notify the patient.
- **Record Clinical Data**: After a session, click `[Record]`.
    - **Step A**: Enter the **Diagnosis/Notes** in the first modal and click Save.
    - **Step B**: Enter the **Prescription** in the second modal.
- **Reschedule**: Click `[Calendar icon]` to propose a new date/time if you are unavailable.
- **Virtual Links**: Click the `[Video icon]` to save a Google Meet link for online consultations.

#### 3. **Patient History**
- **Step 1**: Click the **Patients** tab.
- **Step 2**: Select a patient to view their **Vitals History** (BP, Sugar) and **Medical Reports** they have uploaded.

---

### 🛡️ Admin Module (Global Control)
*How to govern the platform:*

#### 1. **Doctor Approvals**
- **Step 1**: Go to the **Approvals** tab.
- **Step 2**: Review the doctor's license number and qualifications.
- **Step 3**: Click `[Approve]` to grant them access to the platform or `[Reject]` if the credentials are invalid.

#### 2. **Emergency Monitoring**
- **Step 1**: Open the **SOS Logs** tab.
- **Step 2**: View active emergencies on the live list.
- **Step 3**: Click `[Resolved]` once help has been dispatched to the patient's coordinates.

---

## 📂 Project Directory Structure

```text
Med-Alert-Plus/
├── api/             # Backend logic and API controllers
├── assets/          # Static files (CSS, JS, Images)
├── auth/            # Authentication logic (Login/Register/OTP)
├── config/          # Database & System Configuration (SQL files)
├── cron/            # Automated background runners (Windows Scheduler)
├── dashboard/       # Specialized UI for Patient, Doctor, and Admin
├── phpmailer/       # Email sending library
├── uploads/         # Distributed storage for reports and avatars
└── index.php        # Landing page and application entry
```

---

## 🛠️ Installation & Setup

1.  **Clone / Download**: Extract the project into your `C:\xampp\htdocs\Med-Alert-Plus` directory.
2.  **Database Configuration**:
    - Open PHPMyAdmin and create a database named `medalertplus`.
    - Import the provided schema: `config/database.sql`.
    - Update `config/db.php` with your local credentials.
3.  **Environment Setup**:
    - Ensure your `php.ini` has the extension `php_openssl` enabled.
    - Set your SMTP credentials in `config/mail.php` for PHPMailer.
4.  **Medicine Reminders (Automation)**:
    - On Windows, the project uses `scheduler.bat` to run `cron/reminder_cron.php`.
    - Set up a **Windows Task Scheduler** task to execute this `.bat` file every 1-5 minutes to ensure timely notifications.
5.  **Access the App**: Navigate to `http://localhost/Med-Alert-Plus/` in your browser.

---

## ⚖️ License & Acknowledgements
Developed as a professional health management solution. All rights reserved.
Special thanks to the open-source community for libraries like PHPMailer and Chart.js.