'use client';

import { useState } from 'react';
import { login } from '@/actions/auth';
import styles from './login.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    try {
      const res = await login(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: any) {
      // Falhas internas do servidor ou redirects
      if (err.message && err.message !== 'NEXT_REDIRECT') {
        setError('Erro interno do servidor.');
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.brand}>
          Facilite<span style={{ color: 'var(--text-main)' }}>ERP</span>
        </div>
        <p className={styles.subtitle}>Faça login para acessar o sistema da agência</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>E-mail</label>
            <input type="email" name="email" required className={styles.input} placeholder="admin@facilite.com" />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Senha</label>
            <input type="password" name="password" required className={styles.input} placeholder="••••••••" />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
