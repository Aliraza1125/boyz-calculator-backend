const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  connectionLimit: 10, // Adjust as needed
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// Promisify for Node.js async/await.
const promisePool = pool.promise();

module.exports = {
  query: (text, params) => promisePool.query(text, params),
};
