const mysql = require('mysql2/promise');

async function upgrade() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'erp_facilite',
    port: 3306
  });

  try {
    console.log('Iniciando upgrade para Grupos de Chat...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS grupos_chat (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        criado_por INT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabela grupos_chat criada.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS grupos_membros (
        grupo_id INT NOT NULL,
        usuario_id INT NOT NULL,
        entrou_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (grupo_id, usuario_id),
        FOREIGN KEY (grupo_id) REFERENCES grupos_chat(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabela grupos_membros criada.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS mensagens_grupo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grupo_id INT NOT NULL,
        remetente_id INT NOT NULL,
        conteudo TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (grupo_id) REFERENCES grupos_chat(id) ON DELETE CASCADE,
        FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabela mensagens_grupo criada.');

    // Tabela de rastreio de leitura por membro do grupo (opcional mas bom p/ unread)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leituras_grupo (
        grupo_id INT NOT NULL,
        usuario_id INT NOT NULL,
        ultima_leitura TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (grupo_id, usuario_id),
        FOREIGN KEY (grupo_id) REFERENCES grupos_chat(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabela leituras_grupo criada.');

    console.log('Upgrade de Grupos finalizado com sucesso!');
  } catch (error) {
    console.error('Erro no upgrade:', error);
  } finally {
    await connection.end();
  }
}

upgrade();
