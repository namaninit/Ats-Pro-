require('dotenv').config();
const { sequelize } = require('./models');

async function check() {
  const [results] = await sequelize.query(
    "SHOW COLUMNS FROM interviews WHERE Field = 'mode'"
  );
  console.log(JSON.stringify(results, null, 2));
  process.exit();
}

check().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});