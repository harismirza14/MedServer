const userRepo = require("../repositories/userRepository");
const prescriberRepo = require("../repositories/prescriberRepository");
const { sequelize } = require("../models");
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

async function getAllPrescribers(req, res) {
  try {
    const prescribers = await prescriberRepo.findAll();
    res.json(prescribers);
  } catch (err) {
    console.error(err);
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



module.exports = { createPrescriber, getAllPrescribers, getPrescriberById };