const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  // role: { type: DataTypes.ENUM('super_admin', 'recruiter', 'client'), defaultValue: 'recruiter' },
  role: { type: DataTypes.ENUM('master_admin', 'super_admin', 'recruiter', 'client'), defaultValue: 'recruiter' },
  companyId: { type: DataTypes.INTEGER, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  avatar: { type: DataTypes.STRING(255), allowNull: true },
  resetToken: { type: DataTypes.STRING(255), allowNull: true },
resetTokenExpiry: { type: DataTypes.DATE, allowNull: true },
permissions: {
  type: DataTypes.JSON,
  allowNull: true,
  defaultValue: {
    canDelete: false,
    canEdit: true,
    canGmailImport: false,
    canBulkUpload: true,
    canViewCTC: true,
    canScheduleInterview: true,
    canViewClients: false,
  }
},
}, { tableName: 'users', timestamps: true });