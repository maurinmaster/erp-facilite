const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'erp_facilite',
    multipleStatements: true
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS perfis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(50) NOT NULL UNIQUE,
      permissoes JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT IGNORE INTO perfis (nome, permissoes) VALUES 
    ('Admin', '{"dashboard":"full","clientes":"full","catalogo":"full","producao":"full","equipe":"full","configuracoes":"full"}'),
    ('Gestor', '{"dashboard":"full","clientes":"full","catalogo":"read","producao":"full","equipe":"full","configuracoes":"none"}'),
    ('Operador', '{"dashboard":"none","clientes":"read","catalogo":"none","producao":"limited","equipe":"none","configuracoes":"none"}');
  `;

  try {
    await connection.query(sql);
    console.log('Tabela de perfis criada e semeada com sucesso.');
  } catch(e) {
    console.error('Erro ao executar sql:', e);
  }
  
  await connection.end();
}

run();
