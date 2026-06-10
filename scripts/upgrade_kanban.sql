-- 1. Altera a tabela projetos_producao
ALTER TABLE projetos_producao 
ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'Normal',
ADD COLUMN IF NOT EXISTS prazo DATE,
ADD COLUMN IF NOT EXISTS tags JSON;

-- Ajusta o status default do projeto para 'Na Fila'
ALTER TABLE projetos_producao MODIFY COLUMN status VARCHAR(50) DEFAULT 'Na Fila';
UPDATE projetos_producao SET status = 'Na Fila' WHERE status = 'Briefing' OR status = 'Pendente';

-- 2. Cria a tabela de Responsáveis (Relacionamento N:N entre Projetos e Usuários)
CREATE TABLE IF NOT EXISTS projeto_responsaveis (
  projeto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  PRIMARY KEY (projeto_id, usuario_id),
  FOREIGN KEY (projeto_id) REFERENCES projetos_producao(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Cria a tabela de Comentários
CREATE TABLE IF NOT EXISTS comentarios_producao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projeto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  comentario TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos_producao(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
