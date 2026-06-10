import pool from '../src/lib/db';

async function run() {
  try {
    await pool.query('ALTER TABLE servicos_catalogo ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;');
    console.log('Coluna deleted_at adicionada com sucesso na tabela servicos_catalogo!');
  } catch (err) {
    console.error('Erro ao adicionar coluna:', err);
  } finally {
    process.exit();
  }
}

run();
