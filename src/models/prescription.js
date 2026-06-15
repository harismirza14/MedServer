module.exports = (sequelize, DataTypes) => {
  const Prescription = sequelize.define(
    "Prescription",
    {
      prescription_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      med_id: DataTypes.INTEGER,
      patient_id: DataTypes.STRING(20),
      prescriber_id: DataTypes.INTEGER,
      pharmacy_id: DataTypes.INTEGER,
      dosage: DataTypes.STRING(50),
      form: DataTypes.STRING(50),
      instructions: DataTypes.TEXT,
      status: DataTypes.STRING(20),
      status_label: DataTypes.TEXT,
      patient_note: DataTypes.TEXT,
      discontinued_on: DataTypes.DATEONLY,
      discontinue_reason: DataTypes.TEXT,
      external_prescriber: DataTypes.STRING(255), 
    },
    {
      tableName: "prescriptions",
      timestamps: false,
      indexes: [
        { fields: ["prescriber_id"] }, 
        { fields: ["patient_id"] }
      ],
    }
  );

  Prescription.associate = (models) => {
    Prescription.belongsTo(models.Patient, { foreignKey: "patient_id" });
    Prescription.belongsTo(models.Medication, { foreignKey: "med_id" });
    Prescription.belongsTo(models.Prescriber, { foreignKey: "prescriber_id" });
    Prescription.belongsTo(models.Pharmacy, { foreignKey: "pharmacy_id" });
  };

  return Prescription;
};