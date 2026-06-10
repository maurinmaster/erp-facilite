const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '123', database: 'erp_facilite' }); // Or maybe 1234
  try {
    const [rows] = await pool.query('SELECT * FROM briefing_templates');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    try {
      const pool2 = mysql.createPool({ host: 'localhost', user: 'root', password: '1234', database: 'erp_facilite' });
      const [rows] = await pool2.query('SELECT * FROM briefing_templates');
      console.log(JSON.stringify(rows, null, 2));
    } catch (e2) {
      console.log(e2.message);
    }
  }
  process.exit(0);
}
run();
