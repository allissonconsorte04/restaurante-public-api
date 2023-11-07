const { Pool } = require('pg');
require('dotenv').config()

const pool = new Pool({
  user: 'allisson',
  host: process.env.HOST,
  database: 'restaurante_api',
  password: '159753',
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
