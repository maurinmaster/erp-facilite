'use server';

import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { verifyPassword, hashPassword } from '@/lib/crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const secretKey = process.env.ENCRYPTION_KEY || 'facilite-erp-default-secret-key-32!';
const key = new TextEncoder().encode(secretKey);

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  perfil: string;
  foto_url?: string;
  permissoes?: Record<string, string>;
}

/**
 * Função de Login
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios' };
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM usuarios WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email]
  );

  if (rows.length === 0) {
    return { error: 'Credenciais inválidas' };
  }

  const user = rows[0];

  const isValid = verifyPassword(password, user.senha_hash);
  
  if (!isValid) {
    return { error: 'Credenciais inválidas' };
  }

  // Criar token JWT com Jose
  const token = await new SignJWT({
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);

  const cookiesInstance = await cookies();
  cookiesInstance.set('facilite_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 horas
  });

  // NÃO retorne nada aqui se houver redirecionamento! O redirect joga um erro especial que precisa propagar.

  redirect('/');
}

/**
 * Destruir Sessão (Logout)
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('facilite_session');
  redirect('/login');
}

/**
 * Recupera os dados da Sessão Atual
 */
export async function getSession(): Promise<Usuario | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('facilite_session')?.value;
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, key, {
      algorithms: ['HS256']
    });
    
    const user = payload as unknown as Usuario;
    
    // Fetch real-time permissions
    try {
      const [perfilRows] = await pool.query<RowDataPacket[]>(
        'SELECT permissoes FROM perfis WHERE nome = ? LIMIT 1',
        [user.perfil]
      );
      if (perfilRows.length > 0) {
        const rawPerms = perfilRows[0].permissoes;
        user.permissoes = typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms;
      } else {
        user.permissoes = {};
      }
    } catch (dbErr) {
      console.error('Erro ao buscar permissoes no getSession:', dbErr);
      user.permissoes = {};
    }

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Função utilitária para verificar permissões de forma genérica
 */
export async function hasPermission(modulo: string, nivelMinimo: 'read' | 'limited' | 'full' = 'read'): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.perfil === 'Admin') return true;
  if (!session.permissoes) return false;
  
  const perm = session.permissoes[modulo] || 'none';
  if (perm === 'full') return true;
  if (perm === 'limited' && (nivelMinimo === 'limited' || nivelMinimo === 'read')) return true;
  if (perm === 'read' && nivelMinimo === 'read') return true;
  
  return false;
}

/**
 * Verifica permissões no Servidor
 */
export async function requireGestor() {
  const session = await getSession();
  if (!session || (session.perfil !== 'Gestor' && session.perfil !== 'Admin')) {
    redirect('/'); // Redireciona operadores intrusos
  }
}

/**
 * Verifica permissão estrita de Admin
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.perfil !== 'Admin') {
    redirect('/');
  }
}

/**
 * ---- GESTÃO DE EQUIPE ----
 */

export async function getEquipe(): Promise<Usuario[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nome, email, telefone, perfil FROM usuarios WHERE deleted_at IS NULL ORDER BY nome ASC'
    );
    const equipe = rows as Usuario[];
    
    // Anexa a foto de perfil se o arquivo existir na pasta public/avatars
    const publicDir = path.join(process.cwd(), 'public', 'avatars');
    return equipe.map(user => {
      let foto_url = undefined;
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];
      for (const ext of extensions) {
        if (fs.existsSync(path.join(publicDir, `avatar_${user.id}.${ext}`))) {
          foto_url = `/avatars/avatar_${user.id}.${ext}`;
          break;
        }
      }
      return { ...user, foto_url };
    });
  } catch (error) {
    console.error('Erro ao buscar equipe:', error);
    return [];
  }
}

export async function uploadAvatar(usuarioId: number, formData: FormData) {
  const session = await getSession();
  if (!session || (session.id !== usuarioId && session.perfil !== 'Admin' && session.perfil !== 'Gestor')) {
    throw new Error('Sem permissão para alterar esta foto.');
  }

  const file = formData.get('file') as File;
  if (!file) throw new Error('Nenhum arquivo enviado.');

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    throw new Error('Formato de imagem inválido.');
  }

  const publicDir = path.join(process.cwd(), 'public', 'avatars');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Apaga as fotos antigas se existirem
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  for (const oldExt of extensions) {
    const oldPath = path.join(publicDir, `avatar_${usuarioId}.${oldExt}`);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  // Salva o novo arquivo
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(publicDir, `avatar_${usuarioId}.${ext}`), buffer);

  revalidatePath('/equipe');
}

export async function createMembroEquipe(formData: FormData) {
  // Apenas Admin pode criar membros
  await requireAdmin();

  const nome = formData.get('nome') as string;
  const email = formData.get('email') as string;
  const telefone = formData.get('telefone') as string;
  const senha = formData.get('senha') as string;
  const perfil = formData.get('perfil') as string;

  if (!nome || !email || !senha || !perfil) {
    throw new Error('Todos os campos são obrigatórios.');
  }

  const hashed = hashPassword(senha);

  try {
    await pool.query(
      'INSERT INTO usuarios (nome, email, telefone, senha_hash, perfil) VALUES (?, ?, ?, ?, ?)',
      [nome, email, telefone || null, hashed, perfil]
    );
    revalidatePath('/equipe');
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('E-mail já cadastrado no sistema.');
    }
    throw new Error('Erro ao cadastrar membro.');
  }

  // O redirect DEVE ficar fora do try/catch, pois o Next.js lança um erro interno NEXT_REDIRECT
  redirect('/equipe');
}

/**
 * Remover um membro
 */
export async function deleteUsuario(usuarioId: number) {
  await requireAdmin();
  try {
    await pool.query('UPDATE usuarios SET deleted_at = NOW() WHERE id = ?', [usuarioId]);
    revalidatePath('/equipe');
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    throw new Error('Falha ao remover usuário.');
  }
}

/**
 * Atualizar a senha de um membro
 */
export async function updateSenhaUsuario(usuarioId: number, novaSenha: string) {
  await requireAdmin();
  if (!novaSenha || novaSenha.length < 4) {
    throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
  }

  const hashed = hashPassword(novaSenha);
  try {
    await pool.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hashed, usuarioId]);
    revalidatePath('/equipe');
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    throw new Error('Falha ao atualizar a senha.');
  }
}

/**
 * Atualizar o perfil de um membro
 */
export async function updatePerfilUsuario(usuarioId: number, novoPerfil: string) {
  await requireAdmin();
  if (!['Admin', 'Gestor', 'Operador'].includes(novoPerfil)) {
    throw new Error('Perfil inválido.');
  }

  try {
    await pool.query('UPDATE usuarios SET perfil = ? WHERE id = ?', [novoPerfil, usuarioId]);
    revalidatePath('/equipe');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error('Falha ao atualizar o perfil.');
  }
}
