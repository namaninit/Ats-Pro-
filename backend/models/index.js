const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ats_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  }
);

const Company  = require('./Company')(sequelize);
const User     = require('./User')(sequelize);
const Candidate= require('./Candidate')(sequelize);
const Client   = require('./Client')(sequelize);
const Job      = require('./Job')(sequelize);
const Interview= require('./Interview')(sequelize);
const GmailToken = require('./GmailToken')(sequelize);
const JobTemplate = require('./JobTemplate')(sequelize);


// Company associations
Company.hasMany(User,      { foreignKey: 'companyId', as: 'users' });
Company.hasMany(Candidate, { foreignKey: 'companyId', as: 'candidates' });
Company.hasMany(Client,    { foreignKey: 'companyId', as: 'clients' });
Company.hasMany(Job,       { foreignKey: 'companyId', as: 'jobs' });
Company.hasMany(Interview, { foreignKey: 'companyId', as: 'interviews' });

User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Candidate.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Client.belongsTo(Company,    { foreignKey: 'companyId', as: 'company' });
Job.belongsTo(Company,       { foreignKey: 'companyId', as: 'company' });
Interview.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Existing associations
Client.hasMany(Job,       { foreignKey: 'clientId', as: 'jobs' });
Job.belongsTo(Client,     { foreignKey: 'clientId', as: 'client' });
Job.hasMany(Candidate,    { foreignKey: 'jobId',    as: 'candidates' });
Candidate.belongsTo(Job,  { foreignKey: 'jobId',    as: 'job' });
Candidate.hasMany(Interview, { foreignKey: 'candidateId', as: 'interviews' });
Interview.belongsTo(Candidate, { foreignKey: 'candidateId', as: 'candidate' });
Job.hasMany(Interview,    { foreignKey: 'jobId', as: 'interviews' });
Interview.belongsTo(Job,  { foreignKey: 'jobId', as: 'job' });
User.hasMany(Interview,   { foreignKey: 'interviewerId', as: 'interviews' });
Interview.belongsTo(User, { foreignKey: 'interviewerId', as: 'interviewer' });


// Association
Company.hasMany(GmailToken, { foreignKey: 'companyId', as: 'gmailTokens' });
GmailToken.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(JobTemplate, { foreignKey: 'companyId', as: 'jobTemplates' });
JobTemplate.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
User.hasMany(GmailToken, { foreignKey: 'userId', as: 'gmailTokens' });
GmailToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { sequelize, Company, User, Candidate, Client, Job, Interview , GmailToken, JobTemplate};