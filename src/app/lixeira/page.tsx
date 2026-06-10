import { getDeletedClientes, getDeletedProjetos, getDeletedUsuarios, restaurarCliente, restaurarProjeto, restaurarUsuario, excluirPermanenteCliente, excluirPermanenteProjeto, excluirPermanenteUsuario } from '@/actions/lixeira';
import styles from './lixeira.module.css';
import { requireAdmin } from '@/actions/auth';
import DeleteConfirmButton from './DeleteConfirmButton';

export const dynamic = 'force-dynamic';

export default async function LixeiraPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const tab = resolvedParams.tab || 'clientes';

  let clientes: any[] = [];
  let projetos: any[] = [];
  let equipe: any[] = [];

  if (tab === 'clientes') clientes = await getDeletedClientes();
  if (tab === 'projetos') projetos = await getDeletedProjetos();
  if (tab === 'equipe') equipe = await getDeletedUsuarios();

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Lixeira</h1>
          <p className="page-description">Gerencie e restaure itens que foram apagados do sistema.</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <a href="?tab=clientes" className={tab === 'clientes' ? styles.tabActive : styles.tab}>Clientes</a>
        <a href="?tab=projetos" className={tab === 'projetos' ? styles.tabActive : styles.tab}>Projetos & Serviços</a>
        <a href="?tab=equipe" className={tab === 'equipe' ? styles.tabActive : styles.tab}>Equipe</a>
      </div>

      <div className={styles.content}>
        {tab === 'clientes' && (
          <div className={styles.list}>
            {clientes.length === 0 ? <p className={styles.empty}>Nenhum cliente na lixeira.</p> : null}
            {clientes.map(c => (
              <div key={c.id} className={styles.item}>
                <div className={styles.info}>
                  <strong>{c.empresa || c.nome}</strong>
                  <span>Deletado em: {new Date(c.deleted_at).toLocaleString('pt-BR')}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <form action={async () => { 'use server'; await restaurarCliente(c.id); }}>
                    <button type="submit" className={styles.restoreBtn}>Restaurar</button>
                  </form>
                  <form action={async () => { 'use server'; await excluirPermanenteCliente(c.id); }}>
                    <DeleteConfirmButton />
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'projetos' && (
          <div className={styles.list}>
            {projetos.length === 0 ? <p className={styles.empty}>Nenhum projeto na lixeira.</p> : null}
            {projetos.map(p => (
              <div key={p.item_id} className={styles.item}>
                <div className={styles.info}>
                  <strong>{p.servico_nome}</strong>
                  <span>Cliente: {p.cliente_nome}</span>
                  <span className={styles.date}>Deletado em: {new Date(p.deleted_at).toLocaleString('pt-BR')}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <form action={async () => { 'use server'; await restaurarProjeto(p.item_id, p.projeto_id, p.cliente_id); }}>
                    <button type="submit" className={styles.restoreBtn}>Restaurar</button>
                  </form>
                  <form action={async () => { 'use server'; await excluirPermanenteProjeto(p.item_id, p.projeto_id); }}>
                    <DeleteConfirmButton />
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'equipe' && (
          <div className={styles.list}>
            {equipe.length === 0 ? <p className={styles.empty}>Nenhum usuário na lixeira.</p> : null}
            {equipe.map(u => (
              <div key={u.id} className={styles.item}>
                <div className={styles.info}>
                  <strong>{u.nome}</strong>
                  <span>Perfil: {u.perfil}</span>
                  <span className={styles.date}>Deletado em: {new Date(u.deleted_at).toLocaleString('pt-BR')}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <form action={async () => { 'use server'; await restaurarUsuario(u.id); }}>
                    <button type="submit" className={styles.restoreBtn}>Restaurar</button>
                  </form>
                  <form action={async () => { 'use server'; await excluirPermanenteUsuario(u.id); }}>
                    <DeleteConfirmButton />
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
