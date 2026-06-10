'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface EstatisticasMembro {
  usuario_id: number;
  tarefas_pendentes: number;
  tarefas_concluidas: number;
  tempo_medio_horas: number;
  logs: any[];
}

export async function getEstatisticasMembro(usuarioId: number): Promise<EstatisticasMembro> {
  try {
    // Pendentes
    const [pendentesRow] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM tarefas_producao WHERE usuario_id = ? AND status != 'Concluída'", [usuarioId]);
    const tarefas_pendentes = pendentesRow[0]?.total || 0;

    // Concluídas
    const [concluidasRow] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM tarefas_producao WHERE usuario_id = ? AND status = 'Concluída'", [usuarioId]);
    const tarefas_concluidas = concluidasRow[0]?.total || 0;

    // Tempo médio de tratativa
    const [tempoRow] = await pool.query<RowDataPacket[]>(`
      SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, concluido_em)) as media_horas 
      FROM tarefas_producao 
      WHERE usuario_id = ? AND status = 'Concluída' AND concluido_em IS NOT NULL
    `, [usuarioId]);
    const tempo_medio_horas = tempoRow[0]?.media_horas ? parseFloat(tempoRow[0].media_horas) : 0;

    // Histórico de Ações (Logs de Produção)
    const [logsRows] = await pool.query<RowDataPacket[]>(`
      SELECT id, projeto_id, acao, detalhes, criado_em 
      FROM logs_producao 
      WHERE usuario_id = ? 
      ORDER BY criado_em DESC 
      LIMIT 100
    `, [usuarioId]);

    // Opcional: Buscar logs de clientes também
    const [logsClientesRows] = await pool.query<RowDataPacket[]>(`
      SELECT id, cliente_id, acao, detalhes, criado_em 
      FROM logs_clientes 
      WHERE usuario_id = ? 
      ORDER BY criado_em DESC 
      LIMIT 100
    `, [usuarioId]);

    // Combina e ordena os dois logs
    const todosLogs: any[] = [
      ...logsRows.map((l: any) => ({ ...l, tipo: 'PRODUCAO' })),
      ...logsClientesRows.map((l: any) => ({ ...l, tipo: 'CRM' }))
    ].sort((a: any, b: any) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

    return {
      usuario_id: usuarioId,
      tarefas_pendentes,
      tarefas_concluidas,
      tempo_medio_horas,
      logs: todosLogs.slice(0, 100) // Top 100
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do membro:', error);
    return {
      usuario_id: usuarioId,
      tarefas_pendentes: 0,
      tarefas_concluidas: 0,
      tempo_medio_horas: 0,
      logs: []
    };
  }
}
