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
  // 1. Fetch care team members from care_team_members (existing logic)
  const careTeam = await CareTeam.findOne({
    where: { patient_id: patientId },
    include: [
      {
        model: CareTeamMember,
        include: [
          {
            model: Prescriber,
            include: [
              {
                model: User,
                attributes: { exclude: ["password_hash"] },
              },
            ],
          },
        ],
      },
    ],
  });

  const careTeamMembers = careTeam?.CareTeamMembers || [];
  const careTeamMap = new Map();
  const members = [];

  // Build map of care team members by prescriber_id
  careTeamMembers.forEach((member) => {
    const prescriberId = member.prescriber_id;
    careTeamMap.set(prescriberId, {
      member_id: member.member_id,
      prescriber_id: prescriberId,
      role: member.role || "Member",
      name: member.Prescriber?.User?.name || "Unknown",
      specialty: member.Prescriber?.specialty || null,
      phone_number: member.Prescriber?.User?.phone_number || null,
    });
    members.push(careTeamMap.get(prescriberId));
  });

  // 2. Fetch distinct prescribers from prescriptions for this patient
  const prescriptionPrescribers = await Prescription.findAll({
    where: { patient_id: patientId },
    attributes: ["prescriber_id"],
    group: ["prescriber_id"],
    raw: true,
  });

  const prescriberIds = prescriptionPrescribers
    .map((p) => p.prescriber_id)
    .filter((id) => id !== null);

  if (prescriberIds.length > 0) {
    // Fetch full prescriber details including User
    const prescribers = await Prescriber.findAll({
      where: { prescriber_id: { [Op.in]: prescriberIds } },
      include: [
        {
          model: User,
          attributes: { exclude: ["password_hash"] },
        },
      ],
    });

    prescribers.forEach((prescriber) => {
      const prescriberId = prescriber.prescriber_id;
      if (!careTeamMap.has(prescriberId)) {
        // Not in care team, add as synthetic member
        members.push({
          member_id: -prescriberId, // negative to avoid collision with real IDs
          prescriber_id: prescriberId,
          role: "Prescriber",
          name: prescriber.User?.name || "Unknown",
          specialty: prescriber.specialty || null,
          phone_number: prescriber.User?.phone_number || null,
        });
      }
      // else: already in care team, skip
    });
  }

  // Sort members by name
  members.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

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