'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from './auth';

export interface SidebarCounts {
  unreadCorreio: number;
  unreadChat: number;
  pendingProducao: number;
}

export async function getSidebarBadgeCounts(): Promise<SidebarCounts> {
  const session = await getSession();
  if (!session) {
    return { unreadCorreio: 0, unreadChat: 0, pendingProducao: 0 };
  }

  const userId = session.id;

  try {
    // 1. Correio: E-mails não lidos
    const [correioRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as qtd
      FROM correio_destinatarios d
      JOIN correio_mensagens m ON m.id = d.mensagem_id
      WHERE d.usuario_id = ? AND d.lida = FALSE AND d.deleted_at IS NULL AND m.deleted_at IS NULL
    `, [userId]);
    const unreadCorreio = correioRows[0]?.qtd || 0;

    // 2. Chat: Mensagens Diretas e de Grupos não lidas
    const [dmRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as qtd
      FROM mensagens_equipe
      WHERE destinatario_id = ? AND lida = 0
    `, [userId]);
    const dmCount = dmRows[0]?.qtd || 0;

    const [groupRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(m.id) as qtd
      FROM mensagens_grupo m
      INNER JOIN grupos_membros gm ON m.grupo_id = gm.grupo_id
      LEFT JOIN leituras_grupo l ON m.grupo_id = l.grupo_id AND l.usuario_id = ?
      WHERE gm.usuario_id = ? AND (l.ultima_leitura IS NULL OR m.criado_em > l.ultima_leitura)
    `, [userId, userId]);
    const groupCount = groupRows[0]?.qtd || 0;
    
    const unreadChat = dmCount + groupCount;

    // 3. Produção: Tarefas pendentes ou em andamento
    const [producaoRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as qtd
      FROM tarefas_producao
      WHERE usuario_id = ? AND status IN ('PENDENTE', 'EM_ANDAMENTO') AND deleted_at IS NULL
    `, [userId]);
    const pendingProducao = producaoRows[0]?.qtd || 0;

    return {
      unreadCorreio,
      unreadChat,
      pendingProducao
    };

  } catch (error) {
    console.error('Erro ao buscar contagens do menu lateral:', error);
    return { unreadCorreio: 0, unreadChat: 0, pendingProducao: 0 };
  }
}
