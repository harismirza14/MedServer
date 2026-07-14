module.exports = (sequelize, DataTypes) => {
  const DoctorAvailability = sequelize.define(
    "DoctorAvailability",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      prescriber_id: { type: DataTypes.INTEGER, allowNull: false },
      day_of_week: { type: DataTypes.STRING(10), allowNull: false },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
    },
    { tableName: "doctor_availability", underscored: true },
  );

  DoctorAvailability.associate = (models) => {
    DoctorAvailability.belongsTo(models.Prescriber, { foreignKey: "prescriber_id" });
  };

  return DoctorAvailability;
};