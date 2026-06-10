CREATE TABLE IF NOT EXISTS logs_clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  usuario_id INT, 
  usuario_nome VARCHAR(255), 
  acao VARCHAR(100) NOT NULL, 
  detalhes TEXT NOT NULL, 
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
