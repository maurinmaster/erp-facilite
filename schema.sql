DROP DATABASE IF EXISTS erp_facilite_v2;
CREATE DATABASE erp_facilite_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE erp_facilite_v2;

-- 1. USUÁRIOS E PERFIS
CREATE TABLE IF NOT EXISTS perfis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  permissoes JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- 2. CONFIGURAÇÕES GERAIS
CREATE TABLE IF NOT EXISTS configuracoes (
  chave VARCHAR(100) PRIMARY KEY,
  valor TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. MÓDULO DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  empresa VARCHAR(255),
  cnpj_cpf VARCHAR(50),
  cep VARCHAR(20),
  logradouro VARCHAR(255),
  numero VARCHAR(50),
  complemento VARCHAR(255),
  bairro VARCHAR(255),
  cidade VARCHAR(255),
  estado VARCHAR(50),
  instagram VARCHAR(255),
  facebook VARCHAR(255),
  linkedin VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cliente_contatos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cliente_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS logs_clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  usuario_id INT NOT NULL,
  acao VARCHAR(255) NOT NULL,
  detalhes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BRIEFING E CATÁLOGO DE SERVIÇOS
CREATE TABLE IF NOT EXISTS briefing_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  campos JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS servicos_catalogo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo ENUM('Pontual', 'Recorrente') DEFAULT 'Pontual',
  briefing_template_id INT NULL,
  templates JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (briefing_template_id) REFERENCES briefing_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. CONTRATOS
CREATE TABLE IF NOT EXISTS contratos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  data_assinatura DATE,
  status VARCHAR(50) DEFAULT 'Ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contrato_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contrato_id INT NOT NULL,
  servico_catalogo_id INT NOT NULL,
  valor_fechado DECIMAL(10,2),
  dados_acordados JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE,
  FOREIGN KEY (servico_catalogo_id) REFERENCES servicos_catalogo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. MÓDULO DE PRODUÇÃO (KABAN, PROJETOS, TAREFAS, ETC)
CREATE TABLE IF NOT EXISTS kanban_colunas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  cor VARCHAR(20) DEFAULT '#CBD5E1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projetos_producao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contrato_item_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'A Fazer',
  prioridade VARCHAR(50) DEFAULT 'Normal',
  tags JSON NULL,
  kanban_coluna_id INT NULL,
  prazo_interno DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (contrato_item_id) REFERENCES contrato_itens(id) ON DELETE CASCADE,
  FOREIGN KEY (kanban_coluna_id) REFERENCES kanban_colunas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projeto_responsaveis (
  projeto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  PRIMARY KEY (projeto_id, usuario_id),
  FOREIGN KEY (projeto_id) REFERENCES projetos_producao(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projeto_tarefas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projeto_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  status ENUM('Pendente', 'Concluída') DEFAULT 'Pendente',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  concluida_em DATETIME NULL,
  FOREIGN KEY (projeto_id) REFERENCES projetos_producao(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projeto_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projeto_id INT NOT NULL,
  texto VARCHAR(255) NOT NULL,
  concluido BOOLEAN DEFAULT FALSE,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos_producao(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS logs_producao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projeto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  acao VARCHAR(255) NOT NULL,
  detalhes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos_producao(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. COMUNICAÇÃO E CORREIO
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

CREATE TABLE IF NOT EXISTS grupos_chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  criado_por INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grupos_membros (
  grupo_id INT NOT NULL,
  usuario_id INT NOT NULL,
  entrou_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (grupo_id, usuario_id),
  FOREIGN KEY (grupo_id) REFERENCES grupos_chat(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mensagens_grupo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id INT NOT NULL,
  remetente_id INT NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grupo_id) REFERENCES grupos_chat(id) ON DELETE CASCADE,
  FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leituras_grupo (
  grupo_id INT NOT NULL,
  usuario_id INT NOT NULL,
  ultima_leitura TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (grupo_id, usuario_id),
  FOREIGN KEY (grupo_id) REFERENCES grupos_chat(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- DADOS PADRÃO DO SISTEMA E ADMIN
-- ==========================================

-- Perfis Padrão
INSERT IGNORE INTO perfis (nome, permissoes) VALUES 
  ('Admin', '{"all": true}'),
  ('Gestor', '{"gerir_equipe": true}'),
  ('Colaborador', '{"ler": true}');

-- Configurações Padrão
INSERT IGNORE INTO configuracoes (chave, valor) VALUES 
  ('correio_popup_roles', 'Admin,Gestor');

-- Kanban Colunas Padrão
INSERT IGNORE INTO kanban_colunas (id, titulo, ordem, cor) VALUES 
  (1, 'A Fazer', 1, '#94a3b8'),
  (2, 'Em Andamento', 2, '#3b82f6'),
  (3, 'Aguardando Cliente', 3, '#eab308'),
  (4, 'Revisão', 4, '#a855f7'),
  (5, 'Concluído', 5, '#22c55e');

-- Administrador Padrão
-- Senha: "123456" hasheada conforme o padrão do ERP
INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES 
  ('Administrador', 'admin@erpfacilite.com', 'c61e981f29d8e9a597cebc5f2c715075:d1dec18a9a7744219cf51859e3c5f9ccecba4261bdad0747a8dc0e9f184ec67a31712149c1adda63a97d9c328d6aa6e483a8cbe80763ba8a8af6292f0d29001c', 'Admin');

