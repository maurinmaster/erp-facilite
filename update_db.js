const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const connection = await mysql.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: '',
    database: 'erp_facilite_v2',
    multipleStatements: true 
  });
  
  const file = 'scripts/upgrade_prazo_interno.sql';
  console.log(`Executing ${file}...`);
  const fullPath = path.join(__dirname, file);
  const sql = fs.readFileSync(fullPath, 'utf8');
  await connection.query(sql);
  console.log('Done.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
