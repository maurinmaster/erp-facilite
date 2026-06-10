import Link from 'next/link';
import { getClientes } from '@/actions/cliente';
import styles from './clientes.module.css';

import { hasPermission } from '@/actions/auth';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const clientes = await getClientes();
  const hasPermissoesClientesFull = await hasPermission('clientes', 'full');

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-description">Gerencie os clientes da sua agência.</p>
        </div>
        {hasPermissoesClientesFull && (
          <Link href="/clientes/novo" className={styles.primaryButton}>
            + Novo Cliente
          </Link>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Nome</th>
                <th>CNPJ / CPF</th>
                <th>Email</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.emptyState}>
                      Nenhum cliente cadastrado ainda.
                    </div>
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.empresa || '-'}</td>
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/clientes/${cliente.id}`} style={{ color: 'var(--primary)' }}>
                        {cliente.nome}
                      </Link>
                    </td>
                    <td>{cliente.cnpj_cpf || '-'}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.telefone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
