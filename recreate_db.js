const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function run() {
  console.log('Connecting to MySQL...');
  const connection = await mysql.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: '',
    multipleStatements: true 
  });
  
  try {
    console.log('Creating erp_facilite_v2...');
    await connection.query('DROP DATABASE IF EXISTS erp_facilite_v2;');
    await connection.query('CREATE DATABASE erp_facilite_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await connection.query('USE erp_facilite_v2;');

    // 1. Create usuarios first!
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        perfil VARCHAR(50) NOT NULL DEFAULT 'Operador',
        telefone VARCHAR(50) NULL,
        foto_url VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const files = [
      'database.sql',
      'scripts/modulo_producao.sql',
      'scripts/upgrade_catalogo_soft_delete.sql',
      'scripts/upgrade_checklist.sql',
      'scripts/upgrade_comentarios.sql',
      'scripts/upgrade_kanban.sql',
      'scripts/upgrade_prazo_interno.sql',
      'scripts/upgrade_logs_clientes.sql',
      'scripts/upgrade_logs_producao.sql',
      'scripts/upgrade_metricas_equipe.sql',
      'scripts/upgrade_soft_delete.sql'
    ];

    for (const file of files) {
      console.log(`Executing ${file}...`);
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        const sql = fs.readFileSync(fullPath, 'utf8');
        if (sql.trim()) {
          try {
             await connection.query(sql);
          } catch (err) {
             console.error(`Error in ${file}: ${err.message}`);
          }
        }
      } else {
        console.warn(`[WARN] File not found: ${file}`);
      }
    }

    // Now execute the script from test.js (correio tables)
    console.log('Creating correio tables...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS correio_mensagens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        remetente_id INT NOT NULL,
        assunto VARCHAR(255) NOT NULL,
        corpo TEXT NOT NULL,
        is_popup BOOLEAN DEFAULT FALSE,
        parent_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        FOREIGN KEY (remetente_id) REFERENCES usuarios(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS correio_destinatarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mensagem_id INT NOT NULL,
        usuario_id INT NOT NULL,
        tipo ENUM('To', 'Cc') DEFAULT 'To',
        lida BOOLEAN DEFAULT FALSE,
        lida_em DATETIME NULL,
        popup_visto BOOLEAN DEFAULT FALSE,
        deleted_at DATETIME NULL,
        FOREIGN KEY (mensagem_id) REFERENCES correio_mensagens(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS mensagens_equipe (
        id INT AUTO_INCREMENT PRIMARY KEY,
        remetente_id INT NOT NULL,
        destinatario_id INT NOT NULL,
        conteudo TEXT NOT NULL,
        lida TINYINT(1) DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS grupos_chat (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        criado_por INT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS comentarios_producao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projeto_id INT NOT NULL,
        usuario_id INT NOT NULL,
        comentario TEXT NOT NULL,
        anexo_url VARCHAR(255) NULL,
        anexo_nome VARCHAR(255) NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (projeto_id) REFERENCES projetos_producao(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating briefing tables...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS briefing_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        campos JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL
      ) ENGINE=InnoDB;
    `);

    try {
      await connection.query(`
        ALTER TABLE servicos_catalogo 
        ADD COLUMN IF NOT EXISTS briefing_template_id INT NULL,
        ADD CONSTRAINT fk_servicos_briefing_template FOREIGN KEY (briefing_template_id) REFERENCES briefing_templates(id) ON DELETE SET NULL
      `);
    } catch (err) {
      // Ignore if constraint exists
    }

    try {
      await connection.query('ALTER TABLE projetos_producao ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    } catch (err) {}

    console.log('Seeding data...');

    // Perfis
    await connection.query(`
      CREATE TABLE IF NOT EXISTS perfis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(50) NOT NULL UNIQUE,
        permissoes JSON NULL
      ) ENGINE=InnoDB;
    `);
    
    await connection.query(`INSERT IGNORE INTO perfis (nome, permissoes) VALUES 
      ('Admin', '{"all": true}'),
      ('Gestor', '{"gerir_equipe": true}'),
      ('Colaborador', '{"ler": true}')
    `);

    // Configuracoes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave VARCHAR(100) PRIMARY KEY,
        valor TEXT
      ) ENGINE=InnoDB;
    `);
    await connection.query('INSERT IGNORE INTO configuracoes (chave, valor) VALUES ("correio_popup_roles", "Admin,Gestor")');

    // Usuarios
    const adminHash = hashPassword('123456');
    await connection.query(`INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES 
      ('Administrador', 'admin@erpfacilite.com', '${adminHash}', 'Admin'),
      ('Amanda Lopes', 'amanda@erpfacilite.com', '${adminHash}', 'Colaborador'),
      ('Bia', 'bia@erpfacilite.com', '${adminHash}', 'Colaborador'),
      ('Adriana', 'adriana@erpfacilite.com', '${adminHash}', 'Gestor')
    `);

    // Clientes
    await connection.query(`
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Ativo';
    `);

    await connection.query(`INSERT INTO clientes (nome, cnpj_cpf, email, telefone, status) VALUES 
      ('Tech Solutions', '11.111.111/0001-11', 'contato@tech.com', '11999999999', 'Ativo'),
      ('Padaria Pão de Mel', '22.222.222/0001-22', 'contato@padaria.com', '11888888888', 'Ativo'),
      ('Clínica Sorriso', '33.333.333/0001-33', 'contato@clinica.com', '11777777777', 'Ativo')
    `);

    // Servicos
    await connection.query(`INSERT INTO servicos_catalogo (nome, descricao, tipo) VALUES 
      ('Gestão de Redes Sociais', 'Posts semanais no Instagram e Facebook', 'Recorrente'),
      ('Identidade Visual', 'Logo, tipografia, cores', 'Pontual'),
      ('Site Institucional', 'Site em WordPress', 'Pontual')
    `);

    // Contratos
    await connection.query(`INSERT INTO contratos (cliente_id, data_assinatura, status) VALUES 
      (1, '2026-01-01', 'Ativo'),
      (2, '2026-03-01', 'Ativo'),
      (3, '2026-05-01', 'Ativo')
    `);

    // Contrato Itens
    await connection.query(`INSERT INTO contrato_itens (contrato_id, servico_catalogo_id, valor_fechado, dados_acordados) VALUES 
      (1, 1, 1500.00, '{"obs": "12 posts/mes"}'),
      (2, 2, 2500.00, '{"obs": "Logo e manual"}'),
      (3, 3, 4000.00, '{"obs": "Site 5 paginas"}')
    `);

    // Projetos
    await connection.query(`INSERT INTO projetos_producao (contrato_item_id, status) VALUES 
      (1, 'Em Andamento'),
      (2, 'Pausado'),
      (3, 'Em Andamento')
    `);

    // Responsaveis
    await connection.query(`INSERT INTO projeto_responsaveis (projeto_id, usuario_id) VALUES 
      (1, 2),
      (1, 3),
      (2, 4),
      (3, 2)
    `);

    // Tarefas
    await connection.query(`
      ALTER TABLE tarefas_producao 
      ADD COLUMN IF NOT EXISTS titulo VARCHAR(255) NOT NULL DEFAULT 'Nova Tarefa',
      ADD COLUMN IF NOT EXISTS complexidade VARCHAR(20) DEFAULT 'Baixa',
      ADD COLUMN IF NOT EXISTS parent_id INT NULL;
    `);

    try {
      await connection.query(`
        ALTER TABLE tarefas_producao
        ADD CONSTRAINT fk_tarefa_parent FOREIGN KEY (parent_id) REFERENCES tarefas_producao(id) ON DELETE CASCADE;
      `);
    } catch(err) {}

    await connection.query(`INSERT INTO tarefas_producao (projeto_producao_id, usuario_id, titulo, status) VALUES 
      (1, 2, 'Criar pauta do mês', 'Pendente'),
      (1, 3, 'Fazer artes', 'Pendente'),
      (3, 2, 'Layout Figma', 'Em Andamento')
    `);

    console.log('Database Recreated and Seeded Successfully!');
  } catch(e) {
    console.error('ERROR:', e);
  } finally {
    await connection.end();
  }
}
run();
