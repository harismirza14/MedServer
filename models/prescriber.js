module.exports = (sequelize, DataTypes) => {
  const Prescriber = sequelize.define(
    "Prescriber",
    {
      prescriber_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      role: DataTypes.STRING,
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    { tableName: "prescribers", timestamps: false },
  );

  Prescriber.associate = (models) => {
    Prescriber.hasMany(models.Prescription, { foreignKey: "prescriber_id" });
  };
  return Prescriber;
};
