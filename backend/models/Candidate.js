const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Candidate', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  skills: { type: DataTypes.TEXT, allowNull: true,
    get() { const v = this.getDataValue('skills'); try { return v ? JSON.parse(v) : []; } catch { return []; } },
    set(v) { this.setDataValue('skills', JSON.stringify(Array.isArray(v) ? v : [])); }
  },
  experience: { type: DataTypes.DECIMAL(4,1), defaultValue: 0 },
  currentCTC: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  expectedCTC: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  noticePeriod: { type: DataTypes.INTEGER, allowNull: true },
  currentLocation: { type: DataTypes.STRING(100), allowNull: true },
  resumePath: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.ENUM('new','screening','interview','offered','hired','rejected'), defaultValue: 'new' },
  jobId: { type: DataTypes.INTEGER, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  source: { type: DataTypes.STRING(100), allowNull: true }
}, { tableName: 'candidates', timestamps: true });