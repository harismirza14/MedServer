module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      phone_number: { type: DataTypes.STRING(20), allowNull: true },
      role: { type: DataTypes.ENUM("patient", "doctor", "admin"), allowNull: false },
      dob: DataTypes.DATEONLY,
      address: DataTypes.TEXT,
      gender: DataTypes.STRING(10),
      patient_id: { type: DataTypes.STRING(20), allowNull: true }, 
      prescriber_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "users", timestamps: false },
  );

  User.associate = (models) => {
    User.hasOne(models.Patient, { foreignKey: "user_id" });
    User.hasOne(models.Prescriber, { foreignKey: "user_id" });
  };
  return User;
};
