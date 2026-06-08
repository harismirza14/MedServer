require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

async function getFullPrescription(prescriptionId) {
  const result = await pool.query(
    `SELECT p.*, 
            m.name AS med_name, 
            ph.name AS pharmacy_name, 
            pr.name AS prescriber_name
     FROM prescriptions p
     JOIN medications m ON p.med_id = m.med_id
     JOIN pharmacies ph ON p.pharmacy_id = ph.pharmacy_id
     JOIN prescribers pr ON p.prescriber_id = pr.prescriber_id
     WHERE p.prescription_id = $1`,
    [prescriptionId],
  );
  return result.rows[0];
}

app.get("/api/patients", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.patients");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:patientId/prescriptions", async (req, res) => {
  const { patientId } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, 
              m.name AS med_name, 
              ph.name AS pharmacy_name, 
              pr.name AS prescriber_name,
              pr.role AS prescriber_role
       FROM prescriptions p
       JOIN medications m ON p.med_id = m.med_id
       JOIN pharmacies ph ON p.pharmacy_id = ph.pharmacy_id
       JOIN prescribers pr ON p.prescriber_id = pr.prescriber_id
       WHERE p.patient_id = $1
       ORDER BY p.prescription_id DESC`,
      [patientId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/prescriptions", async (req, res) => {
  const {
    patient_id,
    med_name,
    prescriber_id,
    pharmacy_id,
    dosage,
    form,
    instructions,
    status,
    status_label,
    patient_note,
  } = req.body;

  try {
    let medId = await pool.query(
      `SELECT med_id FROM medications WHERE name = $1`,
      [med_name],
    );
    if (medId.rows.length === 0) {
      const newMed = await pool.query(
        `INSERT INTO medications (name) VALUES ($1) RETURNING med_id`,
        [med_name],
      );
      medId = newMed.rows[0].med_id;
    } else {
      medId = medId.rows[0].med_id;
    }

    const insertResult = await pool.query(
      `INSERT INTO prescriptions 
       (patient_id, med_id, prescriber_id, pharmacy_id, dosage, form, instructions, status, status_label, patient_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING prescription_id`,
      [
        patient_id,
        medId,
        prescriber_id,
        pharmacy_id,
        dosage,
        form,
        instructions,
        status,
        status_label,
        patient_note,
      ],
    );

    const newPrescriptionId = insertResult.rows[0].prescription_id;
    const fullPrescription = await getFullPrescription(newPrescriptionId);
    res.status(201).json(fullPrescription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/prescriptions/:id", async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    "dosage",
    "form",
    "instructions",
    "patient_note",
    "pharmacy_id",
    "med_id",
    "status",
  ];
  const updates = {};
  allowedFields.forEach((field) => {  
    if (req.body[field] !== undefined && req.body[field] !== "") {
      updates[field] = req.body[field];
    }
  });

  try {
    const keys = Object.keys(updates);
    const values = Object.values(updates);

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");

    const query = `UPDATE prescriptions SET ${setClause} WHERE prescription_id = $${keys.length + 1} RETURNING *`;

    const result = await pool.query(query, [...values, id]);

    const fullPrescription = await getFullPrescription(id);
    res.json(fullPrescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.patch("/api/prescriptions/:id/discontinue", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query(
      `UPDATE prescriptions 
       SET status = 'discontinued',
           discontinued_on = CURRENT_DATE,
           discontinue_reason = $1
       WHERE prescription_id = $2`,
      [reason, id],
    );
    const fullPrescription = await getFullPrescription(id);
    res.json(fullPrescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/prescriptions/:id/recontinue", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE prescriptions 
       SET status = 'success',
           discontinued_on = NULL,
           discontinue_reason = NULL
       WHERE prescription_id = $1`,
      [id],
    );
    const fullPrescription = await getFullPrescription(id);
    res.json(fullPrescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MASTER DATA ROUTES ====================

app.get("/api/medications", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT med_id, name FROM medications ORDER BY name",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/pharmacies", async (req, res) => {
  const { zip } = req.query;
  if (!zip) return res.status(400).json({ error: "Zip code required" });
  try {
    const result = await pool.query(
      "SELECT pharmacy_id as id, name, address, zipcode, phone, hours FROM pharmacies WHERE zipcode = $1",
      [zip],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM patients WHERE patient_id = $1",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Patient not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:id/pdmp", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM pdmp_checks WHERE patient_id = $1 ORDER BY last_checked DESC LIMIT 1",
      [id],
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/prescribers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT prescriber_id, name, role FROM prescribers",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== START SERVER ====================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
