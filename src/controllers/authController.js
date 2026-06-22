const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/userRepository");
const patientRepo = require("../repositories/patientRepository");
const prescriberRepo = require("../repositories/prescriberRepository");
async function login(req, res) {
  const { userId, password } = req.body;
  try {
    const user = await userRepo.findByEmail(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const tokenPayload = {
      userId: user.user_id,
      role: user.role,
    };
    let roleSpecificId = null;
    if (user.role === "patient") {
      const patient = await patientRepo.findByUserId(user.user_id);
      if (patient) {
        roleSpecificId = patient.patient_id;
      }
    } else if (user.role === "doctor") {
      const prescriber = await prescriberRepo.findByUserId(user.user_id);
      if (prescriber) {
        roleSpecificId = prescriber.prescriber_id;
      }
    }
    if (roleSpecificId) {
      tokenPayload.roleSpecificId = roleSpecificId;
    }
    const token = jwt.sign(tokenPayload, process.env.JWT_KEY, {
      expiresIn: "8h",
    });
    const { password_hash, ...userWithoutHash } = user.toJSON();
    const userResponse = { ...userWithoutHash, roleSpecificId };
    res.json({ user: userResponse, role: user.role, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { login };
