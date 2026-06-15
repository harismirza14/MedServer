const medicationRepo = require('../repositories/medicationRepository');
const pharmacyRepo = require('../repositories/pharmacyRepository');

async function getMedications(req, res) {
  try {
    const meds = await medicationRepo.findAll();
    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPharmaciesByZip(req, res) {
  const { zip } = req.query;
  if (!zip) return res.status(400).json({ error: "Zip required" });
  try {
    const pharmacies = await pharmacyRepo.findByZip(zip);
    res.json(pharmacies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getMedications, getPharmaciesByZip };