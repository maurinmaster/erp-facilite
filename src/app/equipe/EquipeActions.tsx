'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteUsuario, updateSenhaUsuario, updatePerfilUsuario } from '@/actions/auth';

import styles from './equipe.module.css';

export default function EquipeActions({ usuarioId, isSelf, perfisValidos = ['Admin', 'Gestor', 'Operador'] }: { usuarioId: number, isSelf: boolean, perfisValidos?: string[] }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (isSelf) {
      alert("Você não pode deletar a si mesmo do sistema.");
      return;
    }
    const confirmou = confirm("Tem certeza que deseja remover este membro da equipe? O acesso dele será revogado imediatamente e ele não poderá mais fazer login.");
    
    if (confirmou) {
      setLoading(true);
      try {
        await deleteUsuario(usuarioId);
      } catch (e: any) {
        alert(e.message || "Erro ao remover usuário");
      }
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    const novaSenha = prompt("Digite a nova senha para este usuário:");
    if (novaSenha && novaSenha.trim().length >= 4) {
      setLoading(true);
      try {
        await updateSenhaUsuario(usuarioId, novaSenha.trim());
        alert("Senha atualizada com sucesso!");
      } catch (e: any) {
        alert(e.message || "Erro ao atualizar senha.");
      }
      setLoading(false);
    } else if (novaSenha) {
      alert("A senha deve ter pelo menos 4 caracteres.");
    }
  };

  const handleUpdatePerfil = async () => {
    const nomes = perfisValidos.join(', ');
    const novoPerfil = prompt(`Digite o novo perfil (${nomes}):`);
    if (novoPerfil) {
      const p = novoPerfil.trim();
      
      const formatado = perfisValidos.find(v => v.toLowerCase() === p.toLowerCase());
      
      if (formatado) {
        setLoading(true);
        try {
          await updatePerfilUsuario(usuarioId, formatado);
          alert("Perfil atualizado com sucesso!");
        } catch (e: any) {
          alert(e.message || "Erro ao atualizar perfil.");
        }
        setLoading(false);
      } else {
        alert(`Perfil inválido. Use apenas: ${nomes}.`);
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', opacity: loading ? 0.5 : 1, marginTop: '12px' }}>
      <Link 
        href={`/equipe/${usuarioId}`} 
        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
      >
        Desempenho
      </Link>
      <button 
        onClick={handleUpdatePerfil} 
        disabled={loading}
        className={styles.actionBtn}
      >
        Trocar Perfil
      </button>
      <button 
        onClick={handleUpdatePassword} 
        disabled={loading}
        className={styles.actionBtn}
      >
        Trocar Senha
      </button>
      {!isSelf && (
        <button 
          onClick={handleDelete} 
          disabled={loading}
          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
        >
          Remover Membro
        </button>
      )}
    </div>
  );
}
