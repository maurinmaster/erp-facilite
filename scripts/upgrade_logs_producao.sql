CREATE TABLE IF NOT EXISTS logs_producao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projeto_id INT NOT NULL,
  usuario_id INT, 
  usuario_nome VARCHAR(255), 
  acao VARCHAR(100) NOT NULL, 
  detalhes TEXT NOT NULL, 
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos_producao(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
