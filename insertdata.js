const db = require('./models');

const sqlQueries = `
-- Patients
INSERT INTO patients (patient_id, name, dob, address, visit_frequency, next_appointment, insurance) VALUES
('P1', 'Muhammad Haris', '1985-06-15', '6th Road Rawalpindi,VA 23220', 'Monthly', '2025-04-10 09:00:00', 'Aetna'),
('P2', 'ALi Rehman', '1990-11-22', 'Faizabad Chowk Rawalpindi, VA 23220', 'Weekly', '2025-03-25 14:30:00', 'Blue Cross'),
('P3', 'Ahmed Khan', '1978-03-10', 'Tench Bahata Chowk Rawalpindi, VA 23510', 'Quarterly', NULL, 'Cigna'),
('P4', 'Maria Khan', '1995-07-05', 'New Saddar Bank Road Rawalpindi, VA 22201', 'Monthly', '2025-04-05 11:00:00', 'UnitedHealth'),
('P5', 'Laiba Zaman', '1982-12-18', 'Hathi Chowk Raja Bazar Rawalpindi, VA 22314', 'Bi-weekly', '2025-03-28 10:15:00', 'Medicare');

-- Prescribers
INSERT INTO prescribers (name, role) VALUES
('Dr. Mohsin Khan', 'Prescriber'),
('Dr. ALi Nazam', 'Prescriber'),
('Dr. Munir Akhtar', 'Prescriber'),
('Dr. Jamil Ahmed', 'Prescriber');

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

-- Prescriptions
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

-- PDMP Checks
INSERT INTO pdmp_checks (patient_id, last_checked, summary) VALUES
('P1', '2025-03-01 10:30:00', 'No controlled substance red flags. Patient compliant.'),
('P2', '2025-02-28 14:15:00', 'Recent opioid prescription from another provider – verify with patient.'),
('P3', '2025-03-10 09:00:00', 'Clean report. No concerning patterns.'),
('P4', '2025-02-20 11:45:00', 'Multiple prescribers for gabapentin – recommend review.'),
('P5', '2025-03-05 13:30:00', 'All prescriptions accounted for. No issues.');
`;
const AlterQuery= `
ALTER TABLE prescriptions ALTER COLUMN prescriber_id DROP NOT NULL;`

const UpdateQuery= `
UPDATE patients SET password_hash = '$2a$12$ujGabt5jrIQKyJJ7wl4uOexOcLAiQVczu2W56FskhiXTh8qMjhoYy' WHERE patient_id = 'P1';,
UPDATE patients SET password_hash = '$2a$12$bM2UxYUrIK78s2r2lZmgNOFM1mxlKKo2nW62RqCjr1wYCx8kVjHse' WHERE patient_id = 'P2';,
UPDATE patients SET password_hash = '$2a$12$6ltxKzX9DcTNqqCmTWudJOMb5twjvVZu9AewZCQhbEzbsTgiAHHC2' WHERE patient_id = 'P3';,
UPDATE patients SET password_hash = '$2a$12$Vr.3ARvh4m/baOo1NKCBI.d8eI0lk5ZgUWzt9Gxk/vI3JjTMcRtDO' WHERE patient_id = 'P4';,
update prescribers set password_hash = '$2a$12$c4SuVJmKRtk0AJW5WpETJODZ82eCb5WC921llwf53D9Gtc2aWMzxe' where name = 'Dr. Mohsin Khan';,
update prescribers set password_hash = '$2a$12$BOtYPJ.4.auHaNOmHjZj9evp7c5kqqYJvr3Hg9EPGgZLR5lWVYQOO' where name = 'Dr. ALi Nazam';,
update prescribers set password_hash = '$2a$12$V9OF0uniDyT7o7GW.b91vei/ra3otoLGhmGo0sLDRtfPBDmGecHLS' where name = 'Dr. Munir Akhtar';,
update prescribers set password_hash = '$2a$12$ZTGZY08ZbluBjr3/qgErPerxMCC6qyIn.V6quSzt.d6FOjR1gxGEO' where name = 'Dr. Jamil Ahmed';`;
async function insertTestData() {
  try {
    console.log('Inserting test data...');
    // await db.sequelize.query(sqlQueries);
    // await db.sequelize.query(AlterQuery);
    await db.sequelize.query(UpdateQuery);
    console.log('✅ All test data inserted successfully.');
  } catch (error) {
    console.error('❌ Insert failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

insertTestData();