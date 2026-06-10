import { getRelatorioEntregas } from '@/actions/relatorios';
import { ArrowLeft, PackageCheck, CalendarCheck, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import styles from './entregas.module.css';

export const dynamic = 'force-dynamic';

export default async function RelatorioEntregasPage() {
  const relatorio = await getRelatorioEntregas();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Relatório de Entregas</h1>
          <p>Acompanhamento de entregas finalizadas e andamento da produção</p>
        </div>
        <Link href="/relatorios" className={styles.backBtn}>
          <ArrowLeft size={16} /> Voltar aos Relatórios
        </Link>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>
            <PackageCheck size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Total Entregue</div>
            <div className={styles.cardValue}>{relatorio.total_entregue}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.blue}`}>
            <CalendarCheck size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Entregues no Mês</div>
            <div className={styles.cardValue}>{relatorio.entregues_no_mes}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.orange}`}>
            <Clock size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Em Andamento</div>
            <div className={styles.cardValue}>{relatorio.em_andamento}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.red}`}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Atrasados</div>
            <div className={styles.cardValue}>{relatorio.atrasados}</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Projeto / Serviço</th>
              <th>Cliente</th>
              <th>Status do Prazo</th>
              <th>Data de Entrega</th>
            </tr>
          </thead>
          <tbody>
            {relatorio.ultimas_entregas.map(entrega => (
              <tr key={entrega.id}>
                <td>
                  <strong>{entrega.servico}</strong>
                </td>
                <td>
                  {entrega.cliente}
                </td>
                <td>
                  {entrega.atrasado_na_entrega ? (
                    <span className={`${styles.statusBadge} ${styles.danger}`}>Entregue com Atraso</span>
                  ) : (
                    <span className={`${styles.statusBadge} ${styles.success}`}>No Prazo</span>
                  )}
                </td>
                <td>
                  {new Date(entrega.data_entrega).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
            {relatorio.ultimas_entregas.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum projeto finalizado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
