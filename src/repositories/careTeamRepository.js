const { CareTeam, CareTeamMember, Prescriber, User } = require("../models");

async function findByPatientId(patientId) {
  const careTeam = await CareTeam.findOne({
    where: { patient_id: patientId },
    include: [
      {
        model: CareTeamMember,
        include: [
          {
            model: Prescriber,
            include: [{ model: User, attributes: { exclude: ["password_hash"] } }],
          },
        ],
      },
    ],
  });

  if (!careTeam) return null;

  const data = careTeam.toJSON();
  const members = (data.CareTeamMembers || []).map((member) => {
    const prescriber = member.Prescriber || {};
    const user = prescriber.User || {};
    return {
      member_id: member.member_id,
      role: member.role,
      prescriber_id: prescriber.prescriber_id,
      name: user.name,
      specialty: prescriber.specialty,
      phone_number: user.phone_number,
      email: user.email,
    };
  });

  return {
    care_team_id: data.care_team_id,
    next_appointment: data.next_appointment,
    visit_frequency: data.visit_frequency,
    members,
  };
}

async function addMember(patientId, prescriberId, role) {
  let careTeam = await CareTeam.findOne({ where: { patient_id: patientId } });
  if (!careTeam) {
    careTeam = await CareTeam.create({ patient_id: patientId });
  }

  const existing = await CareTeamMember.findOne({
    where: { care_team_id: careTeam.care_team_id, prescriber_id: prescriberId },
  });
  if (existing) {
    return { alreadyMember: true, member: existing };
  }

  const member = await CareTeamMember.create({
    care_team_id: careTeam.care_team_id,
    prescriber_id: prescriberId,
    role: role || "Consultant",
  });

  return { alreadyMember: false, member };
}

async function removeMember(patientId, memberId) {
  const careTeam = await CareTeam.findOne({ where: { patient_id: patientId } });
  if (!careTeam) return null;

  const member = await CareTeamMember.findOne({
    where: { member_id: memberId, care_team_id: careTeam.care_team_id },
  });
  if (!member) return null;

  await member.destroy();
  return member;
}

module.exports = { findByPatientId, addMember, removeMember };