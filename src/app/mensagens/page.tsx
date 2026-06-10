import { getSession } from '@/actions/auth';
import { getConversas, getMensagensChat, getMensagensGrupo, MensagemChat } from '@/actions/mensagens';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ChatForm from './ChatForm';
import ChatArea from './ChatArea';
import NovoGrupoModal from './NovoGrupoModal';
import DeleteGroupButton from './DeleteGroupButton';
import { Users } from 'lucide-react';
import styles from './mensagens.module.css';

export const dynamic = 'force-dynamic';

export default async function MensagensPage({ searchParams }: { searchParams: Promise<{ u?: string, g?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { u, g } = await searchParams;
  const activeUserId = u ? parseInt(u, 10) : null;
  const activeGroupId = g ? parseInt(g, 10) : null;

  const conversas = await getConversas();
  
  // Apenas usuários para popular o modal
  const apenasUsuarios = conversas.filter(c => !c.isGrupo).map(c => ({ id: c.rawId, nome: c.nome }));

  let activeConversa = null;
  let mensagens: MensagemChat[] = [];

  if (activeGroupId) {
    activeConversa = conversas.find(c => c.isGrupo && c.rawId === activeGroupId);
    if (activeConversa) {
      mensagens = await getMensagensGrupo(activeGroupId);
    }
  } else if (activeUserId) {
    activeConversa = conversas.find(c => !c.isGrupo && c.rawId === activeUserId);
    if (activeConversa) {
      mensagens = await getMensagensChat(activeUserId);
    }
  }

  return (
    <div className="container" style={{ display: 'flex', height: '75vh', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      
      {/* Sidebar - Lista de Conversas */}
      <div style={{ width: '300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Chat</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mensagens e Grupos</p>
            </div>
          </div>
          <NovoGrupoModal usuarios={apenasUsuarios} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversas.map(conversa => {
            const linkHref = conversa.isGrupo ? `/mensagens?g=${conversa.rawId}` : `/mensagens?u=${conversa.rawId}`;
            const isActive = (conversa.isGrupo && conversa.rawId === activeGroupId) || (!conversa.isGrupo && conversa.rawId === activeUserId);
            
            return (
              <Link 
                key={conversa.id} 
                href={linkHref}
                className={`${styles.userItem} ${isActive ? styles.userItemActive : ''}`}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {conversa.isGrupo ? (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}><Users size={16} style={{ color: 'var(--text-muted)' }} /></div>
                  ) : conversa.foto_url ? (
                    <img src={conversa.foto_url} alt={conversa.nome} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
                      {conversa.nome.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{conversa.nome}</strong>
                    {conversa.perfil && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{conversa.perfil}</span>}
                  </div>
                </div>
                {conversa.naoLidas > 0 && (
                  <span className={styles.badge}>{conversa.naoLidas}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Area - Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
        {activeConversa ? (
          <>
            {/* Header do Chat */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {activeConversa.isGrupo ? (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0, fontSize: '1.2rem' }}><Users size={24} style={{ color: 'var(--text-muted)' }} /></div>
                ) : activeConversa.foto_url ? (
                  <img src={activeConversa.foto_url} alt={activeConversa.nome} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {activeConversa.nome.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                    {activeConversa.nome}
                  </h3>
                  {activeConversa.perfil && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeConversa.perfil}</span>}
                </div>
              </div>
              
              {activeConversa.isGrupo && (
                <DeleteGroupButton grupoId={activeConversa.rawId} nome={activeConversa.nome} />
              )}
            </div>

            {/* Histórico Real-time */}
            <ChatArea 
              initialMensagens={mensagens} 
              activeId={activeConversa.rawId} 
              isGrupo={activeConversa.isGrupo}
              myUserId={session.id} 
            />

            {/* Form de Envio */}
            <ChatForm destinatarioId={!activeConversa.isGrupo ? activeConversa.rawId : undefined} grupoId={activeConversa.isGrupo ? activeConversa.rawId : undefined} />
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
            <h3>Selecione um membro da equipe</h3>
            <p>Para iniciar uma conversa direta</p>
          </div>
        )}
      </div>
    </div>
  );
}
