'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { hasPermission } from './auth';

export interface RelatorioClienteDetalhe {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  status: 'Ativo' | 'Inativo';
  quantidade_servicos_ativos: number;
  data_cadastro: string;
}

export interface RelatorioClientesResumo {
  total: number;
  ativos: number;
  inativos: number;
  com_servicos_ativos: number;
  detalhes: RelatorioClienteDetalhe[];
}

export async function getRelatorioClientes(): Promise<RelatorioClientesResumo> {
  if (!await hasPermission('relatorios', 'read')) {
    throw new Error('Acesso negado');
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        c.id, 
        c.nome, 
        c.email, 
        c.telefone, 
        c.deleted_at, 
        c.created_at,
        (SELECT COUNT(*) FROM contratos cont WHERE cont.cliente_id = c.id AND cont.status = 'Ativo') as qtd_contratos_ativos
      FROM clientes c
      ORDER BY c.nome ASC
    `);

    let total = 0;
    let ativos = 0;
    let inativos = 0;
    let com_servicos_ativos = 0;
    const detalhes: RelatorioClienteDetalhe[] = [];

    for (const row of rows) {
      total++;
      const isAtivo = row.deleted_at === null;
      if (isAtivo) ativos++;
      else inativos++;

      const qtd_servicos = Number(row.qtd_contratos_ativos) || 0;
      if (qtd_servicos > 0 && isAtivo) {
        com_servicos_ativos++;
      }

      detalhes.push({
        id: row.id,
        nome: row.nome,
        email: row.email,
        telefone: row.telefone || 'N/A',
        status: isAtivo ? 'Ativo' : 'Inativo',
        quantidade_servicos_ativos: qtd_servicos,
        data_cadastro: row.created_at
      });
    }

    return {
      total,
      ativos,
      inativos,
      com_servicos_ativos,
      detalhes
    };
  } catch (error) {
    console.error('Erro ao buscar relatório de clientes:', error);
    throw new Error('Falha ao gerar relatório');
  }
}

export interface RelatorioEntregaDetalhe {
  id: number;
  cliente: string;
  servico: string;
  data_entrega: string;
  prazo: string | null;
  prazo_interno: string | null;
  atrasado_na_entrega: boolean;
}

export interface RelatorioEntregasResumo {
  total_entregue: number;
  entregues_no_mes: number;
  em_andamento: number;
  atrasados: number;
  ultimas_entregas: RelatorioEntregaDetalhe[];
}

export async function getRelatorioEntregas(): Promise<RelatorioEntregasResumo> {
  if (!await hasPermission('relatorios', 'read')) {
    throw new Error('Acesso negado');
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.id as projeto_id,
        p.status as projeto_status,
        p.prazo as projeto_prazo,
        p.prazo_interno as projeto_prazo_interno,
        p.updated_at,
        s.nome as servico_nome,
        c.nome as cliente_nome
      FROM projetos_producao p
      JOIN contrato_itens ci ON p.contrato_item_id = ci.id
      JOIN contratos cont ON ci.contrato_id = cont.id
      JOIN clientes c ON cont.cliente_id = c.id
      JOIN servicos_catalogo s ON ci.servico_catalogo_id = s.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.updated_at DESC
    `);

    let total_entregue = 0;
    let entregues_no_mes = 0;
    let em_andamento = 0;
    let atrasados = 0;
    const ultimas_entregas: RelatorioEntregaDetalhe[] = [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (const row of rows) {
      const isFinalizado = row.projeto_status === 'Finalizado';
      const prazoDate = row.projeto_prazo ? new Date(row.projeto_prazo) : null;
      const updatedAtDate = new Date(row.updated_at);

      if (isFinalizado) {
        total_entregue++;
        if (updatedAtDate.getMonth() === currentMonth && updatedAtDate.getFullYear() === currentYear) {
          entregues_no_mes++;
        }

        // Se está finalizado, adicionamos à lista se for recente (limitado a 50 na UI, vamos pôr 20 aqui)
        if (ultimas_entregas.length < 20) {
          ultimas_entregas.push({
            id: row.projeto_id,
            cliente: row.cliente_nome,
            servico: row.servico_nome,
            data_entrega: row.updated_at,
            prazo: row.projeto_prazo,
            prazo_interno: row.projeto_prazo_interno,
            atrasado_na_entrega: prazoDate ? updatedAtDate > prazoDate : false
          });
        }
      } else {
        em_andamento++;
        // Se não está finalizado, verificar se o prazo já passou em relação a HOJE
        if (prazoDate && prazoDate < now) {
          atrasados++;
        }
      }
    }

    return {
      total_entregue,
      entregues_no_mes,
      em_andamento,
      atrasados,
      ultimas_entregas
    };
  } catch (error) {
    console.error('Erro ao buscar relatório de entregas:', error);
    throw new Error('Falha ao gerar relatório');
  }
}

export interface RelatorioEquipeDetalhe {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  projetos_atuais: number;
  tarefas_concluidas: number;
  subtarefas_concluidas: number;
  pontos_esforco: number;
  tarefas_no_prazo: number;
  tarefas_em_atraso: number;
}

export interface RelatorioEquipeResumo {
  total_membros: number;
  tarefas_concluidas_total: number;
  subtarefas_concluidas_total: number;
  projetos_alocados: number;
  pontos_esforco_total: number;
  tarefas_no_prazo_total: number;
  tarefas_em_atraso_total: number;
  detalhes: RelatorioEquipeDetalhe[];
}

export async function getRelatorioEquipe(): Promise<RelatorioEquipeResumo> {
  if (!await hasPermission('relatorios', 'read')) {
    throw new Error('Acesso negado');
  }

  try {
    const [usuarios] = await pool.query<RowDataPacket[]>('SELECT id, nome, email, perfil FROM usuarios ORDER BY nome ASC');
    
    const [tarefas] = await pool.query<RowDataPacket[]>(`
      SELECT 
        tp.usuario_id, 
        SUM(CASE WHEN tp.parent_id IS NULL THEN 1 ELSE 0 END) as tarefas_principais,
        SUM(CASE WHEN tp.parent_id IS NOT NULL THEN 1 ELSE 0 END) as subtarefas,
        SUM(CASE WHEN tp.complexidade = 'Baixa' THEN 1 
                 WHEN tp.complexidade = 'Alta' THEN 3 
                 ELSE 2 END) as pontos,
        SUM(CASE WHEN p.prazo_interno IS NOT NULL AND DATE(tp.concluido_em) > p.prazo_interno THEN 1 ELSE 0 END) as tarefas_atrasadas,
        SUM(CASE WHEN p.prazo_interno IS NULL OR DATE(tp.concluido_em) <= p.prazo_interno THEN 1 ELSE 0 END) as tarefas_no_prazo
      FROM tarefas_producao tp
      JOIN projetos_producao p ON tp.projeto_producao_id = p.id
      WHERE tp.status = 'Concluída' AND tp.deleted_at IS NULL AND tp.usuario_id IS NOT NULL
      GROUP BY tp.usuario_id
    `);

    const [projetos] = await pool.query<RowDataPacket[]>(`
      SELECT pr.usuario_id, COUNT(*) as count 
      FROM projeto_responsaveis pr
      JOIN projetos_producao p ON pr.projeto_id = p.id
      WHERE p.status != 'Finalizado' AND p.deleted_at IS NULL
      GROUP BY pr.usuario_id
    `);

    let total_membros = usuarios.length;
    let tarefas_concluidas_total = 0;
    let subtarefas_concluidas_total = 0;
    let projetos_alocados = 0;
    let pontos_esforco_total = 0;
    let tarefas_no_prazo_total = 0;
    let tarefas_em_atraso_total = 0;

    const mapTarefas: Record<number, { princ: number, sub: number, pts: number, no_prazo: number, atrasadas: number }> = {};
    for (const t of tarefas) {
      mapTarefas[t.usuario_id] = { 
        princ: Number(t.tarefas_principais), 
        sub: Number(t.subtarefas), 
        pts: Number(t.pontos),
        no_prazo: Number(t.tarefas_no_prazo),
        atrasadas: Number(t.tarefas_atrasadas)
      };
      tarefas_concluidas_total += Number(t.tarefas_principais);
      subtarefas_concluidas_total += Number(t.subtarefas);
      pontos_esforco_total += Number(t.pontos);
      tarefas_no_prazo_total += Number(t.tarefas_no_prazo);
      tarefas_em_atraso_total += Number(t.tarefas_atrasadas);
    }

    const mapProjetos: Record<number, number> = {};
    for (const p of projetos) {
      mapProjetos[p.usuario_id] = Number(p.count);
      projetos_alocados += Number(p.count);
    }

    const detalhes: RelatorioEquipeDetalhe[] = usuarios.map(u => {
      const tar = mapTarefas[u.id] || { princ: 0, sub: 0, pts: 0, no_prazo: 0, atrasadas: 0 };
      const proj = mapProjetos[u.id] || 0;
      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfil: u.perfil,
        projetos_atuais: proj,
        tarefas_concluidas: tar.princ,
        subtarefas_concluidas: tar.sub,
        pontos_esforco: tar.pts,
        tarefas_no_prazo: tar.no_prazo,
        tarefas_em_atraso: tar.atrasadas
      };
    });

    return {
      total_membros,
      tarefas_concluidas_total,
      subtarefas_concluidas_total,
      projetos_alocados,
      pontos_esforco_total,
      tarefas_no_prazo_total,
      tarefas_em_atraso_total,
      detalhes
    };
  } catch (error) {
    console.error('Erro ao buscar relatório da equipe:', error);
    throw new Error('Falha ao gerar relatório');
  }
}

export interface RelatorioAprovacaoDetalhe {
  cliente_id: number;
  cliente_nome: string;
  ciclos: number;
  tempo_total_ms: number;
  tempo_medio_ms: number;
  tempo_formatado: string;
}

export interface RelatorioAprovacoesResumo {
  tempo_medio_global: string;
  ciclos_totais: number;
  cliente_mais_rapido: string;
  cliente_mais_demorado: string;
  detalhes: RelatorioAprovacaoDetalhe[];
}

function formatDuration(ms: number): string {
  if (ms === 0) return 'N/A';
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'Menos de 1m';
}

export async function getRelatorioAprovacoes(): Promise<RelatorioAprovacoesResumo> {
  if (!await hasPermission('relatorios', 'read')) {
    throw new Error('Acesso negado');
  }

  try {
    const [logs] = await pool.query<RowDataPacket[]>(`
      SELECT 
        l.projeto_id, 
        l.criado_em, 
        l.detalhes,
        c.id as cliente_id,
        c.nome as cliente_nome
      FROM logs_producao l 
      JOIN projetos_producao p ON l.projeto_id = p.id 
      JOIN contrato_itens ci ON p.contrato_item_id = ci.id
      JOIN contratos cont ON ci.contrato_id = cont.id
      JOIN clientes c ON cont.cliente_id = c.id
      WHERE l.acao = 'STATUS_CHANGE'
      ORDER BY l.projeto_id ASC, l.criado_em ASC
    `);

    const clientStats: Record<number, { nome: string, ciclos: number, tempo_total: number }> = {};
    
    let currentProjetoId = null;
    let aguardandoSince: Date | null = null;
    let currentClienteId = null;
    const now = new Date();

    for (const log of logs) {
      if (!clientStats[log.cliente_id]) {
        clientStats[log.cliente_id] = { nome: log.cliente_nome, ciclos: 0, tempo_total: 0 };
      }

      if (log.projeto_id !== currentProjetoId) {
        if (aguardandoSince && currentClienteId !== null) {
          const dur = now.getTime() - aguardandoSince.getTime();
          clientStats[currentClienteId].ciclos++;
          clientStats[currentClienteId].tempo_total += dur;
        }
        currentProjetoId = log.projeto_id;
        currentClienteId = log.cliente_id;
        aguardandoSince = null;
      }

      if (log.detalhes.includes('Aguardando Cliente')) {
        aguardandoSince = new Date(log.criado_em);
      } else {
        if (aguardandoSince) {
          const dur = new Date(log.criado_em).getTime() - aguardandoSince.getTime();
          clientStats[log.cliente_id].ciclos++;
          clientStats[log.cliente_id].tempo_total += dur;
          aguardandoSince = null;
        }
      }
    }

    if (aguardandoSince && currentClienteId !== null) {
      const dur = now.getTime() - aguardandoSince.getTime();
      clientStats[currentClienteId].ciclos++;
      clientStats[currentClienteId].tempo_total += dur;
    }

    let ciclos_totais = 0;
    let tempo_total_global = 0;
    const detalhes: RelatorioAprovacaoDetalhe[] = [];

    for (const cid in clientStats) {
      const stat = clientStats[cid];
      if (stat.ciclos > 0) {
        ciclos_totais += stat.ciclos;
        tempo_total_global += stat.tempo_total;
        
        const media = Math.floor(stat.tempo_total / stat.ciclos);
        detalhes.push({
          cliente_id: Number(cid),
          cliente_nome: stat.nome,
          ciclos: stat.ciclos,
          tempo_total_ms: stat.tempo_total,
          tempo_medio_ms: media,
          tempo_formatado: formatDuration(media)
        });
      }
    }

    detalhes.sort((a, b) => b.tempo_medio_ms - a.tempo_medio_ms); // Demorado -> Rapido

    const tempo_medio_global = ciclos_totais > 0 ? formatDuration(Math.floor(tempo_total_global / ciclos_totais)) : 'N/A';
    const cliente_mais_demorado = detalhes.length > 0 ? detalhes[0].cliente_nome : 'N/A';
    const cliente_mais_rapido = detalhes.length > 0 ? detalhes[detalhes.length - 1].cliente_nome : 'N/A';

    return {
      tempo_medio_global,
      ciclos_totais,
      cliente_mais_demorado,
      cliente_mais_rapido,
      detalhes
    };

  } catch (error) {
    console.error('Erro ao buscar relatório de aprovações:', error);
    throw new Error('Falha ao gerar relatório');
  }
}
