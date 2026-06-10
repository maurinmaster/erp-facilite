import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClienteById, getLogsByCliente } from '@/actions/cliente';
import { getContatosByCliente } from '@/actions/contato';
import { getLinksByCliente } from '@/actions/link';
import { getItensContratoByCliente } from '@/actions/producao';
import styles from '../clientes.module.css';

// Componentes da Interface (Client Components)
import AddressCard from './AddressCard';
import SocialCard from './SocialCard';
import ContactsCard from './ContactsCard';
import LinksCard from './LinksCard';
import ContractsCard from './ContractsCard';
import ClientLogsCard from './ClientLogsCard';

export const dynamic = 'force-dynamic';

export default async function ClienteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clienteId = parseInt(id, 10);
  
  if (isNaN(clienteId)) {
    notFound();
  }

  const cliente = await getClienteById(clienteId);
  if (!cliente) {
    notFound();
  }

  const contatos = await getContatosByCliente(clienteId);
  const links = await getLinksByCliente(clienteId);
  const itensContrato = await getItensContratoByCliente(clienteId);
  const logs = await getLogsByCliente(clienteId);

  const dataCadastro = cliente.created_at 
    ? new Date(cliente.created_at).toLocaleDateString('pt-BR') 
    : 'Data desconhecida';

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">{cliente.nome}</h1>
          <p className="page-description" style={{ marginBottom: 4 }}>
            {cliente.empresa || 'Empresa não informada'} - {cliente.cnpj_cpf}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Cliente desde: {dataCadastro}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <form action={async () => { 'use server'; await import('@/actions/cliente').then(m => m.deleteCliente(clienteId)); }}>
            <button type="submit" style={{ background: 'none', border: '1px solid var(--danger, red)', color: 'var(--danger, red)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
              Deletar Cliente
            </button>
          </form>
          <Link href="/clientes" className={styles.secondaryButton}>
            &larr; Voltar
          </Link>
        </div>
      </div>

      <div className={styles.profileGrid}>
        
        {/* BLOCO 0: Serviços e Contratos */}
        <ContractsCard clienteId={clienteId} itens={itensContrato as any} />

        {/* BLOCO 1: Informações e Endereço */}
        <AddressCard cliente={cliente} />

        {/* BLOCO 2: Contatos Secundários */}
        <ContactsCard clienteId={clienteId} contatos={contatos} />

        {/* BLOCO 3: Links Úteis / Drive */}
        <LinksCard clienteId={clienteId} links={links} />

        {/* BLOCO 4: Redes Sociais */}
        <SocialCard cliente={cliente} />

        {/* BLOCO 5: Histórico de Atividades */}
        <ClientLogsCard logs={logs as any} />

      </div>
    </div>
  );
}
