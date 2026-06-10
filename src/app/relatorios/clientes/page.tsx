import { getRelatorioClientes } from '@/actions/relatorios';
import { ArrowLeft, Users, UserCheck, UserX, Briefcase } from 'lucide-react';
import Link from 'next/link';
import styles from './clientes.module.css';

export const dynamic = 'force-dynamic';

export default async function RelatorioClientesPage() {
  const relatorio = await getRelatorioClientes();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Relatório de Clientes</h1>
          <p>Visão geral de clientes ativos e inativos, e clientes com serviços ativos</p>
        </div>
        <Link href="/relatorios" className={styles.backBtn}>
          <ArrowLeft size={16} /> Voltar aos Relatórios
        </Link>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.gray}`}>
            <Users size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Total de Clientes</div>
            <div className={styles.cardValue}>{relatorio.total}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>
            <UserCheck size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Clientes Ativos</div>
            <div className={styles.cardValue}>{relatorio.ativos}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.red}`}>
            <UserX size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Clientes Inativos</div>
            <div className={styles.cardValue}>{relatorio.inativos}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.blue}`}>
            <Briefcase size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Com Serviços Ativos</div>
            <div className={styles.cardValue}>{relatorio.com_servicos_ativos}</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contato</th>
              <th>Status</th>
              <th>Serviços Ativos</th>
            </tr>
          </thead>
          <tbody>
            {relatorio.detalhes.map(cliente => (
              <tr key={cliente.id}>
                <td>
                  <strong>{cliente.nome}</strong><br/>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Membro desde {new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}</span>
                </td>
                <td>
                  {cliente.email}<br/>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cliente.telefone}</span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${cliente.status === 'Ativo' ? styles.ativo : styles.inativo}`}>
                    {cliente.status}
                  </span>
                </td>
                <td>
                  {cliente.quantidade_servicos_ativos} serviço(s)
                </td>
              </tr>
            ))}
            {relatorio.detalhes.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
