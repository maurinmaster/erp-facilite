CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  empresa VARCHAR(255),
  cnpj_cpf VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar colunas de endereço na tabela de clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS cep VARCHAR(20),
ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255),
ADD COLUMN IF NOT EXISTS numero VARCHAR(50),
ADD COLUMN IF NOT EXISTS complemento VARCHAR(255),
ADD COLUMN IF NOT EXISTS bairro VARCHAR(255),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50);

-- Tabela para armazenar os contatos da empresa
CREATE TABLE IF NOT EXISTS cliente_contatos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Tabela para armazenar links e documentos importantes (Drive, Redes Sociais, etc)
CREATE TABLE IF NOT EXISTS cliente_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Adicionar colunas de redes sociais na tabela de clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS instagram VARCHAR(255),
ADD COLUMN IF NOT EXISTS facebook VARCHAR(255),
ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
