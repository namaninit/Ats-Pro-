const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  companyName: { type: DataTypes.STRING(150), allowNull: false },
  industry: { type: DataTypes.STRING(100), allowNull: true },
  website: { type: DataTypes.STRING(255), allowNull: true },
  contactPerson: { type: DataTypes.STRING(100), allowNull: true },
  contactEmail: { type: DataTypes.STRING(150), allowNull: true },
  contactPhone: { type: DataTypes.STRING(20), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'clients', timestamps: true });