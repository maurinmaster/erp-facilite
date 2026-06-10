import Link from 'next/link';
import VendaServicoForm from '../../novo/VendaServicoForm';
import { getItemContratoById } from '@/actions/producao';
import { getServicosComTemplates } from '@/actions/catalogo';
import { getClienteById } from '@/actions/cliente';
import styles from '../../../../clientes.module.css';

export const dynamic = 'force-dynamic';

export default async function EditarServicoPage({ params }: { params: Promise<{ id: string, itemId: string }> }) {
  const { id, itemId: itemIdStr } = await params;
  const clienteId = Number(id);
  const itemId = Number(itemIdStr);

  const [cliente, servicos, initialItem] = await Promise.all([
    getClienteById(clienteId),
    getServicosComTemplates(),
    getItemContratoById(itemId)
  ]);

  if (!cliente || !initialItem) {
    return <div className="container">Cliente ou Serviço não encontrado.</div>;
  }

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Editar Briefing de Serviço</h1>
          <p className="page-description">Alterando os detalhes do serviço vendido para {cliente.empresa || cliente.nome}</p>
        </div>
        <Link href={`/clientes/${clienteId}`} className={styles.secondaryButton}>
          &larr; Voltar
        </Link>
      </div>

      <VendaServicoForm 
        clienteId={clienteId} 
        servicosCatalogo={servicos} 
        initialItem={initialItem}
      />
    </div>
  );
}
