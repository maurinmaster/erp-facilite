'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from './auth';

export async function getConfiguracoes() {
  const session = await getSession();
  if (!session || session.perfil !== 'Admin') throw new Error('Acesso negado');
  const [rows] = await pool.query('SELECT * FROM configuracoes');
  return rows as any[];
}

import { revalidatePath } from 'next/cache';

export async function atualizarConfiguracao(chave: string, valor: string) {
  const session = await getSession();
  if (!session || session.perfil !== 'Admin') throw new Error('Acesso negado');
  
  await pool.query('UPDATE configuracoes SET valor = ? WHERE chave = ?', [valor, chave]);
  revalidatePath('/producao');
  revalidatePath('/configuracoes');
}

export async function getConfig(chave: string, defaultVal: string = '') {
  try {
     const [rows] = await pool.query<RowDataPacket[]>('SELECT valor FROM configuracoes WHERE chave = ?', [chave]);
     if (rows.length > 0) return rows[0].valor;
     return defaultVal;
  } catch(e) {
     return defaultVal;
  }
}
