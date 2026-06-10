'use server';

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/crypto';
import fs from 'fs';
import path from 'path';
import { registrarLogCliente } from './cliente';
import { getSession, hasPermission } from './auth';
import { getConfig } from './configuracoes';

export interface PayloadAtivacaoServico {
  cliente_id: number;
  servico_catalogo_id: number;
  valor_fechado: number;
  dados_acordados: any; // O objeto JSON contendo o briefing flexível
}

async function registrarLog(projetoId: number, acao: string, detalhes: string) {
  // Temporary hardcoded Admin user until auth is fully integrated
  const usuarioId = 1;
  const usuarioNome = 'Administrador / Sistema';
  try {
    await pool.query(
      'INSERT INTO logs_producao (projeto_id, usuario_id, usuario_nome, acao, detalhes) VALUES (?, ?, ?, ?, ?)',
      [projetoId, usuarioId, usuarioNome, acao, detalhes]
    );
  } catch (e) {
    console.error('Erro ao registrar log:', e);
  }
}

/**
 * Fase 2: Action de Ativação do Serviço
 * Utiliza transação SQL para garantir a integridade da criação do contrato, projeto e tarefas.
 */
export async function ativarServico(payload: PayloadAtivacaoServico) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verificar se o cliente tem um contrato ativo, se não, criar um novo contrato
    const [contratosAtivos] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM contratos WHERE cliente_id = ? AND status = 'Ativo' LIMIT 1",
      [payload.cliente_id]
    );

    let contratoId: number;
    if (contratosAtivos.length > 0) {
      contratoId = contratosAtivos[0].id;
    } else {
      const [novoContrato] = await connection.query<ResultSetHeader>(
        "INSERT INTO contratos (cliente_id, data_assinatura) VALUES (?, CURDATE())",
        [payload.cliente_id]
      );
      contratoId = novoContrato.insertId;
    }

    // Criptografa as senhas se existirem
    if (payload.dados_acordados?.acessos && Array.isArray(payload.dados_acordados.acessos)) {
      payload.dados_acordados.acessos = payload.dados_acordados.acessos.map((acc: any) => {
        if (acc.senha) {
          acc.senha = encrypt(acc.senha);
        }
        return acc;
      });
    }

    // 2. Inserir em contrato_itens convertendo o objeto para JSON
    const [itemResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO contrato_itens (contrato_id, servico_catalogo_id, valor_fechado, dados_acordados) VALUES (?, ?, ?, ?)',
      [
        contratoId,
        payload.servico_catalogo_id,
        payload.valor_fechado,
        JSON.stringify(payload.dados_acordados)
      ]
    );
    const contratoItemId = itemResult.insertId;

    // 3. Criar automaticamente o registro do projeto de produção vinculado ao item
    const [projetoResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO projetos_producao (contrato_item_id, status, prioridade) VALUES (?, ?, ?)',
      [contratoItemId, 'Na Fila', 'Normal']
    );
    const projetoProducaoId = projetoResult.insertId;

    // 4. Buscar os templates de tarefas padrões para este serviço no catálogo (agora viram Checklists)
    const [templates] = await connection.query<RowDataPacket[]>(
      'SELECT titulo_tarefa FROM templates_tarefas WHERE servico_catalogo_id = ?',
      [payload.servico_catalogo_id]
    );

    // 5. Inserir as tarefas de produção (Checklist) em lote (Bulk Insert) se existirem templates
    if (templates.length > 0) {
      const taskValues = templates.map((t) => [projetoProducaoId, t.titulo_tarefa, 'Pendente']);
      
      await connection.query(
        'INSERT INTO tarefas_producao (projeto_producao_id, titulo, status) VALUES ?',
        [taskValues]
      );
    }

    // Confirma a transação
    await connection.commit();
    
    // Log
    await registrarLog(projetoProducaoId, 'CREATE', 'Projeto de produção criado a partir da venda do serviço');
    
    // Fetch service name
    const [scRows] = await pool.query<RowDataPacket[]>('SELECT nome FROM servicos_catalogo WHERE id = ?', [payload.servico_catalogo_id]);
    const scNome = scRows[0]?.nome || 'Serviço';
    await registrarLogCliente(payload.cliente_id, 'CREATE_CONTRATO', `Vendeu o serviço: ${scNome}`);

    revalidatePath(`/clientes/${payload.cliente_id}`);
    revalidatePath(`/producao`);
    return { success: true, projetoId: projetoProducaoId };

  } catch (error) {
    await connection.rollback();
    console.error('Erro na ativação de serviço (transação revertida):', error);
    throw new Error('Falha ao ativar serviço e criar projeto de produção.');
  } finally {
    connection.release();
  }
}

/**
 * Novo Kanban Avançado: Retorna os Projetos enriquecidos com checklist, responsáveis e comentários
 */
export async function getProjetosKanban() {
  try {
    const dias = await getConfig('dias_arquivamento_kanban', '15');
    const diasNumStr = parseInt(dias, 10);
    const diasNum = isNaN(diasNumStr) ? 15 : diasNumStr;
    console.log("DEBUG KANBAN DIAS:", dias, diasNum);

    const query = `
      SELECT 
        pp.id AS projeto_id,
        pp.status AS projeto_status,
        pp.prioridade,
        pp.prazo,
        pp.prazo_interno,
        pp.tags,
        ci.id AS contrato_item_id,
        ci.dados_acordados,
        sc.nome AS servico_nome,
        sc.tipo AS servico_tipo,
        c.nome AS cliente_nome
      FROM projetos_producao pp
      INNER JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
      INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
      INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
      INNER JOIN clientes c ON ctr.cliente_id = c.id
      WHERE pp.deleted_at IS NULL 
        AND ci.deleted_at IS NULL 
        AND ctr.status = 'Ativo'
        AND (pp.status != 'Finalizado' OR pp.updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY))
      ORDER BY pp.created_at DESC
    `;
    
    const [rows] = await pool.query<RowDataPacket[]>(query, [diasNum]);
    
    if (rows.length === 0) return [];

    const projetoIds = rows.map(r => r.projeto_id);

    // Busca Checklist
    const [checklistRows] = await pool.query<RowDataPacket[]>(
      `SELECT tp.id, tp.projeto_producao_id, tp.titulo, tp.status, tp.usuario_id, tp.complexidade, tp.parent_id, u.nome AS responsavel_nome 
       FROM tarefas_producao tp 
       LEFT JOIN usuarios u ON tp.usuario_id = u.id 
       WHERE tp.projeto_producao_id IN (?) AND tp.deleted_at IS NULL
       ORDER BY tp.created_at ASC`,
      [projetoIds]
    );

    // Busca Responsáveis
    const [responsaveisRows] = await pool.query<RowDataPacket[]>(
      `SELECT pr.projeto_id, u.id, u.nome 
       FROM projeto_responsaveis pr 
       INNER JOIN usuarios u ON pr.usuario_id = u.id 
       WHERE pr.projeto_id IN (?)`,
      [projetoIds]
    );

    // Busca Comentários
    const [comentariosRows] = await pool.query<RowDataPacket[]>(
      `SELECT cp.id, cp.projeto_id, cp.usuario_id, cp.comentario, cp.criado_em, cp.anexo_url, cp.anexo_nome, u.nome AS autor 
       FROM comentarios_producao cp 
       INNER JOIN usuarios u ON cp.usuario_id = u.id 
       WHERE cp.projeto_id IN (?)
       ORDER BY cp.criado_em ASC`,
      [projetoIds]
    );

    // Busca Logs
    const [logsRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, projeto_id, usuario_nome, acao, detalhes, criado_em 
       FROM logs_producao 
       WHERE projeto_id IN (?)
       ORDER BY criado_em DESC`,
      [projetoIds]
    );

    const projetos = rows.map((row) => {
      let briefing = row.dados_acordados;
      if (typeof briefing === 'string') {
        try { briefing = JSON.parse(briefing); } catch (e) {}
      }

      if (briefing?.acessos && Array.isArray(briefing.acessos)) {
        briefing.acessos = briefing.acessos.map((acc: any) => {
          if (acc.senha) acc.senha = decrypt(acc.senha);
          return acc;
        });
      }

      let tagsArr = [];
      if (row.tags) {
        if (typeof row.tags === 'string') {
          try { tagsArr = JSON.parse(row.tags); } catch (e) {}
        } else {
          tagsArr = row.tags;
        }
      }

      const checklist = checklistRows.filter(c => c.projeto_producao_id === row.projeto_id);
      
      const publicDir = path.join(process.cwd(), 'public', 'avatars');
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];
      
      const responsaveis = responsaveisRows.filter(r => r.projeto_id === row.projeto_id).map((r: any) => {
        let foto_url = undefined;
        for (const ext of extensions) {
          if (fs.existsSync(path.join(publicDir, `avatar_${r.id}.${ext}`))) {
            foto_url = `/avatars/avatar_${r.id}.${ext}`;
            break;
          }
        }
        return { ...r, foto_url };
      });
      const comentarios = comentariosRows.filter(c => c.projeto_id === row.projeto_id).map((c: any) => {
        let foto_url = undefined;
        // c.autor_id must be fetched in the query. Let's make sure it is.
        for (const ext of extensions) {
          if (fs.existsSync(path.join(publicDir, `avatar_${c.autor_id || c.usuario_id}.${ext}`))) {
            foto_url = `/avatars/avatar_${c.autor_id || c.usuario_id}.${ext}`;
            break;
          }
        }
        return { ...c, foto_url };
      });
      const logs = logsRows.filter(l => l.projeto_id === row.projeto_id);

      return {
        projeto_id: row.projeto_id,
        projeto_status: row.projeto_status,
        prioridade: row.prioridade,
        prazo: row.prazo,
        prazo_interno: row.prazo_interno,
        tags: tagsArr,
        contrato_item_id: row.contrato_item_id,
        servico_nome: row.servico_nome,
        servico_tipo: row.servico_tipo,
        cliente_nome: row.cliente_nome,
        dados_acordados: briefing,
        checklist,
        responsaveis,
        comentarios,
        logs
      };
    });

    return projetos;
  } catch (error) {
    console.error('Erro ao listar projetos do Kanban:', error);
    return [];
  }
}

/**
 * Ações de Alteração do Kanban
 */
export async function updateProjetoStatus(projetoId: number, novoStatus: string) {
  const session = await getSession();

  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT status FROM projetos_producao WHERE id = ?', [projetoId]);
    const statusAtual = rows[0]?.status;

    if (statusAtual === 'Aprovação Interna') {
      const canApprove = await hasPermission('aprovar_projetos', 'full');
      if (!canApprove) {
        throw new Error('Você não tem permissão para mover um projeto da Aprovação Interna.');
      }
    }

    await pool.query('UPDATE projetos_producao SET status = ? WHERE id = ?', [novoStatus, projetoId]);
    await registrarLog(projetoId, 'UPDATE_STATUS', `Status alterado de "${statusAtual}" para "${novoStatus}"`);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
}

export async function addComentario(formData: FormData) {
  try {
    const projetoId = Number(formData.get('projetoId'));
    const usuarioId = Number(formData.get('usuarioId'));
    const comentario = formData.get('comentario') as string;
    const anexo = formData.get('anexo') as File | null;

    let anexo_url = null;
    let anexo_nome = null;

    if (anexo && anexo.size > 0) {
      const bytes = await anexo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'producao');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Evita colisão de nomes
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + '-' + anexo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, buffer);
      
      anexo_url = `/uploads/producao/${filename}`;
      anexo_nome = anexo.name;
    }

    await pool.query(
      'INSERT INTO comentarios_producao (projeto_id, usuario_id, comentario, anexo_url, anexo_nome) VALUES (?, ?, ?, ?, ?)', 
      [projetoId, usuarioId, comentario, anexo_url, anexo_nome]
    );
    
    // Parse de Menções (@PrimeiroNome)
    try {
      const { criarNotificacao } = await import('./notificacoes');
      const [users] = await pool.query<RowDataPacket[]>('SELECT id, nome FROM usuarios WHERE deleted_at IS NULL');
      
      for (const u of users) {
        const primeiroNome = u.nome.split(' ')[0];
        // Regex para checar menção (@Nome) ignorando caixa alta/baixa
        const regex = new RegExp(`@${primeiroNome}\\b`, 'i');
        const plainText = comentario.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        if (regex.test(comentario) && u.id !== usuarioId) {
          await criarNotificacao({
            usuario_id: u.id,
            remetente_id: usuarioId,
            tipo: 'MENCAO',
            titulo: 'Você foi mencionado em um projeto',
            mensagem: plainText.substring(0, 80) + (plainText.length > 80 ? '...' : ''),
            link: `/producao?projeto_id=${projetoId}`
          });
        }
      }
    } catch (err) {
      console.error('Erro ao processar menções:', err);
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    throw new Error('Falha ao adicionar comentário.');
  }
}

export async function assignResponsavel(projetoId: number, usuarioId: number) {
  try {
    // Insere ou ignora (se já existir)
    await pool.query('INSERT IGNORE INTO projeto_responsaveis (projeto_id, usuario_id) VALUES (?, ?)', [projetoId, usuarioId]);
    
    const [uRows] = await pool.query<RowDataPacket[]>('SELECT nome FROM usuarios WHERE id = ?', [usuarioId]);
    const uNome = uRows[0]?.nome || 'Usuário';
    await registrarLog(projetoId, 'ASSIGN', `Atribuiu a tarefa para: ${uNome}`);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atribuir responsável:', error);
    throw new Error('Falha ao atribuir responsável.');
  }
}

export async function removeResponsavel(projetoId: number, usuarioId: number) {
  try {
    const [uRows] = await pool.query<RowDataPacket[]>('SELECT nome FROM usuarios WHERE id = ?', [usuarioId]);
    const uNome = uRows[0]?.nome || 'Usuário';

    await pool.query('DELETE FROM projeto_responsaveis WHERE projeto_id = ? AND usuario_id = ?', [projetoId, usuarioId]);
    
    await registrarLog(projetoId, 'UNASSIGN', `Removeu o usuário: ${uNome}`);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover responsável:', error);
    throw new Error('Falha ao remover responsável.');
  }
}

export async function updateProjetoConfig(projetoId: number, config: { prioridade?: string, prazo?: string | null, prazo_interno?: string | null, tags?: string[] }) {
  try {
    const updates = [];
    const values = [];
    if (config.prioridade) {
      updates.push('prioridade = ?');
      values.push(config.prioridade);
    }
    if (config.prazo !== undefined) { // Pode ser null para remover o prazo
      updates.push('prazo = ?');
      values.push(config.prazo);
    }
    if (config.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(config.tags));
    }
    if (config.prazo_interno !== undefined) {
      updates.push('prazo_interno = ?');
      values.push(config.prazo_interno);
    }
    
    if (updates.length > 0) {
      values.push(projetoId);
      await pool.query(`UPDATE projetos_producao SET ${updates.join(', ')} WHERE id = ?`, values);
      
      const parts = [];
      if (config.prioridade) parts.push(`Prioridade para ${config.prioridade}`);
      if (config.prazo !== undefined) parts.push(config.prazo ? `Prazo para ${config.prazo}` : `Removeu o prazo`);
      if (config.prazo_interno !== undefined) parts.push(config.prazo_interno ? `Prazo Interno para ${config.prazo_interno}` : `Removeu o prazo interno`);
      if (config.tags !== undefined) parts.push(`Tags atualizadas`);
      
      await registrarLog(projetoId, 'CONFIG_CHANGE', `Atualizou: ${parts.join(', ')}`);

      revalidatePath('/', 'layout');
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar config do projeto:', error);
    throw new Error('Falha ao atualizar projeto.');
  }
}

export async function updateChecklistStatus(tarefaId: number, status: string) {
  try {
    const [tRows] = await pool.query<RowDataPacket[]>('SELECT id, projeto_producao_id, titulo, parent_id FROM tarefas_producao WHERE id = ?', [tarefaId]);
    if (tRows.length === 0) return { success: false };
    
    const tarefa = tRows[0];

    if (status === 'Concluída') {
      await pool.query('UPDATE tarefas_producao SET status = ?, concluido_em = NOW() WHERE id = ?', [status, tarefaId]);
    } else {
      await pool.query('UPDATE tarefas_producao SET status = ?, concluido_em = NULL WHERE id = ?', [status, tarefaId]);
    }
    
    // Auto-complete parent task logic
    if (tarefa.parent_id) {
      const [siblings] = await pool.query<RowDataPacket[]>('SELECT status FROM tarefas_producao WHERE parent_id = ? AND deleted_at IS NULL', [tarefa.parent_id]);
      const allCompleted = siblings.length > 0 && siblings.every(s => s.status === 'Concluída');
      if (allCompleted) {
        await pool.query('UPDATE tarefas_producao SET status = ?, concluido_em = NOW() WHERE id = ?', ['Concluída', tarefa.parent_id]);
      } else {
        await pool.query('UPDATE tarefas_producao SET status = ?, concluido_em = NULL WHERE id = ?', ['Pendente', tarefa.parent_id]);
      }
    }
    
    const pId = tarefa.projeto_producao_id;
    await registrarLog(pId, 'CHECKLIST_STATUS', `Marcou a tarefa "${tarefa.titulo}" como ${status}`);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    throw new Error('Falha ao atualizar checklist.');
  }
}

export async function assignChecklistItem(tarefaId: number, usuarioId: number | null) {
  try {
    await pool.query('UPDATE tarefas_producao SET usuario_id = ? WHERE id = ?', [usuarioId, tarefaId]);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Erro ao atribuir item do checklist:', error);
    throw new Error('Falha ao atribuir item do checklist');
  }
}

export async function addChecklistItem(projetoId: number, titulo: string, usuarioId?: number, complexidade: string = 'Normal', parentId: number | null = null) {
  try {
    const uId = usuarioId || null;
    await pool.query(
      'INSERT INTO tarefas_producao (projeto_producao_id, titulo, usuario_id, complexidade, parent_id) VALUES (?, ?, ?, ?, ?)', 
      [projetoId, titulo, uId, complexidade, parentId]
    );

    let assignedMsg = '';
    if (uId) {
      const [uRows] = await pool.query<RowDataPacket[]>('SELECT nome FROM usuarios WHERE id = ?', [uId]);
      assignedMsg = ` e atribuiu a ${uRows[0]?.nome || 'Usuário'}`;
    }

    await registrarLog(projetoId, 'CHECKLIST_ADD', `Adicionou a tarefa: "${titulo}"${assignedMsg}`);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar checklist:', error);
    throw new Error('Falha ao adicionar checklist.');
  }
}

export async function deleteChecklistItem(tarefaId: number) {
  try {
    const [tRows] = await pool.query<RowDataPacket[]>('SELECT projeto_producao_id, titulo FROM tarefas_producao WHERE id = ?', [tarefaId]);
    await pool.query('UPDATE tarefas_producao SET deleted_at = NOW() WHERE id = ?', [tarefaId]);
    
    if (tRows.length > 0) {
      const pId = tRows[0].projeto_producao_id;
      await registrarLog(pId, 'CHECKLIST_DELETE', `Excluiu a tarefa "${tRows[0].titulo}"`);
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir checklist:', error);
    throw new Error('Falha ao excluir checklist.');
  }
}

/**
 * Funções Auxiliares antigas e mantidas para o Frontend
 */

export interface ServicoCatalogo {
  id: number;
  nome: string;
  tipo: string;
  descricao: string;
}

export async function getServicosCatalogo(): Promise<ServicoCatalogo[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM servicos_catalogo ORDER BY nome ASC');
    return rows as ServicoCatalogo[];
  } catch (error) {
    console.error('Erro ao buscar catálogo de serviços:', error);
    return [];
  }
}

export async function getItensContratoByCliente(clienteId: number) {
  try {
    const query = `
      SELECT 
        ci.id AS item_id,
        ci.valor_fechado,
        ci.criado_em,
        sc.nome AS servico_nome,
        sc.tipo AS servico_tipo,
        pp.status AS projeto_status
      FROM contrato_itens ci
      INNER JOIN contratos c ON ci.contrato_id = c.id
      INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
      LEFT JOIN projetos_producao pp ON pp.contrato_item_id = ci.id
      WHERE c.cliente_id = ? AND ci.deleted_at IS NULL
      ORDER BY ci.criado_em DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [clienteId]);
    return rows;
  } catch (error) {
    console.error('Erro ao buscar itens do contrato:', error);
    return [];
  }
}

export async function getItemContratoById(itemId: number) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, servico_catalogo_id, valor_fechado, dados_acordados FROM contrato_itens WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [itemId]
    );
    
    if (rows.length === 0) return null;
    const item = rows[0];

    let briefing = item.dados_acordados;
    if (typeof briefing === 'string') {
      try { briefing = JSON.parse(briefing); } catch (e) {}
    }

    if (briefing?.acessos && Array.isArray(briefing.acessos)) {
      briefing.acessos = briefing.acessos.map((acc: any) => {
        if (acc.senha) acc.senha = decrypt(acc.senha);
        return acc;
      });
    }
    
    item.dados_acordados = briefing;
    return item;
  } catch (error) {
    console.error('Erro ao buscar item do contrato por ID:', error);
    return null;
  }
}

export async function updateItemContrato(itemId: number, payload: { servico_catalogo_id: number, valor_fechado: number, dados_acordados: any, cliente_id: number }) {
  try {
    const { servico_catalogo_id, valor_fechado, dados_acordados, cliente_id } = payload;
    
    if (dados_acordados?.acessos && Array.isArray(dados_acordados.acessos)) {
      dados_acordados.acessos = dados_acordados.acessos.map((acc: any) => {
        if (acc.senha) acc.senha = encrypt(acc.senha);
        return acc;
      });
    }

    await pool.query(
      'UPDATE contrato_itens SET servico_catalogo_id = ?, valor_fechado = ?, dados_acordados = ? WHERE id = ?',
      [servico_catalogo_id, valor_fechado, JSON.stringify(dados_acordados), itemId]
    );
    
    revalidatePath(`/clientes/${cliente_id}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar item do contrato:', error);
    throw new Error('Falha ao atualizar serviço contratado.');
  }
}

export async function deleteItemContrato(itemId: number, clienteId: number) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT sc.nome FROM contrato_itens ci 
      INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id 
      WHERE ci.id = ?`, [itemId]);
    const scNome = rows[0]?.nome || 'Serviço';

    await pool.query('UPDATE contrato_itens SET deleted_at = NOW() WHERE id = ?', [itemId]);
    await pool.query('UPDATE projetos_producao SET deleted_at = NOW() WHERE contrato_item_id = ?', [itemId]);
    
    await registrarLogCliente(clienteId, 'DELETE_CONTRATO', `Excluiu o serviço contratado: ${scNome}`);

    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath(`/producao`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir item de contrato:', error);
    throw new Error('Falha ao excluir serviço.');
  }
}
