const mysql = require('mysql2/promise');

async function upgrade() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'erp_facilite'
  });

  try {
    console.log('Creating notificacoes table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL, 
        remetente_id INT NULL,   
        tipo VARCHAR(50) NOT NULL, 
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT,
        link VARCHAR(255),
        lida TINYINT(1) DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);

    console.log('Creating mensagens_equipe table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mensagens_equipe (
        id INT AUTO_INCREMENT PRIMARY KEY,
        remetente_id INT NOT NULL,
        destinatario_id INT NOT NULL,
        conteudo TEXT NOT NULL,
        lida TINYINT(1) DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log('Database upgrade completed successfully!');
  } catch (error) {
    console.error('Error upgrading database:', error);
  } finally {
    await pool.end();
  }
}

upgrade();
