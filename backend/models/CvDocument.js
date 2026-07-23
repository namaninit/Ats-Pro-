const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('CvDocument', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  fullName: { type: DataTypes.STRING(100), allowNull: false },
  targetJob: { type: DataTypes.STRING(150), allowNull: false },
  templateId: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'modern' },
  // Full generated + edited CV content (summary, skills, experience, education, etc)
  data: { type: DataTypes.JSON, allowNull: false },
}, { tableName: 'cv_documents', timestamps: true });