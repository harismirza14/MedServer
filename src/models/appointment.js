module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define(
    "Appointment",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      patient_id: { type: DataTypes.STRING(20), allowNull: false },
      prescriber_id: { type: DataTypes.INTEGER, allowNull: false },
      appointment_date: { type: DataTypes.DATEONLY, allowNull: false },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
      status: {
        type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "scheduled",
      },
    },
    { tableName: "appointments", underscored: true },
  );

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.Patient, { foreignKey: "patient_id" });
    Appointment.belongsTo(models.Prescriber, { foreignKey: "prescriber_id" });
  };

  return Appointment;
};