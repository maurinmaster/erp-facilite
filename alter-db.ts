import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  try {
    await connection.query('ALTER TABLE usuarios ADD COLUMN foto_url VARCHAR(255) DEFAULT NULL;');
    console.log("Column added successfully!");
  } catch(e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error(e);
    }
  }
  await connection.end();
  process.exit(0);
}
run();
