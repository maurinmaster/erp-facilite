const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'erp_facilite'
  });

  try {
    const [rows] = await connection.query('DESCRIBE perfis');
    console.log('Perfis Table:');
    console.log(rows);
  } catch (e) {
    console.log('Perfis table does not exist.');
  }
  
  await connection.end();
}

run();
