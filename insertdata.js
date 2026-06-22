const db = require("./src/models");

// NOTE: This script assumes a FRESH/EMPTY users, patients, prescribers, medications,
// pharmacies, prescriptions, and pdmp_checks tables. If your dev DB already has rows
// with these patient_id ('P1'-'P5') or prescriber ids (1-4), this will fail on
// primary key conflicts. Either truncate those tables first or change the IDs below.
//
// Fixed from the original script:
//   - 'ali@gmail.com' was used for BOTH patient P2 and prescriber Dr. Ali Nazam.
//     Changed the doctor's email to 'ali.nazam@gmail.com' to satisfy the unique
//     constraint on users.email.
//   - P5 (Laiba Zaman) had a NULL password_hash, but users.password_hash is NOT NULL.
//     Replaced with a real bcrypt hash for the placeholder password 'password123'.
//
// care_takers table is currently missing from the live DB (its migration didn't
// take effect), so that insert is commented out below. Run that migration first
// if you want it included.

const sqlQueries = `
BEGIN;

-- Users (patients)
INSERT INTO users (email, password_hash, name, phone_number, role, dob, address, gender) VALUES
('haris@gmail.com', '$2a$12$ujGabt5jrIQKyJJ7wl4uOexOcLAiQVczu2W56FskhiXTh8qMjhoYy', 'Muhammad Haris', '0300-1234567', 'patient', '2003-06-15', '6th Road Rawalpindi, VA 23220', 'Male'),
('ali@gmail.com', '$2a$12$bM2UxYUrIK78s2r2lZmgNOFM1mxlKKo2nW62RqCjr1wYCx8kVjHse', 'Ali Rehman', '0300-7654321', 'patient', '2002-11-22', 'Faizabad Chowk Rawalpindi, VA 23220', 'Male'),
('ahmed@gmail.com', '$2a$12$6ltxKzX9DcTNqqCmTWudJOMb5twjvVZu9AewZCQhbEzbsTgiAHHC2', 'Ahmed Khan', '0300-1122334', 'patient', '2006-03-10', 'Tench Bahata Chowk Rawalpindi, VA 23510', 'Male'),
('maria@gmail.com', '$2a$12$Vr.3ARvh4m/baOo1NKCBI.d8eI0lk5ZgUWzt9Gxk/vI3JjTMcRtDO', 'Maria Khan', '0300-5566778', 'patient', '1999-07-05', 'New Saddar Bank Road Rawalpindi, VA 22201', 'Female'),
('laiba@gmail.com', '$2b$12$FAI83TRwAecijKN0EeFWDeRnMjuKh9EqEzscU8kCuNulNsmPXBay6', 'Laiba Zaman', '0300-9988776', 'patient', '2010-12-18', 'Hathi Chowk Raja Bazar Rawalpindi, VA 22314', 'Female');

-- Users (prescribers) — note: 'ali@gmail.com' changed to 'ali.nazam@gmail.com' to avoid collision
INSERT INTO users (email, password_hash, name, phone_number, role, dob, address, gender) VALUES
('mohsin@gmail.com', '$2a$12$c4SuVJmKRtk0AJW5WpETJODZ82eCb5WC921llwf53D9Gtc2aWMzxe', 'Dr. Mohsin Khan', '0300-1112223', 'doctor', '1975-08-20', 'Clinic Road, Rawalpindi', 'Male'),
('ali.nazam@gmail.com', '$2a$12$BOtYPJ.4.auHaNOmHjZj9evp7c5kqqYJvr3Hg9EPGgZLR5lWVYQOO', 'Dr. Ali Nazam', '0300-4445556', 'doctor', '1980-04-10', 'Hospital Street, Rawalpindi', 'Male'),
('munir@gmail.com', '$2a$12$V9OF0uniDyT7o7GW.b91vei/ra3otoLGhmGo0sLDRtfPBDmGecHLS', 'Dr. Munir Akhtar', '0300-7778889', 'doctor', '1972-12-05', 'Health Center, Rawalpindi', 'Male'),
('jamil@gmail.com', '$2a$12$ZTGZY08ZbluBjr3/qgErPerxMCC6qyIn.V6quSzt.d6FOjR1gxGEO', 'Dr. Jamil Ahmed', '0300-9990001', 'doctor', '1988-06-15', 'Medical Complex, Rawalpindi', 'Male');

-- Patients: only patient-specific fields now; user_id pulled from the matching users row
INSERT INTO patients (patient_id, insurance, user_id)
SELECT 'P1', 'Aetna', user_id FROM users WHERE email = 'haris@gmail.com'
UNION ALL
SELECT 'P2', 'Blue Cross', user_id FROM users WHERE email = 'ali@gmail.com'
UNION ALL
SELECT 'P3', 'Cigna', user_id FROM users WHERE email = 'ahmed@gmail.com'
UNION ALL
SELECT 'P4', 'UnitedHealth', user_id FROM users WHERE email = 'maria@gmail.com'
UNION ALL
SELECT 'P5', 'Medicare', user_id FROM users WHERE email = 'laiba@gmail.com';

-- Prescribers: only prescriber-specific fields now; user_id pulled from the matching users row.
-- Inserted in this order so prescriber_id auto-increments to 1, 2, 3, 4 — matching the
-- prescriber_id values used in the prescriptions data below. Only safe on an empty table.
INSERT INTO prescribers (role, user_id)
SELECT 'Prescriber', user_id FROM users WHERE email = 'mohsin@gmail.com'
UNION ALL
SELECT 'Prescriber', user_id FROM users WHERE email = 'ali.nazam@gmail.com'
UNION ALL
SELECT 'Prescriber', user_id FROM users WHERE email = 'munir@gmail.com'
UNION ALL
SELECT 'Prescriber', user_id FROM users WHERE email = 'jamil@gmail.com';

-- Medications
INSERT INTO medications (name) VALUES
('Lisinopril'), ('Metformin'), ('Atorvastatin'), ('Levothyroxine'), ('Amlodipine'),
('Omeprazole'), ('Simvastatin'), ('Losartan'), ('Gabapentin'), ('Hydrochlorothiazide'),
('Sertraline'), ('Escitalopram'), ('Albuterol'), ('Prednisone'), ('Ibuprofen');

-- Pharmacies
INSERT INTO pharmacies (name, address, zipcode, phone, hours) VALUES
('CVS Pharmacy #1556', '1170 Emmett St N, Charlottesville, VA', '22903', '(434) 293-9151', 'Open 24 hours'),
('Walgreens', '500 E Main St, Charlottesville, VA', '22903', '(434) 555-1234', '8am - 10pm'),
('Rite Aid', '200 W Broad St, Richmond, VA', '23220', '(804) 555-6789', '9am - 9pm'),
('Costco Pharmacy', '5801 Richmond Hwy, Alexandria, VA', '22303', '(703) 555-1122', '10am - 7pm'),
('Local Drug Mart', '1234 King St, Arlington, VA', '22201', '(703) 555-3344', '9am - 8pm');

-- Prescriptions (unchanged — still keyed off patient_id / prescriber_id / med_id / pharmacy_id directly)
INSERT INTO prescriptions
(patient_id, med_id, prescriber_id, pharmacy_id, dosage, form, instructions, status, status_label, patient_note, discontinued_on, discontinue_reason)
VALUES
('P1', 1, 1, 1, '10 mg', 'tablet', 'Take once daily', 'success', 'Sent on 2025-01-10', 'BP control', NULL, NULL),
('P1', 2, 2, 2, '500 mg', 'tablet', 'Take twice daily with meals', 'success', 'Sent on 2025-02-01', 'Diabetes management', NULL, NULL),
('P1', 3, 1, 3, '20 mg', 'tablet', 'Take at bedtime', 'success', 'Sent on 2025-01-15', 'Cholesterol', NULL, NULL),
('P2', 4, 3, 4, '100 mcg', 'tablet', 'Take once daily on empty stomach', 'success', 'Sent on 2025-02-10', 'Thyroid', NULL, NULL),
('P2', 5, 3, 5, '5 mg', 'tablet', 'Take once daily', 'success', 'Sent on 2025-02-20', 'Hypertension', NULL, NULL),
('P3', 6, 2, 1, '20 mg', 'capsule', 'Take before breakfast', 'success', 'Sent on 2025-01-05', 'Acid reflux', NULL, NULL),
('P3', 7, 4, 2, '40 mg', 'tablet', 'Take at bedtime', 'discontinued', 'Discontinued on 2025-02-01', 'Caused muscle pain', '2025-02-01', NULL),
('P4', 8, 3, 3, '50 mg', 'tablet', 'Take once daily', 'success', 'Sent on 2025-02-15', 'Hypertension', NULL, NULL),
('P4', 9, 1, 4, '300 mg', 'capsule', 'Take three times daily', 'success', 'Sent on 2025-02-20', 'Neuropathy', NULL, NULL),
('P5', 10, 4, 5, '25 mg', 'tablet', 'Take once daily', 'success', 'Sent on 2025-03-01', 'Fluid retention', NULL, NULL),
('P5', 11, 4, 1, '20 mg', 'tablet', 'Take once daily', 'success', 'Sent on 2025-03-01', 'Nerve pain', NULL, NULL);

-- PDMP Checks (unchanged)
INSERT INTO pdmp_checks (patient_id, last_checked, summary) VALUES
('P1', '2025-03-01 10:30:00', 'No controlled substance red flags. Patient compliant.'),
('P2', '2025-02-28 14:15:00', 'Recent opioid prescription from another provider – verify with patient.'),
('P3', '2025-03-10 09:00:00', 'Clean report. No concerning patterns.'),
('P4', '2025-02-20 11:45:00', 'Multiple prescribers for gabapentin – recommend review.'),
('P5', '2025-03-05 13:30:00', 'All prescriptions accounted for. No issues.');

-- CareTaker records: SKIPPED -- the care_takers table doesn't currently exist in the
-- live DB even though its migration file exists. Run that migration first, then
-- uncomment this block.
-- INSERT INTO care_takers (patient_id, prescriber_id, next_appointment, visit_frequency) VALUES
-- ('P1', 1, '2025-04-10 09:00:00', 'Monthly'),
-- ('P2', 3, '2025-03-25 14:30:00', 'Weekly'),
-- ('P3', 2, NULL, 'Quarterly'),
-- ('P4', 3, '2025-04-05 11:00:00', 'Monthly'),
-- ('P5', 4, '2025-03-28 10:15:00', 'Bi-weekly');

COMMIT;
`;

async function insertTestData() {
  try {
    console.log("Inserting test data...");
    await db.sequelize.query(sqlQueries);
    console.log("✅ All test data inserted successfully.");
  } catch (error) {
    console.error("❌ Insert failed, rolling back:", error.message);
    try {
      await db.sequelize.query("ROLLBACK;");
    } catch (_) {
     
    }
  } finally {
    await db.sequelize.close();
  }
}

insertTestData();
