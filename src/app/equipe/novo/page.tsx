'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createMembroEquipe } from '@/actions/auth';
import styles from '../equipe.module.css';

export default function NovoMembroPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    try {
      await createMembroEquipe(formData);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar membro.');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Novo Membro</h1>
          <p className="page-description">Adicione um novo usuário ao sistema</p>
        </div>
        <Link href="/equipe" className={styles.secondaryButton}>
          &larr; Voltar
        </Link>
      </div>

      <div className={styles.formCard}>
        {error && <div style={{ color: 'red', marginBottom: '16px', background: '#ffebee', padding: '12px', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome Completo</label>
            <input type="text" name="nome" required className={styles.input} placeholder="Ex: João Silva" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>E-mail (Login)</label>
            <input type="email" name="email" required className={styles.input} placeholder="joao@facilite.com" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Telefone</label>
            <input type="tel" name="telefone" className={styles.input} placeholder="(11) 99999-9999" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Senha Inicial</label>
            <input type="text" name="senha" required className={styles.input} placeholder="senha forte" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Perfil de Acesso</label>
            <select name="perfil" className={styles.input} required defaultValue="Operador">
              <option value="Operador">Operador (Acesso Produção e Visualização)</option>
              <option value="Gestor">Gestor (Acesso Comercial e Contratos)</option>
              <option value="Admin">Admin (Acesso Total e Gestão da Equipe)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className={styles.primaryButton} disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
