const bcrypt = require('bcrypt');
const patientRepo = require('../repositories/patientRepository');
const prescriberRepo = require('../repositories/prescriberRepository');

async function login(req, res) {
  const { userId, password } = req.body;
  try {
    let user = await patientRepo.findById(userId);
    let role = "patient";
    if (!user) {
      user = await prescriberRepo.findById(userId);
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
}

module.exports = { login };