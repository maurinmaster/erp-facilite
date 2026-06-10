import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'erp_facilite',
  });
  
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave VARCHAR(50) PRIMARY KEY,
        valor VARCHAR(255) NOT NULL,
        descricao VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabela configuracoes criada.");

    await connection.query(`
      INSERT IGNORE INTO configuracoes (chave, valor, descricao) 
      VALUES ('dias_arquivamento_kanban', '15', 'Dias após a finalização para ocultar o projeto do Kanban')
    `);
    console.log("Configurações iniciais inseridas.");

    try {
      await connection.query('ALTER TABLE projetos_producao ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      console.log("Coluna updated_at adicionada em projetos_producao.");
    } catch(e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Coluna updated_at já existe em projetos_producao.");
      } else {
        throw e;
      }
    }

  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
    process.exit(0);
  }
}
run();
