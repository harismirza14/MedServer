const {
  Patient,
  Prescription,
  User,
  CareTeam,
  CareTeamMember,
  Prescriber,
  sequelize,
} = require("../models");
const { Op, fn, col, where: sequelizeWhere } = require("sequelize");

async function findById(patientId) {
  return await Patient.findByPk(patientId, {
    include: [{ model: User, attributes: { exclude: ["password_hash"] } }],
  });
}

async function findByPrescriberId(prescriberId, filters = {}) {
  const { search = "", gender = "all", page = 1, limit = 5 } = filters;

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
  if (allPatientIds.length === 0)
    return { data: [], total: 0, page, totalPages: 0 };

  const where = { patient_id: allPatientIds };
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { "$User.name$": { [Op.iLike]: term } },
      { "$User.phone_number$": { [Op.iLike]: term } },
      { insurance: { [Op.iLike]: term } },
    ];
  }

  const include = [
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
  ];

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await Patient.findAndCountAll({
    where,
    include,
    attributes: ["patient_id", "insurance", "zipcode"],
    order: [
      [
        sequelize.literal(
          'CAST(SUBSTRING("Patient"."patient_id", 2) AS INTEGER)',
        ),
        "ASC",
      ],
    ],
    limit: Number(limit),
    offset,
  });

  const data = rows.map((p) => {
    const { User, ...patientData } = p.toJSON();
    return { ...User, ...patientData };
  });

  return {
    data,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / Number(limit)),
  };
}

async function isPatientOfPrescriber(prescriberId, patientId) {
  const careTeamMember = await CareTeamMember.findOne({
    where: { prescriber_id: prescriberId },
    include: [
      { model: CareTeam, where: { patient_id: patientId }, attributes: [] },
    ],
  });
  if (careTeamMember) return true;

  const prescription = await Prescription.findOne({
    where: { prescriber_id: prescriberId, patient_id: patientId },
  });
  return !!prescription;
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
async function getCareTeamByPatientId(patientId) {
  const careTeam = await CareTeam.findOne({
    where: { patient_id: patientId },
    include: [{
      model: CareTeamMember,
      include: [{
        model: Prescriber,
        include: [{
          model: User,
          attributes: { exclude: ['password_hash'] }
        }]
      }]
    }]
  });

  if (!careTeam) return { members: [] };

  const members = careTeam.CareTeamMembers.map(member => ({
    member_id: member.member_id,
    prescriber_id: member.prescriber_id,
    role: member.role,
    name: member.Prescriber?.User?.name || 'Unknown',
    specialty: member.Prescriber?.specialty || null,
    phone_number: member.Prescriber?.User?.phone_number || null,
  }));

  return { members };
}
module.exports = {
  findById,
  findByUserId,
  findByPrescriberId,
  isPatientOfPrescriber,
  createPatient,
  updatePatient,
  deletePatient,
  findLastPatientId,
  getCareTeamByPatientId,
};
