import Link from 'next/link';
import { getServicosComTemplates, deleteServicoCatalogo } from '@/actions/catalogo';
import styles from './catalogo.module.css';
import DeleteServiceButton from './DeleteServiceButton';
import { requireAdmin } from '@/actions/auth';
import { Pencil, Globe, Smartphone, Palette, TrendingUp, Search, Clapperboard, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getIconByTipo(tipo: string) {
  const t = tipo.toLowerCase();
  if (t.includes('site') || t.includes('web')) return <Globe size={24} color="var(--primary)" />;
  if (t.includes('social') || t.includes('mídia')) return <Smartphone size={24} color="var(--primary)" />;
  if (t.includes('design') || t.includes('identidade')) return <Palette size={24} color="var(--primary)" />;
  if (t.includes('campanha') || t.includes('tráfego') || t.includes('ads')) return <TrendingUp size={24} color="var(--primary)" />;
  if (t.includes('seo')) return <Search size={24} color="var(--primary)" />;
  if (t.includes('vídeo') || t.includes('edição')) return <Clapperboard size={24} color="var(--primary)" />;
  return <Package size={24} color="var(--primary)" />;
}

export default async function CatalogoPage() {
  const session = await requireAdmin(); // Somente Admin pode gerenciar catálogo
  const servicos = await getServicosComTemplates();

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Catálogo de Serviços</h1>
          <p className="page-description" style={{ marginTop: '4px' }}>
            Gerencie os serviços oferecidos, tipos de projeto e suas tarefas de produção padrão.
          </p>
        </div>
        <Link href="/catalogo/novo" className={styles.primaryButton}>
          + Novo Serviço
        </Link>
      </div>

      <div className={styles.catalogGrid}>
        {servicos.length === 0 ? (
          <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
            Nenhum serviço cadastrado no catálogo. Comece criando o seu primeiro serviço!
          </div>
        ) : (
          servicos.map((servico) => (
            <div key={servico.id} className={styles.serviceCard}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  {getIconByTipo(servico.tipo)}
                </div>
                
                <div className={styles.actions}>
                  <Link href={`/catalogo/${servico.id}/edit`} className={styles.actionBtn} title="Editar Serviço">
                    <Pencil size={16} />
                  </Link>
                  <form action={async () => { 'use server'; await deleteServicoCatalogo(servico.id); }}>
                    <DeleteServiceButton />
                  </form>
                </div>
              </div>
              
              <h2 className={styles.serviceName}>{servico.nome}</h2>
              <div className={styles.serviceType}>{servico.tipo}</div>
              
              <p className={styles.serviceDesc}>
                {servico.descricao || 'Sem descrição cadastrada para este serviço.'}
              </p>
              
              <div className={styles.tasksSection}>
                <div className={styles.tasksTitle}>
                  Tarefas Padrão
                  <span className={styles.taskBadge}>{servico.templates.length}</span>
                </div>
                
                <div className={styles.tasksList}>
                  {servico.templates.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhuma tarefa padrão.</span>
                  ) : (
                    servico.templates.map((t, idx) => (
                      <div key={idx} className={styles.taskItem}>
                        <span className={styles.taskDot}>•</span>
                        <span>{t}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
