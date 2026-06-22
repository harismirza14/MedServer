module.exports = (sequelize, DataTypes) => {
  const CareTeam = sequelize.define(
    "CareTeam",
    {
      care_team_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      patient_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      }, 
      next_appointment: { type: DataTypes.DATE, allowNull: true },
      visit_frequency: { type: DataTypes.STRING(50), allowNull: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { tableName: "care_teams", timestamps: false },
  );

  CareTeam.associate = (models) => {
    CareTeam.belongsTo(models.Patient, { foreignKey: "patient_id" });
    CareTeam.hasMany(models.CareTeamMember, { foreignKey: "care_team_id" });
  };

  return CareTeam;
};
