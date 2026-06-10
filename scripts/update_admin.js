const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  await c.query("UPDATE usuarios SET perfil = 'Admin'");
  console.log('Update OK');
  process.exit();
}
run();
