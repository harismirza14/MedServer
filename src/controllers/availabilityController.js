const availabilityRepo = require("../repositories/availabilityRepository");
const appointmentRepo = require("../repositories/appointmentRepository");

const VALID_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_NAMES = VALID_DAYS;
const MIN_SLOT_MINUTES = 15;
const MAX_SLOT_MINUTES = 8 * 60; // 8 hours

function isSelfOrAdmin(req, prescriberId) {
  const { role, roleSpecificId } = req.user;
  if (role === "admin") return true;
  return role === "doctor" && String(roleSpecificId) === String(prescriberId);
}

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

async function getAvailability(req, res) {
  try {
    const { prescriberId } = req.params;
    if (!isSelfOrAdmin(req, prescriberId)) {
      return res.status(403).json({ error: "You can only view your own availability." });
    }
    const slots = await availabilityRepo.findByPrescriberId(prescriberId);
    res.json(slots);
  } catch (err) {
    console.error("Error in getAvailability:", err);
    res.status(500).json({ error: err.message });
  }
}

async function addAvailability(req, res) {
  try {
    const { prescriberId } = req.params;
    if (!isSelfOrAdmin(req, prescriberId)) {
      return res.status(403).json({ error: "You can only modify your own availability." });
    }

    const slots = Array.isArray(req.body) ? req.body : [req.body];

    for (const slot of slots) {
      const { day_of_week, start_time, end_time } = slot;
      if (!day_of_week || !start_time || !end_time) {
        return res.status(400).json({ error: "day_of_week, start_time, and end_time are required for every slot." });
      }
      const dayKey = day_of_week.toLowerCase();
      if (!VALID_DAYS.includes(dayKey)) {
        return res.status(400).json({ error: `Invalid day_of_week: ${day_of_week}` });
      }
      if (start_time >= end_time) {
        return res.status(400).json({ error: "start_time must be before end_time." });
      }

      const duration = toMinutes(end_time) - toMinutes(start_time);
      if (duration < MIN_SLOT_MINUTES) {
        return res.status(400).json({ error: `Slot must be at least ${MIN_SLOT_MINUTES} minutes long.` });
      }
      if (duration > MAX_SLOT_MINUTES) {
        return res.status(400).json({ error: `Slot cannot exceed ${MAX_SLOT_MINUTES / 60} hours.` });
      }
      if (duration % 15 !== 0) {
        return res.status(400).json({ error: "Slot duration must be in 15‑minute increments." });
      }

      const existingSlots = await availabilityRepo.findByPrescriberAndDay(prescriberId, dayKey);
      const newStart = toMinutes(start_time);
      const newEnd = toMinutes(end_time);

      for (const existing of existingSlots) {
        const exStart = toMinutes(existing.start_time);
        const exEnd = toMinutes(existing.end_time);

        if (newStart < exEnd && newEnd > exStart) {
          return res.status(400).json({
            error: `Overlaps with existing slot (${existing.start_time} – ${existing.end_time}).`,
          });
        }

        // if (newStart < exEnd + 30 && newStart > exStart) {
        //   return res.status(400).json({
        //     error: `Must have at least 30 minutes gap after ${existing.end_time}.`,
        //   });
        // }
        // if (newEnd > exStart - 30 && newEnd < exEnd) {
        //   return res.status(400).json({
        //     error: `Must have at least 30 minutes gap before ${existing.start_time}.`,
        //   });
        // }
      }
    }

    // ─── Save all valid slots ────────────────────────────────────
    const payload = slots.map((s) => ({
      prescriber_id: prescriberId,
      day_of_week: s.day_of_week.toLowerCase(),
      start_time: s.start_time,
      end_time: s.end_time,
    }));

    const created = payload.length === 1
      ? [await availabilityRepo.createSlot(payload[0])]
      : await availabilityRepo.createSlots(payload);

    res.status(201).json(created);
  } catch (err) {
    console.error("Error in addAvailability:", err);
    res.status(500).json({ error: err.message });
  }
}

async function deleteAvailability(req, res) {
  try {
    const { prescriberId, slotId } = req.params;
    if (!isSelfOrAdmin(req, prescriberId)) {
      return res.status(403).json({ error: "You can only modify your own availability." });
    }

    const slot = await availabilityRepo.findSlotById(slotId);
    if (!slot || String(slot.prescriber_id) !== String(prescriberId)) {
      return res.status(404).json({ error: "Availability slot not found." });
    }

    await availabilityRepo.deleteSlot(slotId);
    res.json({ message: "Availability slot deleted." });
  } catch (err) {
    console.error("Error in deleteAvailability:", err);
    res.status(500).json({ error: err.message });
  }
}

function subtractBookedIntervals(availableSlots, bookedAppointments) {
  const freeSlots = [];
  for (const slot of availableSlots) {
    let openIntervals = [{ start: slot.start_time, end: slot.end_time }];
    for (const appt of bookedAppointments) {
      const nextIntervals = [];
      for (const interval of openIntervals) {
        const overlaps = appt.start_time < interval.end && appt.end_time > interval.start;
        if (!overlaps) {
          nextIntervals.push(interval);
          continue;
        }
        if (appt.start_time > interval.start) {
          nextIntervals.push({ start: interval.start, end: appt.start_time });
        }
        if (appt.end_time < interval.end) {
          nextIntervals.push({ start: appt.end_time, end: interval.end });
        }
      }
      openIntervals = nextIntervals;
    }
    freeSlots.push(...openIntervals);
  }
  return freeSlots
    .filter((i) => i.start < i.end)
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .map((i) => ({ start_time: i.start, end_time: i.end }));
}

async function getFreeSlots(req, res) {
  try {
    const { prescriberId } = req.params;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "date query parameter (YYYY-MM-DD) is required." });
    }

    const dayIndex = new Date(`${date}T00:00:00`).getDay();
    const dayOfWeek = DAY_NAMES[dayIndex];

    const allSlots = await availabilityRepo.findByPrescriberId(prescriberId);
    const daySlots = allSlots.filter((s) => s.day_of_week === dayOfWeek);

    if (daySlots.length === 0) {
      return res.json([]);
    }

    const bookedAppointments = await appointmentRepo.findByPrescriberAndDate(prescriberId, date);
    const freeSlots = subtractBookedIntervals(daySlots, bookedAppointments);
    res.json(freeSlots);
  } catch (err) {
    console.error("Error in getFreeSlots:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAvailability, addAvailability, deleteAvailability, getFreeSlots };