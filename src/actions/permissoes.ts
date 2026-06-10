'use server';

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getSession } from './auth';

export interface Perfil {
  id: number;
  nome: string;
  permissoes: Record<string, string>;
}

export async function getPerfis(): Promise<Perfil[]> {
  const session = await getSession();
  if (!session || session.perfil !== 'Admin') throw new Error('Acesso negado');

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM perfis ORDER BY id ASC');
  return rows.map(r => {
    let parsedPerms = {};
    if (r.permissoes) {
      try {
        parsedPerms = typeof r.permissoes === 'string' ? JSON.parse(r.permissoes) : r.permissoes;
      } catch (e) {
        parsedPerms = {};
      }
    }
    return {
      id: r.id,
      nome: r.nome,
      permissoes: parsedPerms
    };
  });
}

export async function createPerfil(nome: string, permissoes: Record<string, string>): Promise<number> {
  const session = await getSession();
  if (!session || session.perfil !== 'Admin') throw new Error('Acesso negado');

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO perfis (nome, permissoes) VALUES (?, ?)',
    [nome, JSON.stringify(permissoes)]
  );
  return result.insertId;
}

export async function updatePerfil(id: number, permissoes: Record<string, string>) {
  const session = await getSession();
  if (!session || session.perfil !== 'Admin') throw new Error('Acesso negado');

  await pool.query(
    'UPDATE perfis SET permissoes = ? WHERE id = ?',
    [JSON.stringify(permissoes), id]
  );
}

export async function deletePerfil(id: number) {
  const session = await getSession();
  if (!session || session.perfil !== 'Admin') throw new Error('Acesso negado');

  const [rows] = await pool.query<RowDataPacket[]>('SELECT nome FROM perfis WHERE id = ?', [id]);
  if (rows.length === 0) throw new Error('Perfil não encontrado');
  
  const nome = rows[0].nome;
  if (['Admin', 'Gestor', 'Operador'].includes(nome)) {
    throw new Error('Não é possível excluir os perfis padrões do sistema.');
  }

  await pool.query('DELETE FROM perfis WHERE id = ?', [id]);
}
