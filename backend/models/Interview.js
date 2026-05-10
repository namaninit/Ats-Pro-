const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Interview', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  candidateId: { type: DataTypes.INTEGER, allowNull: false },
  jobId: { type: DataTypes.INTEGER, allowNull: false },
  interviewerId: { type: DataTypes.INTEGER, allowNull: true },
  scheduledAt: { type: DataTypes.DATE, allowNull: false },
  mode: { type: DataTypes.ENUM('in_person','video','phone'), defaultValue: 'video' },
  round: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: { type: DataTypes.ENUM('scheduled','completed','cancelled','no_show'), defaultValue: 'scheduled' },
  outcome: { type: DataTypes.ENUM('pass','fail','hold','pending'), defaultValue: 'pending' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  feedback: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'interviews', timestamps: true });