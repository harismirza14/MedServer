module.exports = (sequelize, DataTypes) => {
  const PdmpCheck = sequelize.define('PdmpCheck', {
    check_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    last_checked: DataTypes.DATE,
    summary: DataTypes.TEXT
  }, { tableName: 'pdmp_checks', timestamps: false });

  PdmpCheck.associate = (models) => {
    PdmpCheck.belongsTo(models.Patient, { foreignKey: 'patient_id' });
  };
  return PdmpCheck;
};