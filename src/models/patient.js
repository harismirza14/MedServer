module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define(
    "Patient",
    {
      patient_id: { type: DataTypes.STRING(20), primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      insurance: DataTypes.STRING,
      zipcode: DataTypes.STRING(10),
    },
    { tableName: "patients", timestamps: false },
  );

  Patient.associate = (models) => {
    Patient.belongsTo(models.User, { foreignKey: "user_id" });
    Patient.belongsTo(models.Prescriber, { foreignKey: "prescriber_id" });
    Patient.hasMany(models.Prescription, { foreignKey: "patient_id" });
    Patient.hasOne(models.CareTeam, { foreignKey: "patient_id" });
    Patient.hasMany(models.Appointment, { foreignKey: "patient_id" });
  };

  return Patient;
};
