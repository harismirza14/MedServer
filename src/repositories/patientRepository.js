const {
  Patient,
  Prescription,
  User,
  CareTeam,
  CareTeamMember,
  sequelize,
} = require("../models");
const { Op, fn, col, where: sequelizeWhere } = require("sequelize");

async function findById(patientId) {
  return await Patient.findByPk(patientId, {
    include: [{ model: User, attributes: { exclude: ["password_hash"] } }],
  });
}

async function findByPrescriberId(prescriberId, filters = {}) {
  const { search = "", gender = "all" } = filters;

  const careTeamMembers = await CareTeamMember.findAll({
    where: { prescriber_id: prescriberId },
    include: [{ model: CareTeam, attributes: ["patient_id"] }],
    attributes: [],
  });
  const careTeamPatientIds = careTeamMembers
    .map((m) => m.CareTeam?.patient_id)
    .filter((id) => id);

  const prescriptionPatients = await Prescription.findAll({
    where: { prescriber_id: prescriberId },
    attributes: ["patient_id"],
    group: ["patient_id"],
  });
  const prescriptionPatientIds = prescriptionPatients.map((p) => p.patient_id);

  const allPatientIds = [
    ...new Set([...careTeamPatientIds, ...prescriptionPatientIds]),
  ];
  if (allPatientIds.length === 0) return [];

  const where = { patient_id: allPatientIds };
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { patient_id: { [Op.iLike]: term } },
      { "$User.name$": { [Op.iLike]: term } },
    ];
  }

  const patients = await Patient.findAll({
    where,
    include: [
      {
        model: User,
        attributes: { exclude: ["password_hash"] },
        where:
          gender && gender !== "all"
            ? sequelizeWhere(
                fn("LOWER", col("User.gender")),
                gender.toLowerCase(),
              )
            : undefined,
      },
    ],
    attributes: ["patient_id", "insurance", "zipcode"],
    order: [
      [
        sequelize.literal(
          'CAST(SUBSTRING("Patient"."patient_id", 2) AS INTEGER)',
        ),
        "ASC",
      ],
    ],
  });
  return patients.map((p) => {
    const { User, ...patientData } = p.toJSON();
    return { ...User, ...patientData };
  });
}

async function createPatient(data, options = {}) {
  return await Patient.create(data, options);
}

async function updatePatient(patientId, updates) {
  return await Patient.update(updates, { where: { patient_id: patientId } });
}

async function findLastPatientId() {
  return await Patient.findOne({
    where: { patient_id: { [Op.like]: "P%" } },
    order: [
      [sequelize.literal("CAST(SUBSTRING(patient_id, 2) AS INTEGER)"), "DESC"],
    ],
    attributes: ["patient_id"],
  });
}

async function deletePatient(patientId) {
  return await Patient.destroy({ where: { patient_id: patientId } });
}

async function findByUserId(userId) {
  return await Patient.findOne({ where: { user_id: userId } });
}

module.exports = {
  findById,
  findByUserId,
  findByPrescriberId,
  createPatient,
  updatePatient,
  deletePatient,
  findLastPatientId,
};
