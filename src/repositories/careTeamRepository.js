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

module.exports = { findByPatientId };