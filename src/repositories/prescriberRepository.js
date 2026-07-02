const { Prescriber, User } = require("../models");
const { Op } = require("sequelize");

async function findById(prescriberId) {
  return await Prescriber.findByPk(prescriberId, {
    include: [{ model: User, attributes: { exclude: ["password_hash"] } }],
  });
}

async function findAllPaginated(filters = {}) {
  const { search = "", gender = "", page = 1, limit = 10 } = filters;

  const userWhere = { role: "doctor" };

  if (gender && gender !== "all") {
    userWhere.gender = { [Op.iLike]: gender }; // no wildcards = case-insensitive exact match
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    userWhere[Op.or] = [
      { name: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
    ];
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await Prescriber.findAndCountAll({
    include: [
      {
        model: User,
        attributes: { exclude: ["password_hash"] },
        where: userWhere,
      },
    ],
    attributes: ["prescriber_id", "specialty", "pmdc_number", "education"],
    limit: Number(limit),
    offset,
    order: [["prescriber_id", "ASC"]],
  });

  const data = rows.map((p) => {
    const { User, ...prescriberData } = p.toJSON();
    return { ...User, ...prescriberData };
  });

  return {
    data,
    total: count,
    page: Number(page),
    totalPages: Math.max(1, Math.ceil(count / Number(limit))),
  };
}


async function createPrescriber(data, options = {}) {
  return await Prescriber.create(data, options);
}

async function updatePrescriber(id, updates) {
  return await Prescriber.update(updates, { where: { prescriber_id: id } });
}

async function findByUserId(userId) {
  return await Prescriber.findOne({ where: { user_id: userId } });
}

module.exports = {
  findById,
  findByUserId,
  findAllPaginated,
  createPrescriber,
  updatePrescriber,

};