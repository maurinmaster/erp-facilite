'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { registrarLogCliente } from './cliente';

export interface Link {
  id?: number;
  cliente_id: number;
  titulo: string;
  url: string;
  created_at?: string;
}

export async function getLinksByCliente(clienteId: number): Promise<Link[]> {
  try {
    const [rows] = await pool.query('SELECT * FROM cliente_links WHERE cliente_id = ? AND deleted_at IS NULL ORDER BY created_at ASC', [clienteId]);
    return rows as Link[];
  } catch (error) {
    console.error('Erro ao buscar links:', error);
    return [];
  }
}

export async function addLink(clienteId: number, formData: FormData) {
  const titulo = formData.get('titulo') as string;
  const url = formData.get('url') as string;

  try {
    await pool.query(
      'INSERT INTO cliente_links (cliente_id, titulo, url) VALUES (?, ?, ?)',
      [clienteId, titulo, url]
    );
    await registrarLogCliente(clienteId, 'CREATE_LINK', `Adicionou o link/pasta: ${titulo}`);
  } catch (error) {
    console.error('Erro ao adicionar link:', error);
    throw new Error('Falha ao adicionar link');
  }

  revalidatePath(`/clientes/${clienteId}`);
}

export async function removeLink(clienteId: number, linkId: number) {
  try {
    const [rows] = await pool.query('SELECT titulo FROM cliente_links WHERE id = ?', [linkId]) as any;
    const titulo = rows[0]?.titulo || 'Desconhecido';

    await pool.query('UPDATE cliente_links SET deleted_at = NOW() WHERE id = ? AND cliente_id = ?', [linkId, clienteId]);
    await registrarLogCliente(clienteId, 'DELETE_LINK', `Removeu o link/pasta: ${titulo}`);
  } catch (error) {
    console.error('Erro ao remover link:', error);
    throw new Error('Falha ao remover link');
  }

  revalidatePath(`/clientes/${clienteId}`);
}
