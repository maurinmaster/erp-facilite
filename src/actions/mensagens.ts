'use server';

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getSession } from './auth';
import { criarNotificacao } from './notificacoes';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

export interface ConversaChat {
  id: string; // Ex: 'u_1' ou 'g_1'
  rawId: number;
  nome: string;
  perfil?: string;
  isGrupo: boolean;
  naoLidas: number;
  foto_url?: string;
}

export interface MensagemChat {
  id: number;
  remetente_id: number;
  destinatario_id?: number;
  grupo_id?: number;
  conteudo: string;
  criado_em: string;
  remetente_nome?: string; // Usado para mostrar quem enviou num grupo
  foto_url?: string;
}

export async function getConversas(): Promise<ConversaChat[]> {
  const session = await getSession();
  if (!session) return [];

  try {
    // 1. Usuarios
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, nome, perfil FROM usuarios WHERE id != ? AND deleted_at IS NULL ORDER BY nome ASC', 
      [session.id]
    );
    
    // Contagem DM
    const [unreadUsers] = await pool.query<RowDataPacket[]>(`
      SELECT remetente_id, COUNT(*) as qtd
      FROM mensagens_equipe
      WHERE destinatario_id = ? AND lida = 0
      GROUP BY remetente_id
    `, [session.id]);
    const unreadUserMap = new Map(unreadUsers.map(u => [u.remetente_id, u.qtd]));

    // 2. Grupos
    const [groups] = await pool.query<RowDataPacket[]>(`
      SELECT g.id, g.nome
      FROM grupos_chat g
      INNER JOIN grupos_membros gm ON g.id = gm.grupo_id
      WHERE gm.usuario_id = ?
      ORDER BY g.nome ASC
    `, [session.id]);

    // Contagem Grupo
    const [unreadGroups] = await pool.query<RowDataPacket[]>(`
      SELECT m.grupo_id, COUNT(*) as qtd
      FROM mensagens_grupo m
      LEFT JOIN leituras_grupo l ON m.grupo_id = l.grupo_id AND l.usuario_id = ?
      WHERE l.ultima_leitura IS NULL OR m.criado_em > l.ultima_leitura
      GROUP BY m.grupo_id
    `, [session.id]);
    const unreadGroupMap = new Map(unreadGroups.map(g => [g.grupo_id, g.qtd]));

    const publicDir = path.join(process.cwd(), 'public', 'avatars');
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    const conversas: ConversaChat[] = [
      ...users.map(u => {
        let foto_url = undefined;
        for (const ext of extensions) {
          if (fs.existsSync(path.join(publicDir, `avatar_${u.id}.${ext}`))) {
            foto_url = `/avatars/avatar_${u.id}.${ext}`;
            break;
          }
        }
        return {
          id: `u_${u.id}`,
          rawId: u.id,
          nome: u.nome,
          perfil: u.perfil,
          isGrupo: false,
          naoLidas: unreadUserMap.get(u.id) || 0,
          foto_url
        };
      }),
      ...groups.map(g => ({
        id: `g_${g.id}`,
        rawId: g.id,
        nome: g.nome,
        isGrupo: true,
        naoLidas: unreadGroupMap.get(g.id) || 0
      }))
    ];

    // Aqui daria pra ordenar pela msg mais recente se tivessemos, mas alfabético por isGrupo e nome resolve:
    conversas.sort((a, b) => {
      if (a.isGrupo && !b.isGrupo) return -1;
      if (!a.isGrupo && b.isGrupo) return 1;
      return a.nome.localeCompare(b.nome);
    });

    return conversas;
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return [];
  }
}

export async function getMensagensChat(outroUsuarioId: number): Promise<MensagemChat[]> {
  const session = await getSession();
  if (!session) return [];

  try {
    await pool.query('UPDATE mensagens_equipe SET lida = 1 WHERE remetente_id = ? AND destinatario_id = ?', [outroUsuarioId, session.id]);

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, remetente_id, destinatario_id, conteudo, criado_em
      FROM mensagens_equipe
      WHERE (remetente_id = ? AND destinatario_id = ?)
         OR (remetente_id = ? AND destinatario_id = ?)
      ORDER BY criado_em ASC
    `, [session.id, outroUsuarioId, outroUsuarioId, session.id]);
    
    const publicDir = path.join(process.cwd(), 'public', 'avatars');
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    return (rows as MensagemChat[]).map(msg => {
      let foto_url = undefined;
      for (const ext of extensions) {
        if (fs.existsSync(path.join(publicDir, `avatar_${msg.remetente_id}.${ext}`))) {
          foto_url = `/avatars/avatar_${msg.remetente_id}.${ext}`;
          break;
        }
      }
      return { ...msg, foto_url };
    });
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
    return [];
  }
}

export async function getMensagensGrupo(grupoId: number): Promise<MensagemChat[]> {
  const session = await getSession();
  if (!session) return [];

  try {
    // Atualiza data de leitura
    await pool.query(`
      INSERT INTO leituras_grupo (grupo_id, usuario_id, ultima_leitura) 
      VALUES (?, ?, NOW()) 
      ON DUPLICATE KEY UPDATE ultima_leitura = NOW()
    `, [grupoId, session.id]);

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT m.id, m.grupo_id, m.remetente_id, m.conteudo, m.criado_em, u.nome as remetente_nome
      FROM mensagens_grupo m
      INNER JOIN usuarios u ON m.remetente_id = u.id
      WHERE m.grupo_id = ?
      ORDER BY m.criado_em ASC
    `, [grupoId]);
    
    const publicDir = path.join(process.cwd(), 'public', 'avatars');
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    return (rows as MensagemChat[]).map(msg => {
      let foto_url = undefined;
      for (const ext of extensions) {
        if (fs.existsSync(path.join(publicDir, `avatar_${msg.remetente_id}.${ext}`))) {
          foto_url = `/avatars/avatar_${msg.remetente_id}.${ext}`;
          break;
        }
      }
      return { ...msg, foto_url };
    });
  } catch (error) {
    console.error('Erro ao carregar mensagens do grupo:', error);
    return [];
  }
}

export async function enviarMensagemChat(destinatarioId: number, conteudo: string) {
  const session = await getSession();
  if (!session || !conteudo.trim()) return;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO mensagens_equipe (remetente_id, destinatario_id, conteudo) VALUES (?, ?, ?)',
      [session.id, destinatarioId, conteudo]
    );

    const novaMensagemId = result.insertId;

    try {
      fetch('http://localhost:3001/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'nova_mensagem',
          userId: destinatarioId,
          payload: { id: novaMensagemId, remetente_id: session.id, destinatario_id: destinatarioId, conteudo, criado_em: new Date().toISOString() }
        })
      }).catch(e => console.error('WS Ping failed:', e.message));
    } catch (e) {}

    await criarNotificacao({
      usuario_id: destinatarioId,
      remetente_id: session.id,
      tipo: 'MENSAGEM',
      titulo: `Nova mensagem de ${session.nome}`,
      mensagem: conteudo.substring(0, 50) + (conteudo.length > 50 ? '...' : ''),
      link: `/mensagens?u=${session.id}`
    });

    revalidatePath('/mensagens');
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw new Error('Falha ao enviar mensagem');
  }
}

export async function enviarMensagemGrupo(grupoId: number, conteudo: string) {
  const session = await getSession();
  if (!session || !conteudo.trim()) return;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO mensagens_grupo (grupo_id, remetente_id, conteudo) VALUES (?, ?, ?)',
      [grupoId, session.id, conteudo]
    );
    const novaMensagemId = result.insertId;

    // Pega o nome do grupo e membros para enviar notificacao
    const [grupoRows] = await pool.query<RowDataPacket[]>('SELECT nome FROM grupos_chat WHERE id = ?', [grupoId]);
    const grupoNome = grupoRows[0]?.nome || 'Grupo';

    const [membros] = await pool.query<RowDataPacket[]>('SELECT usuario_id FROM grupos_membros WHERE grupo_id = ? AND usuario_id != ?', [grupoId, session.id]);

    const timestamp = new Date().toISOString();

    for (const membro of membros) {
      // Avisa via WS
      try {
        fetch('http://localhost:3001/emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'nova_mensagem',
            userId: membro.usuario_id,
            payload: { id: novaMensagemId, remetente_id: session.id, grupo_id: grupoId, conteudo, criado_em: timestamp, remetente_nome: session.nome }
          })
        }).catch(() => {});
      } catch (e) {}

      // Cria notificacao
      await criarNotificacao({
        usuario_id: membro.usuario_id,
        remetente_id: session.id,
        tipo: 'MENSAGEM',
        titulo: `Nova mensagem em ${grupoNome} (de ${session.nome})`,
        mensagem: conteudo.substring(0, 50) + (conteudo.length > 50 ? '...' : ''),
        link: `/mensagens?g=${grupoId}`
      });
    }

    revalidatePath('/mensagens');
  } catch (error) {
    console.error('Erro ao enviar mensagem no grupo:', error);
    throw new Error('Falha ao enviar mensagem');
  }
}

export async function criarGrupo(nome: string, membrosIds: number[]) {
  const session = await getSession();
  if (!session) return;

  if (!membrosIds.includes(session.id)) {
    membrosIds.push(session.id);
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO grupos_chat (nome, criado_por) VALUES (?, ?)',
      [nome, session.id]
    );
    const grupoId = result.insertId;

    for (const uid of membrosIds) {
      await pool.query('INSERT INTO grupos_membros (grupo_id, usuario_id) VALUES (?, ?)', [grupoId, uid]);
    }

    revalidatePath('/mensagens');
    return grupoId;
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    throw new Error('Falha ao criar grupo');
  }
}

export async function deletarGrupo(grupoId: number) {
  const session = await getSession();
  if (!session) throw new Error('Não autorizado');

  try {
    const [grupoRows] = await pool.query<RowDataPacket[]>('SELECT criado_por FROM grupos_chat WHERE id = ?', [grupoId]);
    if (grupoRows.length === 0) throw new Error('Grupo não encontrado');
    
    const criadoPor = grupoRows[0].criado_por;
    
    if (criadoPor !== session.id && session.perfil !== 'Admin') {
      throw new Error('Apenas o criador do grupo ou administradores podem excluí-lo.');
    }

    await pool.query('DELETE FROM mensagens_grupo WHERE grupo_id = ?', [grupoId]);
    await pool.query('DELETE FROM leituras_grupo WHERE grupo_id = ?', [grupoId]);
    await pool.query('DELETE FROM grupos_membros WHERE grupo_id = ?', [grupoId]);
    await pool.query('DELETE FROM grupos_chat WHERE id = ?', [grupoId]);

    revalidatePath('/mensagens');
    return true;
  } catch (error: any) {
    console.error('Erro ao deletar grupo:', error);
    throw new Error(error.message || 'Falha ao deletar grupo');
  }
}
