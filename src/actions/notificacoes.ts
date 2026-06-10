'use server';

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';

export interface Notificacao {
  id: number;
  tipo: 'MENSAGEM' | 'MENCAO' | 'SISTEMA';
  titulo: string;
  mensagem: string | null;
  link: string | null;
  lida: boolean;
  criado_em: string;
  remetente_nome?: string;
  remetente_id?: number;
}

export async function getNotificacoesNaoLidas(): Promise<Notificacao[]> {
  const session = await getSession();
  if (!session) return [];

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT n.id, n.tipo, n.titulo, n.mensagem, n.link, n.lida, n.criado_em, n.remetente_id, u.nome as remetente_nome
      FROM notificacoes n
      LEFT JOIN usuarios u ON n.remetente_id = u.id
      WHERE n.usuario_id = ? AND n.lida = 0
      ORDER BY n.criado_em DESC
      LIMIT 10
    `, [session.id]);
    
    return rows as Notificacao[];
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
}

export async function marcarNotificacaoComoLida(ids: number | number[]) {
  const session = await getSession();
  if (!session) return;

  const idArray = Array.isArray(ids) ? ids : [ids];
  if (idArray.length === 0) return;

  try {
    await pool.query('UPDATE notificacoes SET lida = 1 WHERE id IN (?) AND usuario_id = ?', [idArray, session.id]);
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
  }
}

export async function criarNotificacao({
  usuario_id,
  remetente_id,
  tipo,
  titulo,
  mensagem,
  link
}: {
  usuario_id: number;
  remetente_id?: number;
  tipo: 'MENSAGEM' | 'MENCAO' | 'SISTEMA';
  titulo: string;
  mensagem?: string;
  link?: string;
}) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO notificacoes (usuario_id, remetente_id, tipo, titulo, mensagem, link) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario_id, remetente_id || null, tipo, titulo, mensagem || null, link || null]
    );

    const novaId = result.insertId;

    // Dispara o evento pro servidor WebSocket
    try {
      fetch('http://localhost:3001/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'nova_notificacao',
          userId: usuario_id,
          payload: { id: novaId, tipo, titulo, mensagem, link, criado_em: new Date().toISOString() }
        })
      }).catch(e => console.error('WS Ping failed:', e.message));
    } catch (e) {}

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}
