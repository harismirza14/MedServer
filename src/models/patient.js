module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define(
    "Patient",
    {
      patient_id: { type: DataTypes.STRING(20), primaryKey: true },
      name: DataTypes.STRING,
      dob: DataTypes.DATEONLY,
      address: DataTypes.TEXT,
      visit_frequency: DataTypes.STRING,
      next_appointment: DataTypes.DATE,
      insurance: DataTypes.STRING,
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    { tableName: "patients", timestamps: false },
  );

  Patient.associate = (models) => {
    Patient.hasMany(models.Prescription, { foreignKey: "patient_id" });
    Patient.hasMany(models.PdmpCheck, { foreignKey: "patient_id" });
  };
  return Patient;
};
