const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Job', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(150), allowNull: false },
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  requiredSkills: { type: DataTypes.TEXT, allowNull: true,
    get() { const v = this.getDataValue('requiredSkills'); try { return v ? JSON.parse(v) : []; } catch { return []; } },
    set(v) { this.setDataValue('requiredSkills', JSON.stringify(Array.isArray(v) ? v : [])); }
  },
  minExperience: { type: DataTypes.DECIMAL(4,1), defaultValue: 0 },
  maxExperience: { type: DataTypes.DECIMAL(4,1), allowNull: true },
  minSalary: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  maxSalary: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  location: { type: DataTypes.STRING(100), allowNull: true },
  jobType: { type: DataTypes.ENUM('full_time','part_time','contract','remote'), defaultValue: 'full_time' },
  status: { type: DataTypes.ENUM('open','closed','on_hold','filled'), defaultValue: 'open' },
  openings: { type: DataTypes.INTEGER, defaultValue: 1 },
  deadline: { type: DataTypes.DATEONLY, allowNull: true }
}, { tableName: 'jobs', timestamps: true });