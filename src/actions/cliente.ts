'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { RowDataPacket } from 'mysql2';
import { hasPermission } from './auth';

export async function registrarLogCliente(clienteId: number, acao: string, detalhes: string) {
  // Hardcoded Admin for now
  const usuarioId = 1;
  const usuarioNome = 'Administrador / Sistema';
  try {
    await pool.query(
      'INSERT INTO logs_clientes (cliente_id, usuario_id, usuario_nome, acao, detalhes) VALUES (?, ?, ?, ?, ?)',
      [clienteId, usuarioId, usuarioNome, acao, detalhes]
    );
  } catch (e) {
    console.error('Erro ao registrar log do cliente:', e);
  }
}

export async function getLogsByCliente(clienteId: number) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, acao, detalhes, usuario_nome, criado_em 
       FROM logs_clientes 
       WHERE cliente_id = ? 
       ORDER BY criado_em DESC`,
      [clienteId]
    );
    return rows;
  } catch (error) {
    console.error('Erro ao buscar logs do cliente:', error);
    return [];
  }
}

export interface Cliente {
  id?: number;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cnpj_cpf: string;
  created_at?: string;
  
  // Campos de endereço adicionados
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  // Redes sociais
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

export async function getClientes(): Promise<Cliente[]> {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE deleted_at IS NULL ORDER BY created_at DESC');
    return rows as Cliente[];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

export async function createCliente(formData: FormData) {
  if (!await hasPermission('clientes', 'full')) {
    throw new Error('Acesso negado: você não tem permissão para editar clientes.');
  }

  const nome = formData.get('nome') as string;
  const email = formData.get('email') as string;
  const telefone = formData.get('telefone') as string;
  const empresa = formData.get('empresa') as string;
  const cnpj_cpf = formData.get('cnpj_cpf') as string;

  try {
    const [result] = await pool.query(
      'INSERT INTO clientes (nome, email, telefone, empresa, cnpj_cpf) VALUES (?, ?, ?, ?, ?)',
      [nome, email, telefone, empresa, cnpj_cpf]
    ) as any;
    
    await registrarLogCliente(result.insertId, 'CREATE', 'Cliente cadastrado no sistema');
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    throw new Error('Falha ao criar cliente');
  }

  revalidatePath('/clientes');
  redirect('/clientes');
}

export async function getClienteById(id: number): Promise<Cliente | null> {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ? AND deleted_at IS NULL', [id]);
    const clientes = rows as Cliente[];
    return clientes.length > 0 ? clientes[0] : null;
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
}

export async function updateEndereco(clienteId: number, formData: FormData) {
  if (!await hasPermission('clientes', 'full')) {
    throw new Error('Acesso negado: você não tem permissão para editar clientes.');
  }

  const cep = formData.get('cep') as string;
  const logradouro = formData.get('logradouro') as string;
  const numero = formData.get('numero') as string;
  const complemento = formData.get('complemento') as string;
  const bairro = formData.get('bairro') as string;
  const cidade = formData.get('cidade') as string;
  const estado = formData.get('estado') as string;

  try {
    await pool.query(
      `UPDATE clientes SET 
        cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?
       WHERE id = ?`,
      [cep, logradouro, numero, complemento, bairro, cidade, estado, clienteId]
    );
    await registrarLogCliente(clienteId, 'UPDATE', 'Atualizou as informações de endereço');
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    throw new Error('Falha ao atualizar endereço');
  }

  revalidatePath(`/clientes/${clienteId}`);
}

export async function updateRedesSociais(clienteId: number, formData: FormData) {
  if (!await hasPermission('clientes', 'full')) {
    throw new Error('Acesso negado: você não tem permissão para editar clientes.');
  }

  const instagram = formData.get('instagram') as string;
  const facebook = formData.get('facebook') as string;
  const linkedin = formData.get('linkedin') as string;

  try {
    await pool.query(
      `UPDATE clientes SET 
        instagram = ?, facebook = ?, linkedin = ?
       WHERE id = ?`,
      [instagram, facebook, linkedin, clienteId]
    );
    await registrarLogCliente(clienteId, 'UPDATE', 'Atualizou as redes sociais');
  } catch (error) {
    console.error('Erro ao atualizar redes sociais:', error);
    throw new Error('Falha ao atualizar redes sociais');
  }

  revalidatePath(`/clientes/${clienteId}`);
}

export async function deleteCliente(clienteId: number) {
  if (!await hasPermission('clientes', 'full')) {
    throw new Error('Acesso negado: você não tem permissão para excluir clientes.');
  }

  try {
    await pool.query('UPDATE clientes SET deleted_at = NOW() WHERE id = ?', [clienteId]);
    await registrarLogCliente(clienteId, 'DELETE_CLIENTE', 'Cliente enviado para a lixeira');
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    throw new Error('Falha ao deletar cliente');
  }

  revalidatePath('/clientes');
  redirect('/clientes');
}
