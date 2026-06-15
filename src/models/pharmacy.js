module.exports = (sequelize, DataTypes) => {
  const Pharmacy = sequelize.define('Pharmacy', {
    pharmacy_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    address: DataTypes.TEXT,
    zipcode: DataTypes.STRING(10),
    phone: DataTypes.STRING(20),
    hours: DataTypes.STRING(100)
  }, { tableName: 'pharmacies', timestamps: false });
  
  Pharmacy.associate = (models) => {
    Pharmacy.hasMany(models.Prescription, { foreignKey: 'pharmacy_id' });
  };
  return Pharmacy;
};