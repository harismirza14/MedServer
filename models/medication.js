module.exports = (sequelize, DataTypes) => {
  const Medication = sequelize.define('Medication', {
    med_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true }
  }, { tableName: 'medications', timestamps: false });
  
  Medication.associate = (models) => {
    Medication.hasMany(models.Prescription, { foreignKey: 'med_id' });
  };
  return Medication;
};