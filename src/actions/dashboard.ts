'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getSession } from './auth';

export interface DashboardMetrics {
  totalClientes: number;
  receitaAtiva: number;
  projetosTotal: number;
  projetosConcluidosMensal: number;
  statusProducao: { name: string, value: number }[];
  projetosUrgentes: any[];
  recentLogs: any[];
  meusProjetos: any[];
  clientesPorServico: {name: string, value: number}[];
  entregasDaSemana: {name: string, value: number}[];
  pendenciasPorResponsavel: {name: string, value: number}[];
  clientesEmAndamento: {
    projeto_id: number;
    cliente_nome: string;
    contrato_status: string;
    servico_nome: string;
    kanban_status: string;
    responsavel_nome: string | null;
    total_tarefas: number;
    tarefas_concluidas: number;
  }[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const session = await getSession();
  const connection = await pool.getConnection();

  try {
    // 1. Total Clientes Ativos
    const [rowsClientes] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM clientes WHERE deleted_at IS NULL');
    const totalClientes = rowsClientes[0].total || 0;

    // 2. Receita Ativa (Contratos Ativos)
    const [rowsReceita] = await connection.query<RowDataPacket[]>(`
      SELECT SUM(ci.valor_fechado) as total 
      FROM contrato_itens ci 
      INNER JOIN contratos c ON ci.contrato_id = c.id 
      WHERE c.status = 'Ativo' AND ci.deleted_at IS NULL
    `);
    const receitaAtiva = Number(rowsReceita[0].total) || 0;

    // 3. Projetos Agrupados por Status
    const [rowsStatus] = await connection.query<RowDataPacket[]>(`
      SELECT status, COUNT(*) as count 
      FROM projetos_producao 
      WHERE deleted_at IS NULL 
      GROUP BY status
    `);
    
    const statusProducao = rowsStatus.map(r => ({ name: r.status as string, value: r.count as number }));
    let projetosTotal = 0;
    
    rowsStatus.forEach(row => {
      projetosTotal += row.count;
    });

    // 4. Concluídos (Total Histórico)
    const [rowsConcluidos] = await connection.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total 
      FROM projetos_producao 
      WHERE deleted_at IS NULL AND status = 'Finalizado' 
    `);
    const projetosConcluidosMensal = rowsConcluidos[0].total || 0;

    // 5. Projetos Urgentes (Tags contendo 'Urgente' ou prioridade alta)
    const [rowsUrgentes] = await connection.query<RowDataPacket[]>(`
      SELECT pp.id, pp.status, pp.prioridade, pp.tags, c.nome as cliente_nome, sc.nome as servico_nome
      FROM projetos_producao pp
      INNER JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
      INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
      INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
      INNER JOIN clientes c ON ctr.cliente_id = c.id
      WHERE pp.deleted_at IS NULL AND pp.status != 'Finalizado'
        AND (pp.tags LIKE '%Urgente%' OR pp.prioridade = 'Alta')
      ORDER BY pp.created_at ASC
      LIMIT 5
    `);

    // 6. Logs Recentes (Feed de Atividade)
    const [recentLogs] = await connection.query<RowDataPacket[]>(`
      SELECT l.id, l.acao, l.detalhes, l.criado_em as created_at, l.usuario_nome,
             c.nome as cliente_nome, sc.nome as servico_nome
      FROM logs_producao l
      LEFT JOIN projetos_producao pp ON l.projeto_id = pp.id
      LEFT JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
      LEFT JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
      LEFT JOIN contratos ctr ON ci.contrato_id = ctr.id
      LEFT JOIN clientes c ON ctr.cliente_id = c.id
      ORDER BY l.criado_em DESC
      LIMIT 8
    `);

    // 7. Meus Projetos
    let meusProjetos: any[] = [];
    if (session?.id) {
      const [rowsMeus] = await connection.query<RowDataPacket[]>(`
        SELECT pp.id, pp.status, pp.prioridade, c.nome as cliente_nome, sc.nome as servico_nome
        FROM projetos_producao pp
        INNER JOIN projeto_responsaveis pr ON pp.id = pr.projeto_id
        INNER JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
        INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
        INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
        INNER JOIN clientes c ON ctr.cliente_id = c.id
        WHERE pr.usuario_id = ? AND pp.deleted_at IS NULL AND pp.status != 'Finalizado'
        ORDER BY pp.created_at ASC
      `, [session.id]);
      meusProjetos = rowsMeus;
    }

    // 8. Clientes por Serviço
    const [rowsClientesServico] = await connection.query<RowDataPacket[]>(`
      SELECT sc.nome as name, COUNT(DISTINCT ctr.cliente_id) as value
      FROM contratos ctr
      INNER JOIN contrato_itens ci ON ctr.id = ci.contrato_id
      INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
      WHERE ctr.status = 'Ativo' AND ci.deleted_at IS NULL
      GROUP BY sc.nome
    `);
    const clientesPorServico = rowsClientesServico as {name: string, value: number}[];

    // 9. Pendências por Responsável
    const [rowsPendencias] = await connection.query<RowDataPacket[]>(`
      SELECT u.nome as name, COUNT(pr.projeto_id) as value
      FROM projeto_responsaveis pr
      INNER JOIN projetos_producao pp ON pr.projeto_id = pp.id
      INNER JOIN usuarios u ON pr.usuario_id = u.id
      WHERE pp.status != 'Finalizado' AND pp.deleted_at IS NULL
      GROUP BY u.nome
    `);
    const pendenciasPorResponsavel = rowsPendencias.map(r => ({ name: r.name.split(' ')[0], value: r.value }));

    // 10. Entregas da Semana (últimos 7 dias em dias da semana)
    const [rowsEntregas] = await connection.query<RowDataPacket[]>(`
      SELECT DATE(criado_em) as data, COUNT(DISTINCT projeto_id) as value
      FROM logs_producao
      WHERE detalhes LIKE '%Finalizado%' OR acao = 'FINALIZADO'
      AND criado_em >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(criado_em)
    `);
    
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const entregasMap = new Map();
    rowsEntregas.forEach(r => {
      // Ajuste de fuso horário local
      const d = new Date(r.data);
      const diaStr = dias[d.getUTCDay()];
      entregasMap.set(diaStr, (entregasMap.get(diaStr) || 0) + r.value);
    });
    
    const entregasDaSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map(d => ({
      name: d,
      value: entregasMap.get(d) || 0
    }));

    // 11. Clientes em Andamento
    const [rowsAndamento] = await connection.query<RowDataPacket[]>(`
      SELECT 
        pp.id as projeto_id, 
        c.nome as cliente_nome, 
        ctr.status as contrato_status, 
        sc.nome as servico_nome, 
        pp.status as kanban_status,
        (SELECT u.nome FROM projeto_responsaveis pr JOIN usuarios u ON pr.usuario_id = u.id WHERE pr.projeto_id = pp.id LIMIT 1) as responsavel_nome,
        (SELECT COUNT(*) FROM tarefas_producao tp WHERE tp.projeto_producao_id = pp.id AND tp.deleted_at IS NULL) as total_tarefas,
        (SELECT COUNT(*) FROM tarefas_producao tp WHERE tp.projeto_producao_id = pp.id AND tp.status = 'Concluída' AND tp.deleted_at IS NULL) as tarefas_concluidas
      FROM projetos_producao pp
      INNER JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
      INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
      INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
      INNER JOIN clientes c ON ctr.cliente_id = c.id
      WHERE pp.deleted_at IS NULL AND pp.status != 'Finalizado'
      ORDER BY pp.created_at DESC
      LIMIT 10
    `);
    const clientesEmAndamento = rowsAndamento as any[];

    return {
      totalClientes,
      receitaAtiva,
      projetosTotal,
      projetosConcluidosMensal,
      statusProducao,
      projetosUrgentes: rowsUrgentes,
      recentLogs: recentLogs,
      meusProjetos,
      clientesPorServico,
      entregasDaSemana,
      pendenciasPorResponsavel,
      clientesEmAndamento
    };
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    throw new Error('Falha ao processar dashboard');
  } finally {
    connection.release();
  }
}
