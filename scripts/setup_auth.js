const mysql = require('mysql2/promise');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function setupAuth() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  console.log('Criando tabela de usuarios...');
  
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      perfil VARCHAR(50) NOT NULL DEFAULT 'Operador', -- 'Gestor' ou 'Operador'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Verificando se usuário mestre existe...');
  const [rows] = await connection.execute("SELECT id FROM usuarios WHERE email = 'admin@facilite.com'");
  
  if (rows.length === 0) {
    console.log('Criando usuário Mestre (admin@facilite.com / senha123)...');
    const hashed = hashPassword('senha123');
    await connection.execute(
      "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)",
      ['Administrador', 'admin@facilite.com', hashed, 'Gestor']
    );
    console.log('Usuário mestre criado com sucesso!');
  } else {
    console.log('Usuário mestre já existe.');
  }

  await connection.end();
}

setupAuth().catch(console.error);
