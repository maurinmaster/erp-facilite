import Link from 'next/link';
import { getBriefingTemplates, deleteBriefingTemplate } from '@/actions/briefing';
import { requireGestor } from '@/actions/auth';
import styles from '../catalogo/catalogo.module.css';
import { Pencil } from 'lucide-react';
import DeleteBriefingButton from './DeleteBriefingButton';

export const dynamic = 'force-dynamic';

export default async function BriefingsPage() {
  await requireGestor();
  
  const templates = await getBriefingTemplates();

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Templates de Briefing</h1>
          <p className="page-description" style={{ marginTop: '4px' }}>
            Gerencie as perguntas padrão que serão respondidas durante a contratação de cada serviço.
          </p>
        </div>
        <Link href="/briefings/novo" className={styles.primaryButton}>
          + Novo Template
        </Link>
      </div>

      <div className={styles.catalogGrid}>
        {templates.length === 0 ? (
          <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
            Nenhum template cadastrado. Comece criando o seu primeiro template de briefing!
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className={styles.serviceCard}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  📝
                </div>
                
                <div className={styles.actions}>
                  <Link href={`/briefings/${template.id}/edit`} className={styles.actionBtn} title="Editar Template">
                    <Pencil size={16} />
                  </Link>
                  <form action={async () => { 'use server'; await deleteBriefingTemplate(template.id); }}>
                    <DeleteBriefingButton />
                  </form>
                </div>
              </div>
              
              <h2 className={styles.serviceName}>{template.titulo}</h2>
              <div className={styles.serviceType}>{template.campos.length} CAMPOS</div>
              
              <div className={styles.tasksSection} style={{ marginTop: '16px' }}>
                <div className={styles.tasksTitle}>
                  Campos do Briefing
                </div>
                
                <div className={styles.tasksList}>
                  {template.campos.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum campo definido.</span>
                  ) : (
                    template.campos.map((campo, idx) => (
                      <div key={idx} className={styles.taskItem}>
                        <span className={styles.taskDot}>•</span>
                        <span>{campo}</span>
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
