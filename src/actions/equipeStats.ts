'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { Usuario, getEquipe } from './auth';

export interface EquipeStats extends Usuario {
  clientesCount: number;
  tarefasPendentes: number;
  tarefasAtrasadas: number;
  taxaConclusao: number;
}

export async function getEquipeWithStats(): Promise<EquipeStats[]> {
  const equipe = await getEquipe();
  const statsList: EquipeStats[] = [];

  const hojeStr = new Date().toISOString().split('T')[0];

  for (const membro of equipe) {
    const usuarioId = membro.id;

    // Clientes únicos (baseado em projetos que o usuário é responsável OU tem tarefas)
    const [clientesRow] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT ctr.cliente_id) as total_clientes
      FROM projetos_producao pp
      INNER JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
      INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
      LEFT JOIN projeto_responsaveis pr ON pr.projeto_id = pp.id
      LEFT JOIN tarefas_producao tp ON tp.projeto_producao_id = pp.id
      WHERE (pr.usuario_id = ? OR tp.usuario_id = ?)
        AND pp.deleted_at IS NULL 
        AND pp.status != 'Finalizado'
    `, [usuarioId, usuarioId]);

    const clientesCount = clientesRow[0]?.total_clientes || 0;

    // Tarefas Pendentes e Concluídas
    const [tarefasRow] = await pool.query<RowDataPacket[]>(`
      SELECT 
        SUM(CASE WHEN status != 'Concluída' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN status = 'Concluída' THEN 1 ELSE 0 END) as concluidas
      FROM tarefas_producao 
      WHERE usuario_id = ?
    `, [usuarioId]);

    const pendentes = Number(tarefasRow[0]?.pendentes || 0);
    const concluidas = Number(tarefasRow[0]?.concluidas || 0);
    const totalTarefas = pendentes + concluidas;
    const taxaConclusao = totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0;

    // Tarefas Atrasadas (projetos atrasados com tarefas pendentes para o usuário)
    const [atrasadasRow] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as atrasadas
      FROM tarefas_producao tp
      INNER JOIN projetos_producao pp ON tp.projeto_producao_id = pp.id
      WHERE tp.usuario_id = ? 
        AND tp.status != 'Concluída'
        AND pp.prazo IS NOT NULL 
        AND pp.prazo < ?
        AND pp.deleted_at IS NULL
    `, [usuarioId, hojeStr]);

    const tarefasAtrasadas = Number(atrasadasRow[0]?.atrasadas || 0);

    statsList.push({
      ...membro,
      clientesCount,
      tarefasPendentes: pendentes,
      tarefasAtrasadas,
      taxaConclusao
    });
  }

  return statsList;
}
