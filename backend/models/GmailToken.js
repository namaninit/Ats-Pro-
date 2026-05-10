const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('GmailToken', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false },
  accessToken: { type: DataTypes.TEXT, allowNull: false },
  refreshToken: { type: DataTypes.TEXT, allowNull: true },
  expiryDate: { type: DataTypes.BIGINT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastSyncAt: { type: DataTypes.DATE, allowNull: true },
  totalImported: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'gmail_tokens', timestamps: true });