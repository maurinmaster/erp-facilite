-- 1. Adiciona as colunas de anexo na tabela de comentários
ALTER TABLE comentarios_producao 
ADD COLUMN IF NOT EXISTS anexo_url VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS anexo_nome VARCHAR(255) DEFAULT NULL;
