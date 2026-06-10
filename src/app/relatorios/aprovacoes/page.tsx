import { getRelatorioAprovacoes } from '@/actions/relatorios';
import { ArrowLeft, Clock, History, Timer, Snail } from 'lucide-react';
import Link from 'next/link';
import styles from './aprovacoes.module.css';

export const dynamic = 'force-dynamic';

export default async function RelatorioAprovacoesPage() {
  const relatorio = await getRelatorioAprovacoes();

  const getSpeedBadge = (tempo_ms: number) => {
    // Definir algumas regras de cores para ficar visual
    const dias = tempo_ms / (1000 * 60 * 60 * 24);
    if (dias > 3) return styles.danger; // Mais de 3 dias é demorado
    if (dias > 1) return styles.warning; // 1 a 3 dias é moderado
    return styles.success; // Menos de 1 dia é rápido
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Relatório de Aprovações</h1>
          <p>Tempo médio de resposta dos clientes nas validações</p>
        </div>
        <Link href="/relatorios" className={styles.backBtn}>
          <ArrowLeft size={16} /> Voltar aos Relatórios
        </Link>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon}`}>
            <Clock size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Tempo Médio Global</div>
            <div className={styles.cardValue}>{relatorio.tempo_medio_global}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.gray}`}>
            <History size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Ciclos de Aprovação Concluídos</div>
            <div className={styles.cardValue}>{relatorio.ciclos_totais}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.green}`}>
            <Timer size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Cliente Mais Rápido</div>
            <div className={styles.cardValue} title={relatorio.cliente_mais_rapido}>{relatorio.cliente_mais_rapido}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.red}`}>
            <Snail size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Cliente Mais Demorado</div>
            <div className={styles.cardValue} title={relatorio.cliente_mais_demorado}>{relatorio.cliente_mais_demorado}</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Ciclos de Aprovação</th>
              <th>Tempo Médio</th>
              <th>Status de Agilidade</th>
            </tr>
          </thead>
          <tbody>
            {relatorio.detalhes.map(cliente => (
              <tr key={cliente.cliente_id}>
                <td>
                  <strong>{cliente.cliente_nome}</strong>
                </td>
                <td>
                  {cliente.ciclos} ciclo(s) analisado(s)
                </td>
                <td>
                  <strong>{cliente.tempo_formatado}</strong>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${getSpeedBadge(cliente.tempo_medio_ms)}`}>
                    {getSpeedBadge(cliente.tempo_medio_ms) === styles.danger ? 'Demorado (>3 dias)' : 
                     getSpeedBadge(cliente.tempo_medio_ms) === styles.warning ? 'Moderado' : 'Ágil (<24h)'}
                  </span>
                </td>
              </tr>
            ))}
            {relatorio.detalhes.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Ainda não há dados suficientes de aprovações.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
