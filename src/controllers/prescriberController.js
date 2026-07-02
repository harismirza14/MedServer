const userRepo = require("../repositories/userRepository");
const prescriberRepo = require("../repositories/prescriberRepository");
const { sequelize, Prescription, CareTeamMember } = require("../models");
const bcrypt = require("bcrypt");
const { sendTemporaryPassword } = require("../utils/email");

async function createPrescriber(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      name,
      email,
      phone_number,
      dob,
      address,
      gender,
      specialty,
      pmdc_number,
      education,
    } = req.body;

    if (!name || !email || !phone_number) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Name, email, and phone number are required." });
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
        phone_number,
        role: "doctor",
        dob: dob || null,
        address: address || null,
        gender: gender || null,
      },
      { transaction: t },
    );

    const newPrescriber = await prescriberRepo.createPrescriber(
      {
        user_id: user.user_id,
        specialty: specialty || null,
        pmdc_number: pmdc_number || null,
        education: education || null,
      },
      { transaction: t },
    );

    await user.update(
      { prescriber_id: newPrescriber.prescriber_id },
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
    const prescriberData = newPrescriber.toJSON();
    const responseData = { ...userData, ...prescriberData };
    delete responseData.user_id;

    res.status(201).json(responseData);
  } catch (err) {
    await t.rollback();
    console.error("Error in createPrescriber:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getPrescriberById(req, res) {
  try {
    const prescriber = await prescriberRepo.findById(req.params.id);
    if (!prescriber) {
      return res.status(404).json({ error: "Prescriber not found." });
    }

    const { role, roleSpecificId } = req.user;
    if (role === "doctor" && String(roleSpecificId) !== String(req.params.id)) {
      return res.status(403).json({ error: "You can only view your own profile." });
    }

    const data = prescriber.toJSON();
    const userData = data.User;
    delete data.User;
    delete data.user_id;
    const combined = { ...userData, ...data };
    delete combined.password_hash;

    res.json(combined);
  } catch (err) {
    console.error("Error in getPrescriberById:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getAllPrescribers(req, res) {
  try {
    const { search, gender, page, limit } = req.query;
    const result = await prescriberRepo.findAllPaginated({ search, gender, page, limit });
    res.json(result);
  } catch (err) {
    console.error("Error in getAllPrescribers:", err);
    res.status(500).json({ error: err.message });
  }
}

async function updatePrescriber(req, res) {
  try {
    const prescriber = await prescriberRepo.findById(req.params.id);
    if (!prescriber) return res.status(404).json({ error: "Doctor not found." });

    const { role, userId } = req.user;

    let authorized = false;
    if (role === "admin") {
      authorized = true;
    } else if (role === "doctor") {
      authorized = userId === prescriber.user_id;
    }
    // role === "patient" (or anything else) stays unauthorized by default

    if (!authorized) {
      return res.status(403).json({ error: "You are not authorized to update this doctor." });
    }

    const { name, email, phone_number, gender, dob, address, specialty, pmdc_number, education } = req.body;

    if (email && email !== prescriber.User.email) {
      const existing = await userRepo.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered." });
      }
    }

    await prescriber.User.update({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone_number !== undefined && { phone_number }),
      ...(gender !== undefined && { gender }),
      ...(dob !== undefined && { dob }),
      ...(address !== undefined && { address }),
    });

    await prescriberRepo.updatePrescriber(req.params.id, {
      ...(specialty !== undefined && { specialty }),
      ...(pmdc_number !== undefined && { pmdc_number }),
      ...(education !== undefined && { education }),
    });

    const updated = await prescriberRepo.findById(req.params.id);
    const data = updated.toJSON();
    const userData = data.User;
    delete data.User;
    delete data.user_id;
    const combined = { ...userData, ...data };
    delete combined.password_hash;

    res.json(combined);
  } catch (err) {
    console.error("Error in updatePrescriber:", err);
    res.status(500).json({ error: err.message });
  }
}

async function deletePrescriber(req, res) {
  const t = await sequelize.transaction();
  try {
    const prescriber = await prescriberRepo.findById(req.params.id);
    if (!prescriber) {
      await t.rollback();
      return res.status(404).json({ error: "Doctor not found." });
    }

    const prescriptionCount = await Prescription.count({
      where: { prescriber_id: req.params.id },
    });
    if (prescriptionCount > 0) {
      await t.rollback();
      return res.status(409).json({
        error: "Cannot delete a doctor with existing prescriptions. Consider deactivating instead.",
      });
    }

    await CareTeamMember.destroy({
      where: { prescriber_id: req.params.id },
      transaction: t,
    });

    await userRepo.deleteUser(prescriber.user_id, { transaction: t });

    await t.commit();
    res.json({ message: "Doctor deleted successfully." });
  } catch (err) {
    await t.rollback();
    console.error("Error in deletePrescriber:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createPrescriber, getPrescriberById, getAllPrescribers, updatePrescriber, deletePrescriber };