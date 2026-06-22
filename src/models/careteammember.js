module.exports = (sequelize, DataTypes) => {
  const CareTeamMember = sequelize.define(
    "CareTeamMember",
    {
      member_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      care_team_id: { type: DataTypes.INTEGER, allowNull: false },
      prescriber_id: { type: DataTypes.INTEGER, allowNull: false }, // Link to doctor/provider
      role: { type: DataTypes.STRING(50) }, // e.g., 'Primary Physician', 'Nurse'
    },
    { tableName: "care_team_members", timestamps: false },
  );

  CareTeamMember.associate = (models) => {
    CareTeamMember.belongsTo(models.CareTeam, { foreignKey: "care_team_id" });
    CareTeamMember.belongsTo(models.Prescriber, {
      foreignKey: "prescriber_id",
    });
  };

  return CareTeamMember;
};
