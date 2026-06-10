import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import styles from './relatorios.module.css';
import { hasPermission } from '@/actions/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RelatoriosPage() {
  const canView = await hasPermission('relatorios', 'read');
  if (!canView) {
    redirect('/');
  }

  const relatorios = [
    {
      id: 'clientes',
      title: 'Relatório de Clientes',
      description: 'Visão geral de todos os clientes ativos e inativos',
      href: '/relatorios/clientes'
    },
    {
      id: 'entregas',
      title: 'Relatório de Entregas',
      description: 'Acompanhamento de entregas por período',
      href: '/relatorios/entregas'
    },
    {
      id: 'equipe',
      title: 'Relatório de Equipe',
      description: 'Performance individual e coletiva',
      href: '/relatorios/equipe'
    },
    {
      id: 'financeiro',
      title: 'Relatório Financeiro',
      description: 'Faturamento e renovações',
      href: '/relatorios/financeiro'
    },
    {
      id: 'aprovacoes',
      title: 'Relatório de Aprovações',
      description: 'Tempo médio de aprovação por cliente',
      href: '/relatorios/aprovacoes'
    },
    {
      id: 'processos',
      title: 'Relatório de Processos',
      description: 'Eficiência dos fluxos operacionais',
      href: '/relatorios/processos'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Relatórios</h1>
        <p className={styles.pageDescription}>Análises e métricas de desempenho da agência</p>
      </div>

      <div className={styles.grid}>
        {relatorios.map((relatorio) => (
          <Link key={relatorio.id} href={relatorio.href} className={styles.card}>
            <div className={styles.iconWrapper}>
              <BarChart3 size={16} strokeWidth={2.5} />
            </div>
            <h3 className={styles.cardTitle}>{relatorio.title}</h3>
            <p className={styles.cardDescription}>{relatorio.description}</p>
            <div className={styles.cardFooter}>
              Clique para visualizar o relatório completo
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
