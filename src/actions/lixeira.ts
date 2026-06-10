'use server';

import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from './auth';
import { registrarLogCliente } from './cliente';

/**
 * 1. Clientes Deletados
 */
export async function getDeletedClientes() {
  await requireAdmin();
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, nome, empresa, email, deleted_at FROM clientes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC');
    return rows;
  } catch (error) {
    console.error('Erro ao buscar clientes deletados:', error);
    return [];
  }
}

/**
 * 2. Projetos e Contratos Deletados
 * Como os projetos herdam dos itens de contrato, podemos mostrar o nome do serviço
 */
export async function getDeletedProjetos() {
  await requireAdmin();
  try {
    const query = `
      SELECT 
        ci.id AS item_id, 
        pp.id AS projeto_id,
        ci.deleted_at, 
        sc.nome AS servico_nome,
        c.nome AS cliente_nome,
        c.id AS cliente_id
      FROM contrato_itens ci
      INNER JOIN servicos_catalogo sc ON ci.servico_catalogo_id = sc.id
      INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
      INNER JOIN clientes c ON ctr.cliente_id = c.id
      LEFT JOIN projetos_producao pp ON pp.contrato_item_id = ci.id
      WHERE ci.deleted_at IS NOT NULL
      ORDER BY ci.deleted_at DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows;
  } catch (error) {
    console.error('Erro ao buscar projetos deletados:', error);
    return [];
  }
}

/**
 * 3. Usuários Deletados
 */
export async function getDeletedUsuarios() {
  await requireAdmin();
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, nome, email, perfil, deleted_at FROM usuarios WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC');
    return rows;
  } catch (error) {
    console.error('Erro ao buscar usuários deletados:', error);
    return [];
  }
}

/**
 * Funções de Restauração
 */

export async function restaurarCliente(id: number) {
  await requireAdmin();
  try {
    await pool.query('UPDATE clientes SET deleted_at = NULL WHERE id = ?', [id]);
    revalidatePath('/clientes');
    revalidatePath('/lixeira');
    return { success: true };
  } catch (error) {
    console.error('Erro ao restaurar cliente:', error);
    throw new Error('Falha ao restaurar cliente.');
  }
}

export async function restaurarProjeto(itemId: number, projetoId: number | null, clienteId: number) {
  await requireAdmin();
  try {
    await pool.query('UPDATE contrato_itens SET deleted_at = NULL WHERE id = ?', [itemId]);
    if (projetoId) {
      await pool.query('UPDATE projetos_producao SET deleted_at = NULL WHERE id = ?', [projetoId]);
    }
    
    // Opcional: log na timeline do cliente
    await registrarLogCliente(clienteId, 'RESTORE_CONTRATO', 'Restaurou um serviço/projeto da lixeira.');

    revalidatePath('/producao');
    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath('/lixeira');
    return { success: true };
  } catch (error) {
    console.error('Erro ao restaurar projeto:', error);
    throw new Error('Falha ao restaurar projeto.');
  }
}

export async function restaurarUsuario(id: number) {
  await requireAdmin();
  try {
    await pool.query('UPDATE usuarios SET deleted_at = NULL WHERE id = ?', [id]);
    revalidatePath('/equipe');
    revalidatePath('/lixeira');
    return { success: true };
  } catch (error) {
    console.error('Erro ao restaurar usuário:', error);
    throw new Error('Falha ao restaurar usuário.');
  }
}

export async function excluirPermanenteCliente(id: number) {
  await requireAdmin();
  try {
    // Apaga de verdade
    await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
    revalidatePath('/lixeira');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir cliente permanentemente:', error);
    throw new Error('Falha ao excluir cliente.');
  }
}

export async function excluirPermanenteProjeto(itemId: number, projetoId: number | null) {
  await requireAdmin();
  try {
    if (projetoId) {
      await pool.query('DELETE FROM projetos_producao WHERE id = ?', [projetoId]);
    }
    await pool.query('DELETE FROM contrato_itens WHERE id = ?', [itemId]);
    revalidatePath('/lixeira');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir projeto permanentemente:', error);
    throw new Error('Falha ao excluir projeto.');
  }
}

export async function excluirPermanenteUsuario(id: number) {
  await requireAdmin();
  try {
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    revalidatePath('/lixeira');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir usuário permanentemente:', error);
    throw new Error('Falha ao excluir usuário.');
  }
}
