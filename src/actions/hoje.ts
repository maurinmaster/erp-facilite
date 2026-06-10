'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from './auth';

export interface PanoramaItem {
  projeto_id: number;
  projeto_status: string;
  prioridade: string;
  prazo: string | null;
  tags: string[];
  servico_nome: string;
  servico_tipo: string;
  cliente_nome: string;
  responsaveis_iniciais: string[];
}

export interface MicroTarefaItem {
  tarefa_id: number;
  tarefa_titulo: string;
  tarefa_status: string;
  projeto_id: number;
  projeto_status: string;
  prioridade: string;
  prazo: string | null;
  servico_nome: string;
  cliente_nome: string;
  agente_id: number | null;
  agente_nome: string | null;
}

export interface PanoramaHoje {
  microTarefas: MicroTarefaItem[];
  entregasProximas: PanoramaItem[];
  novasDemandas: PanoramaItem[];
  aprovacoesPendentes: PanoramaItem[];
  clientesAguardando: PanoramaItem[];
  tarefasAtrasadas: PanoramaItem[];
}

export async function getPanoramaHoje(userId?: number): Promise<PanoramaHoje> {
  const session = await getSession();
  if (!session) throw new Error('Não autorizado');

  let query = `
    SELECT 
      pp.id AS projeto_id,
      pp.status AS projeto_status,
      pp.prioridade,
      pp.prazo,
      pp.tags,
      sc.nome AS servico_nome,
      sc.tipo AS servico_tipo,
      c.nome AS cliente_nome,
      (SELECT GROUP_CONCAT(u.nome SEPARATOR '|') FROM projeto_responsaveis pr JOIN usuarios u ON pr.usuario_id = u.id WHERE pr.projeto_id = pp.id) as responsaveis_nomes
    FROM projetos_producao pp
    INNER JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
    INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
    INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
    INNER JOIN clientes c ON ctr.cliente_id = c.id
  `;

  if (userId) {
    query += ` INNER JOIN projeto_responsaveis pr_filter ON pr_filter.projeto_id = pp.id AND pr_filter.usuario_id = ? `;
  }

  query += `
    WHERE pp.deleted_at IS NULL 
      AND ci.deleted_at IS NULL 
      AND ctr.status = 'Ativo'
      AND pp.status != 'Finalizado'
  `;

  const [rows] = await pool.query<RowDataPacket[]>(query, userId ? [userId] : []);

  const items: PanoramaItem[] = rows.map(row => {
    let tagsArr: string[] = [];
    if (row.tags) {
      if (typeof row.tags === 'string') {
        try { tagsArr = JSON.parse(row.tags); } catch (e) {}
      } else {
        tagsArr = row.tags;
      }
    }

    const resNomes = row.responsaveis_nomes ? row.responsaveis_nomes.split('|') : [];
    const iniciais = resNomes.map((n: string) => {
      const parts = n.trim().split(' ');
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return n.substring(0, 2).toUpperCase();
    });

    return {
      projeto_id: row.projeto_id,
      projeto_status: row.projeto_status,
      prioridade: row.prioridade,
      prazo: row.prazo,
      tags: tagsArr,
      servico_nome: row.servico_nome,
      servico_tipo: row.servico_tipo,
      cliente_nome: row.cliente_nome,
      responsaveis_iniciais: iniciais
    };
  });

  const hojeStr = new Date().toISOString().split('T')[0];
  const hojeDate = new Date(hojeStr);
  
  const inDays = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffTime = d.getTime() - hojeDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const tarefasAtrasadas = items.filter(i => {
    if (!i.prazo) return false;
    const diff = inDays(i.prazo);
    return diff < 0;
  });

  let queryMicro = `
    SELECT 
      tp.id AS tarefa_id,
      tp.titulo AS tarefa_titulo,
      tp.status AS tarefa_status,
      tp.usuario_id AS agente_id,
      u.nome AS agente_nome,
      pp.id AS projeto_id,
      pp.status AS projeto_status,
      pp.prioridade,
      pp.prazo,
      sc.nome AS servico_nome,
      c.nome AS cliente_nome
    FROM tarefas_producao tp
    INNER JOIN projetos_producao pp ON tp.projeto_producao_id = pp.id
    INNER JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
    INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
    INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
    INNER JOIN clientes c ON ctr.cliente_id = c.id
    LEFT JOIN usuarios u ON tp.usuario_id = u.id
    WHERE tp.status != 'Concluída' 
      AND pp.deleted_at IS NULL 
      AND ci.deleted_at IS NULL 
      AND ctr.status = 'Ativo'
      AND pp.status != 'Finalizado'
  `;

  if (userId) {
    queryMicro += ` AND tp.usuario_id = ? `;
  }

  const [rowsMicro] = await pool.query<RowDataPacket[]>(queryMicro, userId ? [userId] : []);
  const microTarefas = rowsMicro as MicroTarefaItem[];

  const entregasProximas = items.filter(i => {
    if (!i.prazo) return false;
    const diff = inDays(i.prazo);
    return diff > 0 && diff <= 7;
  });

  const novasDemandas = items.filter(i => i.projeto_status === 'Briefing' || i.projeto_status === 'Na Fila');
  const aprovacoesPendentes = items.filter(i => i.projeto_status === 'Aprovação Interna');
  const clientesAguardando = items.filter(i => i.projeto_status === 'Aguardando Cliente');

  return {
    microTarefas,
    entregasProximas,
    novasDemandas,
    aprovacoesPendentes,
    clientesAguardando,
    tarefasAtrasadas
  };
}
