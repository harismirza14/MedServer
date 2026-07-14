const { DoctorAvailability } = require("../models");

async function findByPrescriberId(prescriberId) {
  return await DoctorAvailability.findAll({
    where: { prescriber_id: prescriberId },
    order: [["day_of_week", "ASC"], ["start_time", "ASC"]],
  });
}

async function findByPrescriberAndDay(prescriberId, dayOfWeek) {
  return await DoctorAvailability.findAll({
    where: {
      prescriber_id: prescriberId,
      day_of_week: dayOfWeek,
    },
    order: [["start_time", "ASC"]],
  });
}

async function createSlot(data) {
  return await DoctorAvailability.create(data);
}

async function createSlots(slotsArray) {
  return await DoctorAvailability.bulkCreate(slotsArray);
}

async function findSlotById(slotId) {
  return await DoctorAvailability.findByPk(slotId);
}

async function deleteSlot(slotId) {
  return await DoctorAvailability.destroy({ where: { id: slotId } });
}

module.exports = {
  findByPrescriberId,
  findByPrescriberAndDay, 
  createSlot,
  createSlots,
  findSlotById,
  deleteSlot,
};