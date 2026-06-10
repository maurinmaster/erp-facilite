-- 1. Adiciona a coluna usuario_id para permitir a delegação de tarefas de checklist
ALTER TABLE tarefas_producao 
ADD COLUMN IF NOT EXISTS usuario_id INT DEFAULT NULL;

-- 2. Adiciona a foreign key
-- Se der erro de duplicate key name, ignorar, caso contrário será criada a relação
ALTER TABLE tarefas_producao
ADD CONSTRAINT fk_tarefas_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
