'use server';

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getSession } from './auth';
import { criarNotificacao } from './notificacoes';

export interface MensagemResumo {
  id: number;
  assunto: string;
  remetente_nome: string;
  remetente_id: number;
  created_at: string;
  lida: boolean;
  is_popup: boolean;
}

export interface MensagemDetalhes {
  id: number;
  assunto: string;
  corpo: string;
  created_at: string;
  remetente_id: number;
  remetente_nome: string;
  destinatarios: { id: number; nome: string; tipo: 'To' | 'Cc'; lida: boolean }[];
  is_popup: boolean;
}

export async function getCaixaEntrada(): Promise<MensagemResumo[]> {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado');

  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      m.id, 
      m.assunto, 
      m.created_at, 
      m.is_popup,
      u.nome as remetente_nome,
      u.id as remetente_id,
      d.lida
    FROM correio_destinatarios d
    JOIN correio_mensagens m ON m.id = d.mensagem_id
    JOIN usuarios u ON u.id = m.remetente_id
    WHERE d.usuario_id = ? AND d.deleted_at IS NULL AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
  `, [session.id]);

  return rows as MensagemResumo[];
}

export async function getEnviados(): Promise<MensagemResumo[]> {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado');

  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      m.id, 
      m.assunto, 
      m.created_at, 
      m.is_popup,
      u.nome as remetente_nome,
      u.id as remetente_id,
      TRUE as lida
    FROM correio_mensagens m
    JOIN usuarios u ON u.id = m.remetente_id
    WHERE m.remetente_id = ? AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
  `, [session.id]);

  return rows as MensagemResumo[];
}

export async function getMensagemDetalhes(id: number): Promise<MensagemDetalhes | null> {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado');

  // Verifica se o usuário é o remetente ou um destinatário
  const [authCheck] = await pool.query<RowDataPacket[]>(`
    SELECT 1 FROM correio_mensagens m
    LEFT JOIN correio_destinatarios d ON d.mensagem_id = m.id AND d.usuario_id = ?
    WHERE m.id = ? AND (m.remetente_id = ? OR d.id IS NOT NULL)
    LIMIT 1
  `, [session.id, id, session.id]);

  if (authCheck.length === 0) return null;

  const [msgRows] = await pool.query<RowDataPacket[]>(`
    SELECT m.id, m.assunto, m.corpo, m.created_at, m.is_popup, m.remetente_id, u.nome as remetente_nome
    FROM correio_mensagens m
    JOIN usuarios u ON u.id = m.remetente_id
    WHERE m.id = ?
  `, [id]);

  if (msgRows.length === 0) return null;

  const msg = msgRows[0];

  const [destRows] = await pool.query<RowDataPacket[]>(`
    SELECT d.usuario_id as id, u.nome, d.tipo, d.lida
    FROM correio_destinatarios d
    JOIN usuarios u ON u.id = d.usuario_id
    WHERE d.mensagem_id = ?
  `, [id]);

  // Marcar como lida se for destinatário
  await pool.query(`
    UPDATE correio_destinatarios 
    SET lida = TRUE, lida_em = NOW(), popup_visto = TRUE
    WHERE mensagem_id = ? AND usuario_id = ? AND lida = FALSE
  `, [id, session.id]);

  return {
    ...msg,
    destinatarios: destRows
  } as MensagemDetalhes;
}

export async function enviarMensagem(destinatariosIds: number[], assunto: string, corpo: string, isPopup: boolean) {
  const session = await getSession();
  if (!session) throw new Error('Não autenticado');

  if (isPopup) {
    if (session.perfil !== 'Admin') {
      const p = session.permissoes || {};
      if (p.enviar_alertas !== 'full') {
        throw new Error('Você não tem permissão para enviar mensagens como Popup.');
      }
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [msgResult] = await connection.query<ResultSetHeader>(`
      INSERT INTO correio_mensagens (remetente_id, assunto, corpo, is_popup)
      VALUES (?, ?, ?, ?)
    `, [session.id, assunto, corpo, isPopup]);

    const msgId = msgResult.insertId;

    if (destinatariosIds.length > 0) {
      const destValues = destinatariosIds.map(id => [msgId, id, 'To']);
      await connection.query(`
        INSERT INTO correio_destinatarios (mensagem_id, usuario_id, tipo)
        VALUES ?
      `, [destValues]);

      // Notifica os destinatários via sistema e WS
      for (const destId of destinatariosIds) {
        try {
          fetch('http://localhost:3001/emit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'nova_notificacao',
              userId: destId,
              payload: { id: msgId, titulo: `Novo e-mail de ${session.nome}`, mensagem: assunto, link: `/correio/${msgId}` }
            })
          }).catch(() => {});
        } catch (e) {}

        await criarNotificacao({
          usuario_id: destId,
          remetente_id: session.id,
          tipo: 'CORREIO',
          titulo: `Novo e-mail de ${session.nome}`,
          mensagem: assunto,
          link: `/correio/${msgId}`
        });
      }
    }

    await connection.commit();
    return msgId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function verificarPopupsNaoVistos() {
  const session = await getSession();
  if (!session) return [];

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT m.id, m.assunto, m.corpo, u.nome as remetente_nome
      FROM correio_destinatarios d
      JOIN correio_mensagens m ON m.id = d.mensagem_id
      JOIN usuarios u ON u.id = m.remetente_id
      WHERE d.usuario_id = ? AND m.is_popup = 1 AND d.popup_visto = 0
      ORDER BY m.created_at ASC
    `, [session.id]);

    return rows as { id: number, assunto: string, corpo: string, remetente_nome: string }[];
  } catch (error) {
    console.error('Erro em verificarPopupsNaoVistos:', error);
    return [];
  }
}

export async function marcarPopupComoVisto(mensagemId: number) {
  const session = await getSession();
  if (!session) return;

  await pool.query(`
    UPDATE correio_destinatarios 
    SET popup_visto = TRUE, lida = TRUE, lida_em = NOW()
    WHERE mensagem_id = ? AND usuario_id = ?
  `, [mensagemId, session.id]);
}

import { revalidatePath } from 'next/cache';

export async function excluirMensagemEntrada(mensagemId: number) {
  const session = await getSession();
  if (!session) return;

  await pool.query(`
    UPDATE correio_destinatarios 
    SET deleted_at = NOW() 
    WHERE mensagem_id = ? AND usuario_id = ?
  `, [mensagemId, session.id]);
  
  revalidatePath('/correio');
}

export async function excluirMensagemEnviada(mensagemId: number) {
  const session = await getSession();
  if (!session) return;

  await pool.query(`
    UPDATE correio_mensagens 
    SET deleted_at = NOW() 
    WHERE id = ? AND remetente_id = ?
  `, [mensagemId, session.id]);

  revalidatePath('/correio');
}

export async function getUsuariosDestinatarios() {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT id, nome, perfil, foto_url FROM usuarios WHERE deleted_at IS NULL ORDER BY nome ASC
  `);
  return rows as { id: number, nome: string, perfil: string, foto_url: string }[];
}
