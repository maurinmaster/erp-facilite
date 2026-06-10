import { getRelatorioEquipe } from '@/actions/relatorios';
import { ArrowLeft, Users, Briefcase, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import styles from './equipe.module.css';

export const dynamic = 'force-dynamic';

export default async function RelatorioEquipePage() {
  const relatorio = await getRelatorioEquipe();

  const getBadgeClass = (perfil: string) => {
    if (perfil === 'Admin') return styles.Admin;
    if (perfil === 'Gestor') return styles.Gestor;
    if (perfil === 'Operador') return styles.Operador;
    return styles.other;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Relatório de Equipe</h1>
          <p>Performance individual e métricas de produtividade</p>
        </div>
        <Link href="/relatorios" className={styles.backBtn}>
          <ArrowLeft size={16} /> Voltar aos Relatórios
        </Link>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.blue}`}>
            <Users size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Total de Membros</div>
            <div className={styles.cardValue}>{relatorio.total_membros}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon}`}>
            <CheckSquare size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Tarefas Concluídas (Geral)</div>
            <div className={styles.cardValue}>{relatorio.tarefas_concluidas_total}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.cardIcon} ${styles.purple}`}>
            <Briefcase size={24} />
          </div>
          <div className={styles.cardInfo}>
            <div className={styles.cardLabel}>Projetos Atuais Alocados</div>
            <div className={styles.cardValue}>{relatorio.projetos_alocados}</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Perfil</th>
              <th>Projetos Atuais na Mão</th>
              <th>Tarefas do Checklist Concluídas</th>
            </tr>
          </thead>
          <tbody>
            {relatorio.detalhes.map(membro => (
              <tr key={membro.id}>
                <td>
                  <strong>{membro.nome}</strong><br/>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{membro.email}</span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${getBadgeClass(membro.perfil)}`}>
                    {membro.perfil}
                  </span>
                </td>
                <td>
                  <strong>{membro.projetos_atuais}</strong> projeto(s)
                </td>
                <td>
                  <strong>{membro.tarefas_concluidas}</strong> tarefa(s)
                </td>
              </tr>
            ))}
            {relatorio.detalhes.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum colaborador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
