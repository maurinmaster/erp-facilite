'use server';

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface ServicoCatalogoComTemplates {
  id: number;
  nome: string;
  tipo: string;
  descricao: string;
  templates: string[];
  briefing_template_id: number | null;
  briefing_campos: string[];
}

export async function createServicoCatalogo(formData: FormData) {
  const nome = formData.get('nome') as string;
  const tipo = formData.get('tipo') as string;
  const descricao = formData.get('descricao') as string;
  const briefingTemplateIdStr = formData.get('briefing_template_id') as string;
  const briefing_template_id = briefingTemplateIdStr ? parseInt(briefingTemplateIdStr, 10) : null;
  
  // No FormData, podemos ter múltiplos campos com o nome 'tarefas[]'
  const tarefas = formData.getAll('tarefas[]') as string[];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO servicos_catalogo (nome, tipo, descricao, briefing_template_id) VALUES (?, ?, ?, ?)',
      [nome, tipo, descricao, briefing_template_id]
    );

    const servicoId = result.insertId;

    if (tarefas && tarefas.length > 0) {
      // Filtra tarefas vazias
      const taskValues = tarefas
        .map(t => t.trim())
        .filter(t => t !== '')
        .map(t => [servicoId, t]);
        
      if (taskValues.length > 0) {
        await connection.query(
          'INSERT INTO templates_tarefas (servico_catalogo_id, titulo_tarefa) VALUES ?',
          [taskValues]
        );
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar serviço no catálogo:', error);
    throw new Error('Falha ao criar serviço.');
  } finally {
    connection.release();
  }

  revalidatePath('/catalogo');
  redirect('/catalogo');
}

export async function getServicosComTemplates(): Promise<ServicoCatalogoComTemplates[]> {
  try {
    const query = `
      SELECT 
        s.id, s.nome, s.tipo, s.descricao, s.briefing_template_id, bt.campos as briefing_campos,
        GROUP_CONCAT(t.titulo_tarefa SEPARATOR '|||') as tarefas
      FROM servicos_catalogo s
      LEFT JOIN templates_tarefas t ON s.id = t.servico_catalogo_id
      LEFT JOIN briefing_templates bt ON s.briefing_template_id = bt.id
      WHERE s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY s.nome ASC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    
    return rows.map(row => {
      let bCampos = [];
      if (row.briefing_campos) {
        try { bCampos = typeof row.briefing_campos === 'string' ? JSON.parse(row.briefing_campos) : row.briefing_campos; } catch (e) {}
      }
      return {
        id: row.id,
        nome: row.nome,
        tipo: row.tipo,
        descricao: row.descricao,
        templates: row.tarefas ? row.tarefas.split('|||') : [],
        briefing_template_id: row.briefing_template_id,
        briefing_campos: bCampos
      };
    });
  } catch (error) {
    console.error('Erro ao buscar catálogo com templates:', error);
    return [];
  }
}

export async function deleteServicoCatalogo(id: number) {
  try {
    await pool.query('UPDATE servicos_catalogo SET deleted_at = NOW() WHERE id = ?', [id]);
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar serviço do catálogo:', error);
    throw new Error('Falha ao deletar serviço.');
  }
}

export async function updateServicoCatalogo(id: number, formData: FormData) {
  const nome = formData.get('nome') as string;
  const tipo = formData.get('tipo') as string;
  const descricao = formData.get('descricao') as string;
  const briefingTemplateIdStr = formData.get('briefing_template_id') as string;
  const briefing_template_id = briefingTemplateIdStr ? parseInt(briefingTemplateIdStr, 10) : null;
  const tarefas = formData.getAll('tarefas[]') as string[];

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE servicos_catalogo SET nome = ?, tipo = ?, descricao = ?, briefing_template_id = ? WHERE id = ?',
      [nome, tipo, descricao, briefing_template_id, id]
    );

    // Hard delete nas tarefas antigas (não precisa soft delete porque são só templates e vamos recriá-los agora)
    await connection.query('DELETE FROM templates_tarefas WHERE servico_catalogo_id = ?', [id]);

    if (tarefas && tarefas.length > 0) {
      const taskValues = tarefas
        .map(t => t.trim())
        .filter(t => t !== '')
        .map(t => [id, t]);
        
      if (taskValues.length > 0) {
        await connection.query(
          'INSERT INTO templates_tarefas (servico_catalogo_id, titulo_tarefa) VALUES ?',
          [taskValues]
        );
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar serviço:', error);
    throw new Error('Falha ao atualizar serviço.');
  } finally {
    connection.release();
  }

  revalidatePath('/catalogo');
  redirect('/catalogo');
}

export async function getServicoById(id: number): Promise<ServicoCatalogoComTemplates | null> {
  try {
    const query = `
      SELECT 
        s.id, s.nome, s.tipo, s.descricao, s.briefing_template_id, bt.campos as briefing_campos,
        GROUP_CONCAT(t.titulo_tarefa SEPARATOR '|||') as tarefas
      FROM servicos_catalogo s
      LEFT JOIN templates_tarefas t ON s.id = t.servico_catalogo_id
      LEFT JOIN briefing_templates bt ON s.briefing_template_id = bt.id
      WHERE s.id = ? AND s.deleted_at IS NULL
      GROUP BY s.id
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    
    if (rows.length === 0) return null;
    const row = rows[0];
    
    let bCampos = [];
    if (row.briefing_campos) {
      try { bCampos = typeof row.briefing_campos === 'string' ? JSON.parse(row.briefing_campos) : row.briefing_campos; } catch (e) {}
    }

    return {
      id: row.id,
      nome: row.nome,
      tipo: row.tipo,
      descricao: row.descricao,
      templates: row.tarefas ? row.tarefas.split('|||') : [],
      briefing_template_id: row.briefing_template_id,
      briefing_campos: bCampos
    };
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return null;
  }
}
