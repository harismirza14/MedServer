const patientRepo = require("../repositories/patientRepository");
const userRepo = require("../repositories/userRepository");
const pdmpRepo = require("../repositories/pdmpRepository");
const prescriberRepo = require("../repositories/prescriberRepository");
const {
  sequelize,
  Prescription,
  CareTeam,
  CareTeamMember,
} = require("../models");
const bcrypt = require("bcrypt");
const { sendTemporaryPassword } = require("../utils/email");
const { get } = require("../routes/careTeamRoutes");

async function getPatientById(req, res) {
  try {
    const patient = await patientRepo.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    const { role, userId } = req.user;
    if (role === "patient" && userId !== patient.user_id) {
      return res
        .status(403)
        .json({ error: "You can only view your own data." });
    }
    const patientData = patient.toJSON();
    const userData = patientData.User;
    delete patientData.User;
    delete patientData.user_id;
    const combined = { ...userData, ...patientData };
    delete combined.password_hash;
    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getPdmpByPatientId(req, res) {
  try {
    const record = await pdmpRepo.findLatestByPatientId(req.params.id);
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getDoctorPatients(req, res) {
  const { prescriberId } = req.params;
  const { search, gender, page, limit } = req.query;
  try {
    const result = await patientRepo.findByPrescriberId(prescriberId, { search, gender, page, limit });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function createPatient(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      name,
      email,
      dob,
      address,
      gender,
      phone_number,
      insurance,
      zipcode,
      patient_id,
    } = req.body;
    let prescriberId = req.user.roleSpecificId;
    if (!prescriberId) {
      const prescriber = await prescriberRepo.findByUserId(req.user.userId);
      if (prescriber) prescriberId = prescriber.prescriber_id;
    }
    if (!prescriberId) {
      await t.rollback();
      return res
        .status(403)
        .json({ error: "Prescriber ID not found for the logged-in user." });
    }

    if (!name || !email || !phone_number || !dob) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Name, email, phone, and date of birth are required." });
    }

    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      await t.rollback();
      return res.status(409).json({ error: "Email already registered." });
    }

    const dummyPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(dummyPassword, 10);

    const user = await userRepo.createUser(
      {
        email,
        password_hash: passwordHash,
        name,
        phone_number: phone_number || null,
        role: "patient",
        dob,
        address: address || null,
        gender: gender || null,
      },
      { transaction: t },
    );

    let finalPatientId = patient_id;
    if (!finalPatientId) {
      const lastPatient = await patientRepo.findLastPatientId();
      let nextNumber = 1;
      if (lastPatient && lastPatient.patient_id) {
        const num = parseInt(lastPatient.patient_id.replace("P", ""), 10);
        if (!isNaN(num)) nextNumber = num + 1;
      }
      finalPatientId = `P${String(nextNumber)}`;
    }

    const existingPatient = await patientRepo.findById(finalPatientId);
    if (existingPatient) {
      await t.rollback();
      return res.status(409).json({ error: "Patient ID already exists." });
    }

    const newPatient = await patientRepo.createPatient(
      {
        patient_id: finalPatientId,
        user_id: user.user_id,
        insurance: insurance || null,
        zipcode: zipcode || null,
      },
      { transaction: t },
    );

    await user.update({ patient_id: finalPatientId }, { transaction: t });

    const careTeam = await CareTeam.create(
      {
        patient_id: finalPatientId,
        next_appointment: null,
        visit_frequency: null,
      },
      { transaction: t },
    );

    await CareTeamMember.create(
      {
        care_team_id: careTeam.care_team_id,
        prescriber_id: prescriberId,
        role: "Primary Physician",
      },
      { transaction: t },
    );
    await t.commit();

    try {
      await sendTemporaryPassword(email, dummyPassword, name);
    } catch (emailErr) {
      console.error("Failed to send temporary password email:", emailErr);
    }

    const userData = user.toJSON();
    delete userData.password_hash;
    const patientData = newPatient.toJSON();
    const responseData = { ...userData, ...patientData };
    delete responseData.user_id;

    res.status(201).json(responseData);
  } catch (err) {
    await t.rollback();
    console.error("Error in createPatient:", err);
    res.status(500).json({ error: err.message });
  }
}

async function updatePatient(req, res) {
  try {
    const patient = await patientRepo.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found." });

    const { role, userId, roleSpecificId } = req.user;

    let authorized = false;
    if (role === "admin") {
      authorized = true;
    } else if (role === "patient") {
      authorized = userId === patient.user_id;
    } else if (role === "doctor") {
      authorized = await patientRepo.isPatientOfPrescriber(roleSpecificId, req.params.id);
    }

    if (!authorized) {
      return res.status(403).json({ error: "You are not authorized to update this patient." });
    }

    const { name, email, phone_number, gender, dob, address, insurance, zipcode } = req.body;

    if (email && email !== patient.User.email) {
      const existing = await userRepo.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered." });
      }
    }

    await patient.User.update({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone_number !== undefined && { phone_number }),
      ...(gender !== undefined && { gender }),
      ...(dob !== undefined && { dob }),
      ...(address !== undefined && { address }),
    });

    await patientRepo.updatePatient(req.params.id, {
      ...(insurance !== undefined && { insurance }),
      ...(zipcode !== undefined && { zipcode }),
    });

    const updated = await patientRepo.findById(req.params.id);
    const data = updated.toJSON();
    const userData = data.User;
    delete data.User;
    delete data.user_id;
    const combined = { ...userData, ...data };
    delete combined.password_hash;

    res.json(combined);
  } catch (err) {
    console.error("Error in updatePatient:", err);
    res.status(500).json({ error: err.message });
  }
}

async function deletePatient(req, res) {
  const t = await sequelize.transaction();
  try {
    const patient = await patientRepo.findById(req.params.id);
    if (!patient) {
      await t.rollback();
      return res.status(404).json({ error: "Patient not found." });
    }

    const { role, roleSpecificId } = req.user;
    if (role === "doctor") {
      const authorized = await patientRepo.isPatientOfPrescriber(roleSpecificId, req.params.id);
      if (!authorized) {
        await t.rollback();
        return res.status(403).json({ error: "You do not have a care relationship with this patient." });
      }
    }

    const prescriptionCount = await Prescription.count({
      where: { patient_id: req.params.id },
    });
    if (prescriptionCount > 0) {
      await t.rollback();
      return res.status(409).json({
        error: "Cannot delete a patient with existing prescriptions. Medical records must be retained.",
      });
    }

    const careTeam = await CareTeam.findOne({ where: { patient_id: req.params.id } });
    if (careTeam) {
      await CareTeamMember.destroy({ where: { care_team_id: careTeam.care_team_id }, transaction: t });
      await careTeam.destroy({ transaction: t });
    }

    await userRepo.deleteUser(patient.user_id, { transaction: t });

    await t.commit();
    res.json({ message: "Patient deleted successfully." });
  } catch (err) {
    await t.rollback();
    console.error("Error in deletePatient:", err);
    res.status(500).json({ error: err.message });
  }
}
async function getCareTeam(req, res) {
  try {
    const { patientId } = req.params;
    const careTeam = await patientRepo.getCareTeamByPatientId(patientId);
    res.json(careTeam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getPatientById,
  getPdmpByPatientId,
  getDoctorPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getCareTeam,
};