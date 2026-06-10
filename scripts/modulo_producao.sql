-- Cria a tabela de contratos (Vínculo do Cliente com a Agência)
CREATE TABLE IF NOT EXISTS contratos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  data_assinatura DATE,
  status VARCHAR(50) DEFAULT 'Ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Cria o catálogo de serviços oferecidos pela agência
CREATE TABLE IF NOT EXISTS servicos_catalogo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'Pontual' ou 'Recorrente'
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela que armazena os itens vendidos no contrato (briefing em JSON)
CREATE TABLE IF NOT EXISTS contrato_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contrato_id INT NOT NULL,
  servico_catalogo_id INT NOT NULL,
  valor_fechado DECIMAL(10,2),
  dados_acordados JSON,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE,
  FOREIGN KEY (servico_catalogo_id) REFERENCES servicos_catalogo(id)
);

-- Tabela macro do projeto em andamento
CREATE TABLE IF NOT EXISTS projetos_producao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contrato_item_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'Briefing', -- Briefing, Em Produção, Concluído
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contrato_item_id) REFERENCES contrato_itens(id) ON DELETE CASCADE
);

-- Tabela de micro-tarefas da produção
CREATE TABLE IF NOT EXISTS tarefas_producao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projeto_producao_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pendente', -- Pendente, Em Andamento, Concluída
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_producao_id) REFERENCES projetos_producao(id) ON DELETE CASCADE
);

-- Templates para gerar tarefas automaticamente dependendo do serviço vendido
CREATE TABLE IF NOT EXISTS templates_tarefas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  servico_catalogo_id INT NOT NULL,
  titulo_tarefa VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (servico_catalogo_id) REFERENCES servicos_catalogo(id) ON DELETE CASCADE
);
