module.exports = (sequelize, DataTypes) => {
  const Prescriber = sequelize.define(
    "Prescriber",
    {
      prescriber_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      specialty: DataTypes.STRING(100),
      pmdc_number: DataTypes.STRING(50),
      education: DataTypes.TEXT,
    },
    { tableName: "prescribers", timestamps: false },
  );

  Prescriber.associate = (models) => {
    Prescriber.belongsTo(models.User, { foreignKey: "user_id" });
    Prescriber.hasMany(models.Patient, { foreignKey: "prescriber_id" });
    Prescriber.hasMany(models.Prescription, { foreignKey: "prescriber_id" });
    Prescriber.hasMany(models.CareTeamMember, { foreignKey: "prescriber_id" });
  };

  return Prescriber;
};