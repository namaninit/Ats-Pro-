const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Company', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  plan: { type: DataTypes.ENUM('free', 'starter', 'pro'), defaultValue: 'free' },
  maxJobs: { type: DataTypes.INTEGER, defaultValue: 3 },
  maxCandidates: { type: DataTypes.INTEGER, defaultValue: 25 },
  maxUsers: { type: DataTypes.INTEGER, defaultValue: 2 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  approvalStatus: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'approved' },
  stripeCustomerId: { type: DataTypes.STRING, allowNull: true },
  stripeSubscriptionId: { type: DataTypes.STRING, allowNull: true },
  planExpiresAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'companies', timestamps: true });