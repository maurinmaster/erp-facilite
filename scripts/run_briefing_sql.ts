import pool from '../src/lib/db';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('1. Criando tabela briefing_templates...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS briefing_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        campos JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL
      )
    `);

    console.log('2. Atualizando tabela servicos_catalogo...');
    await connection.query(`
      ALTER TABLE servicos_catalogo 
      ADD COLUMN IF NOT EXISTS briefing_template_id INT NULL,
      ADD CONSTRAINT fk_servicos_briefing_template FOREIGN KEY (briefing_template_id) REFERENCES briefing_templates(id) ON DELETE SET NULL
    `);

    console.log('3. Injetando Template Landing Page...');
    // Verificar se já existe
    const [rows]: any = await connection.query('SELECT id FROM briefing_templates WHERE titulo = "Criação de Landing Page"');
    let templateId;
    if (rows.length === 0) {
      const campos = JSON.stringify([
        "Objetivo principal da página",
        "Público-alvo",
        "Diferenciais do produto/serviço",
        "Referências visuais (links)",
        "Call to Action (CTA) Desejado",
        "Anotações extras"
      ]);
      const [result]: any = await connection.query('INSERT INTO briefing_templates (titulo, campos) VALUES (?, ?)', ['Criação de Landing Page', campos]);
      templateId = result.insertId;
      console.log('Template de Landing Page injetado com ID:', templateId);
    } else {
      templateId = rows[0].id;
      console.log('Template de Landing Page já existia com ID:', templateId);
    }

    console.log('4. Tentando vincular template ao serviço Landing Page (se existir)...');
    await connection.query('UPDATE servicos_catalogo SET briefing_template_id = ? WHERE nome LIKE "%Landing Page%" AND briefing_template_id IS NULL', [templateId]);

    await connection.commit();
    console.log('Migração concluída com sucesso!');
  } catch (err) {
    await connection.rollback();
    console.error('Erro na migração:', err);
  } finally {
    connection.release();
    process.exit();
  }
}

run();
