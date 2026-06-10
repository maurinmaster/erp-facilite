'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { registrarLogCliente } from './cliente';

export interface Contato {
  id?: number;
  cliente_id: number;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  created_at?: string;
}

export async function getContatosByCliente(clienteId: number): Promise<Contato[]> {
  try {
    const [rows] = await pool.query('SELECT * FROM cliente_contatos WHERE cliente_id = ? AND deleted_at IS NULL ORDER BY nome ASC', [clienteId]);
    return rows as Contato[];
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    return [];
  }
}

export async function addContato(clienteId: number, formData: FormData) {
  const nome = formData.get('nome') as string;
  const cargo = formData.get('cargo') as string;
  const email = formData.get('email') as string;
  const telefone = formData.get('telefone') as string;

  try {
    await pool.query(
      'INSERT INTO cliente_contatos (cliente_id, nome, cargo, email, telefone) VALUES (?, ?, ?, ?, ?)',
      [clienteId, nome, cargo, email, telefone]
    );

    await registrarLogCliente(clienteId, 'CREATE_CONTACT', `Adicionou o contato adicional: ${nome} (${cargo || 'Sem cargo'})`);
  } catch (error) {
    console.error('Erro ao adicionar contato:', error);
    throw new Error('Falha ao adicionar contato');
  }

  revalidatePath(`/clientes/${clienteId}`);
}

export async function removeContato(clienteId: number, contatoId: number) {
  try {
    const [rows] = await pool.query('SELECT nome FROM cliente_contatos WHERE id = ?', [contatoId]) as any;
    const nome = rows[0]?.nome || 'Desconhecido';

    await pool.query('UPDATE cliente_contatos SET deleted_at = NOW() WHERE id = ? AND cliente_id = ?', [contatoId, clienteId]);
    
    await registrarLogCliente(clienteId, 'DELETE_CONTACT', `Removeu o contato adicional: ${nome}`);
  } catch (error) {
    console.error('Erro ao remover contato:', error);
    throw new Error('Falha ao remover contato');
  }

  revalidatePath(`/clientes/${clienteId}`);
}
