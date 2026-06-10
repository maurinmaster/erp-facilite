const mysql = require('mysql2/promise');

async function killSleeping() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'erp_facilite',
    });

    const [rows] = await connection.query('SHOW PROCESSLIST');
    let killed = 0;
    for (const row of rows) {
      if (row.Command === 'Sleep' && row.Time > 10) {
        try {
          await connection.query(`KILL ${row.Id}`);
          killed++;
        } catch(e) {}
      }
    }
    console.log(`Forced ${killed} sleeping connections to close.`);
    await connection.end();
    process.exit(0);
  } catch(e) {
    console.error("Could not connect to clean connections:", e.message);
    process.exit(1);
  }
}
killSleeping();
