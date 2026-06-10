import Link from 'next/link';
import { createCliente } from '@/actions/cliente';
import styles from '../clientes.module.css';

import { hasPermission } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function NovoClientePage() {
  if (!await hasPermission('clientes', 'full')) {
    redirect('/clientes');
  }

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Novo Cliente</h1>
          <p className="page-description">Cadastre um novo cliente no ERP.</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.formContainer}>
          <form action={createCliente}>
            <div className={styles.formGroup}>
              <label htmlFor="nome" className={styles.label}>Nome Completo *</label>
              <input type="text" id="nome" name="nome" className={styles.input} required placeholder="Ex: João da Silva" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email *</label>
              <input type="email" id="email" name="email" className={styles.input} required placeholder="joao@empresa.com" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telefone" className={styles.label}>Telefone</label>
              <input type="tel" id="telefone" name="telefone" className={styles.input} placeholder="(11) 99999-9999" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="empresa" className={styles.label}>Empresa</label>
              <input type="text" id="empresa" name="empresa" className={styles.input} placeholder="Nome da Empresa" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cnpj_cpf" className={styles.label}>CNPJ / CPF</label>
              <input type="text" id="cnpj_cpf" name="cnpj_cpf" className={styles.input} placeholder="00.000.000/0000-00" />
            </div>

            <div className={styles.formActions}>
              <Link href="/clientes" className={styles.secondaryButton}>
                Cancelar
              </Link>
              <button type="submit" className={styles.primaryButton}>
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
