import { getServicoById } from '@/actions/catalogo';
import { getBriefingTemplates } from '@/actions/briefing';
import { notFound } from 'next/navigation';
import EditServiceForm from './EditServiceForm';
import { requireAdmin } from '@/actions/auth';

export const dynamic = 'force-dynamic';

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  
  const { id } = await params;
  const servicoId = parseInt(id, 10);
  
  if (isNaN(servicoId)) {
    notFound();
  }

  const servico = await getServicoById(servicoId);
  
  if (!servico) {
    notFound();
  }

  const briefingTemplates = await getBriefingTemplates();

  return (
    <div className="container">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Editar Serviço</h1>
        <p className="page-description">Altere os detalhes do serviço ou o checklist de tarefas padrão.</p>
      </div>
      
      <EditServiceForm servico={servico} briefingTemplates={briefingTemplates} />
    </div>
  );
}
