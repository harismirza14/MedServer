require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  Prescription,
  Patient,
  Medication,
  Pharmacy,
  Prescriber,
  PdmpCheck,
} = require("./models");

const app = express();
const bcrypt = require("bcrypt");
app.use(cors());
app.use(express.json());

const PRESCRIPTION_INCLUDE = [
  { model: Medication, attributes: ["name"] },
  { model: Pharmacy, attributes: ["name"] },
  { model: Prescriber, attributes: ["name", "role"] },
  { model: Patient, attributes: ["patient_id", "name", "dob"] },
];

function flattenPrescription(p) {
  const obj = p.toJSON();
  return {
    ...obj,
    med_name: obj.Medication?.name ?? null,
    pharmacy_name: obj.Pharmacy?.name ?? null,
    prescriber_id: obj.prescriber_id,
    prescriber_name: obj.Prescriber?.name ?? null,
    prescriber_role: obj.Prescriber?.role ?? null,
    patient_name: obj.Patient?.name ?? null,
    patient_id: obj.Patient?.patient_id ?? null,
    Medication: undefined,
    Pharmacy: undefined,
    Prescriber: undefined,
    Patient: undefined,
  };
}

async function getFullPrescription(prescriptionId) {
  const p = await Prescription.findByPk(prescriptionId, {
    include: PRESCRIPTION_INCLUDE,
  });
  return p ? flattenPrescription(p) : null;
}


app.post("/api/login", async (req, res) => {
  const { userId, password } = req.body;
  try {
    let user = await Patient.findByPk(userId);
    let role = "patient";
    if (!user) {
      user = await Prescriber.findByPk(userId);
      role = "doctor";
    }
    if (!user) return res.status(404).json({ error: "User not found" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const { password_hash, ...userWithoutHash } = user.toJSON();
    res.json({ user: userWithoutHash, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:id/pdmp", async (req, res) => {
  try {
    const record = await PdmpCheck.findOne({
      where: { patient_id: req.params.id },
      order: [["last_checked", "DESC"]],
    });
    res.json(record || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:patientId/prescriptions", async (req, res) => {
  const { patientId } = req.params;
  const { prescriber_id } = req.query;
  const where = { patient_id: patientId };
  if (prescriber_id) where.prescriber_id = prescriber_id;

  try {
    const prescriptions = await Prescription.findAll({
      where,
      include: PRESCRIPTION_INCLUDE,
      order: [["prescription_id", "DESC"]],
    });
    res.json(prescriptions.map(flattenPrescription));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/prescribers/:prescriberId/patients", async (req, res) => {
  const { prescriberId } = req.params;
  try {
    const patients = await Patient.findAll({
      include: [{
        model: Prescription,
        where: { prescriber_id: prescriberId },
        required: true,              
        attributes: []               
      }],
      attributes: ["patient_id", "name", "dob", "insurance"],
      group: ["Patient.patient_id", "Patient.name", "Patient.dob", "Patient.insurance"],
      subQuery: false ,
      order: [["patient_id", "ASC"]]               
    })
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/prescriptions", async (req, res) => {
  const {
    patient_id,
    med_name,
    prescriber_id = null,
    pharmacy_id = null,
    dosage,
    form,
    instructions,
    status,
    status_label,
    patient_note,
    external_prescriber = null,
  } = req.body;

  try {
    const [medication] = await Medication.findOrCreate({
      where: { name: med_name },
      defaults: { name: med_name },
    });

    const prescription = await Prescription.create({
      patient_id,
      med_id: medication.med_id,
      prescriber_id,
      pharmacy_id,
      dosage,
      form,
      instructions,
      status,
      status_label,
      patient_note,
      external_prescriber,
    });

    const full = await getFullPrescription(prescription.prescription_id);
    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/prescriptions/:id", async (req, res) => {
  const { id } = req.params;
  const role = req.headers["x-user-role"];    
  const userId = req.headers["x-user-id"];

  try {
    const prescription = await Prescription.findByPk(id);
    if (!prescription) return res.status(404).json({ error: "Not found" });

    if (role === "patient") {
      return res
        .status(403)
        .json({ error: "Patients cannot edit prescriptions" });
    }
    if (
      role === "doctor" &&
      String(prescription.prescriber_id) !== String(userId)
    ) {
      return res
        .status(403)
        .json({ error: "You can only edit your own prescriptions" });
    }

    const data = req.body.updates || req.body;
    const allowedFields = [
      "dosage",
      "form",
      "instructions",
      "patient_note",
      "pharmacy_id",
      "med_id",
      "status",
      "external_prescriber",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(data, field))
        updates[field] = data[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await Prescription.update(updates, { where: { prescription_id: id } });
    const full = await getFullPrescription(id);
    res.json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/prescriptions/:id/discontinue", async (req, res) => {
  const { reason } = req.body;
  try {
    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) return res.status(404).json({ error: "Not found" });

    await prescription.update({
      status: "discontinued",
      discontinued_on: new Date(),
      discontinue_reason: reason,
    });
    res.json(await getFullPrescription(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/prescriptions/:id/recontinue", async (req, res) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) return res.status(404).json({ error: "Not found" });

    await prescription.update({
      status: "success",
      discontinued_on: null,
      discontinue_reason: null,
    });
    res.json(await getFullPrescription(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/medications", async (req, res) => {
  try {
    const meds = await Medication.findAll({
      attributes: ["med_id", "name"],
      order: [["name", "ASC"]],
    });
    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/pharmacies", async (req, res) => {
  const { zip } = req.query;
  if (!zip) return res.status(400).json({ error: "Zip required" });
  try {
    const pharmacies = await Pharmacy.findAll({
      attributes: [
        "pharmacy_id",
        "name",
        "address",
        "zipcode",
        "phone",
        "hours",
      ],
      where: { zipcode: zip },
    });
    res.json(pharmacies.map((p) => ({ ...p.toJSON(), id: p.pharmacy_id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
