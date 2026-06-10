const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  const [rows] = await c.query('SHOW TABLES');
  console.log(rows);
  process.exit();
}
run();
