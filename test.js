// Test script
const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'erp_facilite' });
  
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log(`Checking ${tables.length} tables...`);
    for (const t of tables) {
      const tableName = Object.values(t)[0];
      try {
        await pool.query(`SELECT 1 FROM ${tableName} LIMIT 1`);
        console.log(`[OK] ${tableName}`);
      } catch (err) {
        console.log(`[ERROR] ${tableName}: ${err.message}`);
      }
    }
  } catch(e) {
    console.error('ERROR:', e);
  }

  process.exit(0);
}
run();
