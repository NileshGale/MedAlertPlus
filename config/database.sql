/*
  ============================================================
  Med-Alert-Plus: Unified Database Schema
  Designed for Patient, Doctor, and Admin Integrated Systems
  ============================================================
*/

CREATE DATABASE IF NOT EXISTS `medalertplus`;
USE `medalertplus`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. Core Authentication (Users Table)
-- Handles Admin, Doctors, and Patients
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('patient','doctor','admin') NOT NULL,
  `status` enum('active','inactive','pending','rejected') DEFAULT 'active',
  `profile_photo` varchar(255) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 2. Patient Profiles
-- Specific information linked back to users table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `age` int(3) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `disease` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `whatsapp_number` varchar(20) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 3. Doctor Profiles
-- Professional information and approval logic
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `experience_years` int(2) DEFAULT 0,
  `fees` decimal(10,2) DEFAULT 0.00,
  `clinic_name` varchar(150) DEFAULT NULL,
  `clinic_address` text DEFAULT NULL,
  `clinic_phone` varchar(20) DEFAULT NULL,
  `about` text DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `approval_status` enum('approved','pending','rejected') DEFAULT 'pending',
  `clinic_status` enum('open','closed') DEFAULT 'open',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 4. Appointments System
-- Unified physical and online booking
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `type` enum('online','physical') DEFAULT 'physical',
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `patient_notes` text DEFAULT NULL,
  `doctor_notes` text DEFAULT NULL,
  `prescription` text DEFAULT NULL,
  `meet_link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 5. Medicine Management (Reminders & Logs)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `medicine_reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `medicine_name` varchar(150) NOT NULL,
  `dosage` varchar(100) NOT NULL,
  `frequency` varchar(50) DEFAULT 'daily',
  `reminder_times` text NOT NULL, -- JSON formatted array of times
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `send_email` tinyint(1) DEFAULT 1,
  `send_whatsapp` tinyint(1) DEFAULT 0,
  `whatsapp_number` varchar(20) DEFAULT NULL,
  `send_sms` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `last_sent` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `reminders_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `medicine_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reminder_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `scheduled_time` datetime NOT NULL,
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `reminder_id` (`reminder_id`),
  CONSTRAINT `medicine_logs_ibfk_1` FOREIGN KEY (`reminder_id`) REFERENCES `medicine_reminders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 6. Health Tracking (Symptom Checks & Reports)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `symptom_checks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `symptoms` text NOT NULL,
  `diagnosis` text DEFAULT NULL,
  `medicines` text DEFAULT NULL,
  `home_remedies` text DEFAULT NULL,
  `checked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `symptom_checks_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `patient_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(10) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `patient_reports_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 7. Communication & Scheduling
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','danger') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `doctor_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `start_time` time DEFAULT '09:00:00',
  `end_time` time DEFAULT '17:00:00',
  `slot_duration` int(3) DEFAULT 30,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `doctor_schedules_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 8. OTP Security System
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `otp_verifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `type` enum('registration','login','reset') NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Default Administrator Account
-- --------------------------------------------------------
INSERT IGNORE INTO `users` (`name`, `email`, `password`, `role`, `status`) 
VALUES ('System Admin', 'gayatribhoyar18@gmail.com', '$2y$10$replace.with.runtime.hash', 'admin', 'active');
-- Password is enforced at runtime from config/db.php as: 123456

COMMIT;
-- Emergency SOS Alerts
CREATE TABLE IF NOT EXISTS sos_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('active', 'resolved') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 9. Advanced Health Analytics (Vitals Tracking)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patient_vitals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `weight` decimal(5,2) DEFAULT NULL, -- in kg
  `height` decimal(5,2) DEFAULT NULL, -- in cm
  `bp_systolic` int(3) DEFAULT NULL,  -- mmHg
  `bp_diastolic` int(3) DEFAULT NULL, -- mmHg
  `sugar_level` decimal(5,2) DEFAULT NULL, -- mg/dL
  `log_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `vitals_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
