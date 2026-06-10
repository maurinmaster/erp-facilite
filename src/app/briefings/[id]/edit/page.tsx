import { getBriefingTemplateById } from '@/actions/briefing';
import { notFound } from 'next/navigation';
import EditBriefingForm from './EditBriefingForm';
import { requireGestor } from '@/actions/auth';
import styles from '../../../clientes/clientes.module.css';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditBriefingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireGestor();
  
  const { id } = await params;
  const templateId = parseInt(id, 10);
  
  if (isNaN(templateId)) {
    notFound();
  }

  const template = await getBriefingTemplateById(templateId);
  
  if (!template) {
    notFound();
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Editar Template de Briefing</h1>
          <p className="page-description">Altere o título ou as perguntas padrão deste briefing.</p>
        </div>
        <Link href="/briefings" className={styles.secondaryButton}>
          &larr; Voltar
        </Link>
      </div>
      
      <EditBriefingForm template={template} />
    </div>
  );
}
