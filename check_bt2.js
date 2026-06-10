const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'erp_facilite_v2' });
  try {
    const [rows] = await pool.query('SELECT * FROM briefing_templates');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.log(e.message);
  }
  process.exit(0);
}
run();
