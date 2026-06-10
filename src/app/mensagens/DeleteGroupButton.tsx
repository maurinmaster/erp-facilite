'use client';

import { useRouter } from 'next/navigation';
import { deletarGrupo } from '@/actions/mensagens';
import { useState } from 'react';

export default function DeleteGroupButton({ grupoId, nome }: { grupoId: number, nome: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${nome}"? Esta ação não pode ser desfeita e removerá todas as mensagens.`)) return;

    setIsDeleting(true);
    try {
      await deletarGrupo(grupoId);
      router.push('/mensagens');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar grupo');
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      title="Excluir Grupo"
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--danger)',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDeleting ? 0.5 : 1,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-light, rgba(239, 68, 68, 0.1))'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </button>
  );
}
