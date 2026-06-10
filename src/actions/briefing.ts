'use server';

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface BriefingTemplate {
  id: number;
  titulo: string;
  campos: string[];
}

export async function getBriefingTemplates(): Promise<BriefingTemplate[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, titulo, campos FROM briefing_templates WHERE deleted_at IS NULL ORDER BY titulo ASC');
    return rows.map(row => {
      let camposObj = [];
      try { camposObj = typeof row.campos === 'string' ? JSON.parse(row.campos) : row.campos; } catch (e) {}
      return {
        id: row.id,
        titulo: row.titulo,
        campos: camposObj
      };
    });
  } catch (error) {
    console.error('Erro ao buscar templates de briefing:', error);
    return [];
  }
}

export async function createBriefingTemplate(formData: FormData) {
  const titulo = formData.get('titulo') as string;
  const campos = formData.getAll('campos[]') as string[];
  
  const camposValidos = campos.map(c => c.trim()).filter(c => c !== '');
  const jsonCampos = JSON.stringify(camposValidos);

  try {
    await pool.query('INSERT INTO briefing_templates (titulo, campos) VALUES (?, ?)', [titulo, jsonCampos]);
  } catch (error) {
    console.error('Erro ao criar template:', error);
    throw new Error('Falha ao criar template de briefing.');
  }

  revalidatePath('/briefings');
  redirect('/briefings');
}

export async function updateBriefingTemplate(id: number, formData: FormData) {
  const titulo = formData.get('titulo') as string;
  const campos = formData.getAll('campos[]') as string[];
  
  const camposValidos = campos.map(c => c.trim()).filter(c => c !== '');
  const jsonCampos = JSON.stringify(camposValidos);

  try {
    await pool.query('UPDATE briefing_templates SET titulo = ?, campos = ? WHERE id = ?', [titulo, jsonCampos, id]);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    throw new Error('Falha ao atualizar template.');
  }

  revalidatePath('/briefings');
  redirect('/briefings');
}

export async function deleteBriefingTemplate(id: number) {
  try {
    await pool.query('UPDATE briefing_templates SET deleted_at = NOW() WHERE id = ?', [id]);
    revalidatePath('/briefings');
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    throw new Error('Falha ao deletar template.');
  }
}

export async function getBriefingTemplateById(id: number): Promise<BriefingTemplate | null> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, titulo, campos FROM briefing_templates WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) return null;
    
    let camposObj = [];
    try { camposObj = typeof rows[0].campos === 'string' ? JSON.parse(rows[0].campos) : rows[0].campos; } catch (e) {}
    
    return {
      id: rows[0].id,
      titulo: rows[0].titulo,
      campos: camposObj
    };
  } catch (error) {
    console.error('Erro ao buscar template por ID:', error);
    return null;
  }
}
