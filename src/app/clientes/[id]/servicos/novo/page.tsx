import { notFound } from 'next/navigation';
import { getClienteById } from '@/actions/cliente';
import { getServicosComTemplates } from '@/actions/catalogo';
import Link from 'next/link';
import VendaServicoForm from './VendaServicoForm';
import styles from '../../../clientes.module.css';

export const dynamic = 'force-dynamic';

export default async function NovoServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clienteId = parseInt(id, 10);
  
  if (isNaN(clienteId)) {
    notFound();
  }

  const cliente = await getClienteById(clienteId);
  if (!cliente) {
    notFound();
  }

  const servicosCatalogo = await getServicosComTemplates();

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Vender Serviço</h1>
          <p className="page-description">
            Cliente: <strong>{cliente.nome}</strong>
          </p>
        </div>
        <Link href={`/clientes/${clienteId}`} className={styles.secondaryButton}>
          &larr; Voltar
        </Link>
      </div>

      {servicosCatalogo.length === 0 ? (
        <div className={styles.profileSection}>
          <p style={{ color: 'var(--text-muted)' }}>
            Nenhum serviço cadastrado no catálogo. Por favor, adicione serviços no banco de dados primeiro.
          </p>
        </div>
      ) : (
        <VendaServicoForm clienteId={clienteId} servicosCatalogo={servicosCatalogo} />
      )}
    </div>
  );
}
