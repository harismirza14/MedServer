const appointmentRepo = require("../repositories/appointmentRepository");
const availabilityRepo = require("../repositories/availabilityRepository");
const patientRepo = require("../repositories/patientRepository");

const ALLOWED_DURATIONS_MIN = [15, 30, 45, 60];
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Confirms the requested [start_time, end_time) interval falls entirely inside
// at least one of the doctor's stated availability windows for that day —
// separate from (and in addition to) the existing overlap-with-other-appointments check.
async function isWithinAvailability(prescriberId, date, startTime, endTime) {
  const dayOfWeek = DAY_NAMES[new Date(`${date}T00:00:00`).getDay()];
  const allSlots = await availabilityRepo.findByPrescriberId(prescriberId);
  const daySlots = allSlots.filter((s) => s.day_of_week === dayOfWeek);

  const reqStart = toMinutes(startTime);
  const reqEnd = toMinutes(endTime);

  return daySlots.some((slot) => {
    const slotStart = toMinutes(slot.start_time);
    const slotEnd = toMinutes(slot.end_time);
    return reqStart >= slotStart && reqEnd <= slotEnd;
  });
}

async function createAppointment(req, res) {
  try {
    const { patient_id, prescriber_id, appointment_date, start_time, end_time } = req.body;
    const { role, roleSpecificId } = req.user;

    if (!patient_id || !prescriber_id || !appointment_date || !start_time || !end_time) {
      return res.status(400).json({ error: "patient_id, prescriber_id, appointment_date, start_time, and end_time are required." });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ error: "start_time must be before end_time." });
    }

    const duration = toMinutes(end_time) - toMinutes(start_time);
    if (!ALLOWED_DURATIONS_MIN.includes(duration)) {
      return res.status(400).json({
        error: `Appointment duration must be one of: ${ALLOWED_DURATIONS_MIN.join(", ")} minutes.`,
      });
    }

    if (role === "patient") {
      if (String(roleSpecificId) !== String(patient_id)) {
        return res.status(403).json({ error: "You can only book appointments for yourself." });
      }
    } else if (role !== "admin") {
      return res.status(403).json({ error: "Only patients can book appointments." });
    }

    const isConnected = await patientRepo.isPatientOfPrescriber(prescriber_id, patient_id);
    if (!isConnected) {
      return res.status(403).json({ error: "This doctor is not part of your care team." });
    }

    const withinAvailability = await isWithinAvailability(prescriber_id, appointment_date, start_time, end_time);
    if (!withinAvailability) {
      return res.status(409).json({ error: "This time is outside the doctor's available hours." });
    }

    const conflict = await appointmentRepo.findOverlapping(prescriber_id, appointment_date, start_time, end_time);
    if (conflict) {
      return res.status(409).json({ error: "This time slot is no longer available." });
    }

    const appointment = await appointmentRepo.create({
      patient_id,
      prescriber_id,
      appointment_date,
      start_time,
      end_time,
      status: "scheduled",
    });

    res.status(201).json(appointment);
  } catch (err) {
    console.error("Error in createAppointment:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getPatientAppointments(req, res) {
  try {
    const { patientId } = req.params;
    const { role, roleSpecificId } = req.user;

    if (role === "patient" && String(roleSpecificId) !== String(patientId)) {
      return res.status(403).json({ error: "You can only view your own appointments." });
    }

    const appointments = await appointmentRepo.findByPatientId(patientId);
    res.json(appointments);
  } catch (err) {
    console.error("Error in getPatientAppointments:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getPrescriberAppointments(req, res) {
  try {
    const { prescriberId } = req.params;
    const { role, roleSpecificId } = req.user;

    if (role === "doctor" && String(roleSpecificId) !== String(prescriberId)) {
      return res.status(403).json({ error: "You can only view your own appointments." });
    }

    const appointments = await appointmentRepo.findByPrescriberId(prescriberId);
    res.json(appointments);
  } catch (err) {
    console.error("Error in getPrescriberAppointments:", err);
    res.status(500).json({ error: err.message });
  }
}

async function cancelAppointment(req, res) {
  try {
    const { appointmentId } = req.params;
    const { role, roleSpecificId } = req.user;

    const appointment = await appointmentRepo.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found." });
    }

    const isOwningPatient = role === "patient" && String(roleSpecificId) === String(appointment.patient_id);
    const isOwningDoctor = role === "doctor" && String(roleSpecificId) === String(appointment.prescriber_id);

    if (!isOwningPatient && !isOwningDoctor && role !== "admin") {
      return res.status(403).json({ error: "You are not authorized to cancel this appointment." });
    }

    const cancelled = await appointmentRepo.cancel(appointmentId);
    res.json(cancelled);
  } catch (err) {
    console.error("Error in cancelAppointment:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createAppointment, getPatientAppointments, getPrescriberAppointments, cancelAppointment };