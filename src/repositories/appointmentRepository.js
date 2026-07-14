const { Appointment, Patient, User, Prescriber } = require("../models");
const { Op } = require("sequelize");

async function create(data) {
  return await Appointment.create(data);
}

async function findByPatientId(patientId) {
  const appointments = await Appointment.findAll({
    where: { patient_id: patientId },
    include: [
      {
        model: Patient,
        include: [
          {
            model: User,
            attributes: { exclude: ["password_hash"] },
          },
        ],
      },
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
    order: [["appointment_date", "DESC"], ["start_time", "DESC"]],
  });

  return appointments.map((appt) => {
    const plain = appt.toJSON();
    return {
      id: plain.id,
      patient_id: plain.patient_id,
      prescriber_id: plain.prescriber_id,
      appointment_date: plain.appointment_date,
      start_time: plain.start_time,
      end_time: plain.end_time,
      status: plain.status,
      created_at: plain.created_at,
      updated_at: plain.updated_at,
      doctor_name: plain.Prescriber?.User?.name || plain.prescriber_id,
    };
  });
}

async function findByPrescriberId(prescriberId) {
  const appointments = await Appointment.findAll({
    where: { prescriber_id: prescriberId },
    include: [
      {
        model: Patient,
        include: [
          {
            model: User,
            attributes: { exclude: ["password_hash"] },
          },
        ],
      },
    ],
    order: [["appointment_date", "DESC"], ["start_time", "DESC"]],
  });

  return appointments.map((appt) => {
    const plain = appt.toJSON();
    return {
      id: plain.id,
      patient_id: plain.patient_id,
      prescriber_id: plain.prescriber_id,
      appointment_date: plain.appointment_date,
      start_time: plain.start_time,
      end_time: plain.end_time,
      status: plain.status,
      created_at: plain.created_at,
      updated_at: plain.updated_at,
      patient_name: plain.Patient?.User?.name || plain.patient_id,
    };
  });
}

async function findByPrescriberAndDate(prescriberId, date) {
  return await Appointment.findAll({
    where: {
      prescriber_id: prescriberId,
      appointment_date: date,
      status: { [Op.ne]: "cancelled" },
    },
    order: [["start_time", "ASC"]],
  });
}

async function findById(appointmentId) {
  return await Appointment.findByPk(appointmentId);
}

async function findOverlapping(prescriberId, date, startTime, endTime) {
  return await Appointment.findOne({
    where: {
      prescriber_id: prescriberId,
      appointment_date: date,
      status: { [Op.ne]: "cancelled" },
      start_time: { [Op.lt]: endTime },
      end_time: { [Op.gt]: startTime },
    },
  });
}

async function cancel(appointmentId) {
  const appt = await Appointment.findByPk(appointmentId);
  if (!appt) return null;
  await appt.update({ status: "cancelled" });
  return appt;
}

module.exports = {
  create,
  findByPatientId,
  findByPrescriberId,
  findByPrescriberAndDate,
  findById,
  findOverlapping,
  cancel,
};