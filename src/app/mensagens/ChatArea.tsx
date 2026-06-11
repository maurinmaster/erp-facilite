'use client';

import { useState, useEffect, useRef } from 'react';
import { MensagemChat } from '@/actions/mensagens';
import { useRouter } from 'next/navigation';

export default function ChatArea({ 
  initialMensagens, 
  activeId,
  isGrupo,
  myUserId 
}: { 
  initialMensagens: MensagemChat[]; 
  activeId: number;
  isGrupo: boolean;
  myUserId: number;
}) {
  const [mensagens, setMensagens] = useState<MensagemChat[]>(initialMensagens);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMensagens(initialMensagens);
  }, [initialMensagens, activeId, isGrupo]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  useEffect(() => {
    const setupSocket = async () => {
      const { io } = await import('socket.io-client');
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
      const socket = io(wsUrl);
      
      socket.on('connect', () => {
        socket.emit('join_user', myUserId);
        if (isGrupo) {
          socket.emit('join_group', activeId);
        }
      });

      socket.on('nova_mensagem', (payload: MensagemChat) => {
        const belongsToGroup = isGrupo && payload.grupo_id === activeId;
        const belongsToUser = !isGrupo && !payload.grupo_id && (payload.remetente_id === activeId || payload.destinatario_id === activeId);
        
        if (belongsToGroup || belongsToUser) {
          setMensagens(prev => [...prev, payload]);
        }
        router.refresh();
      });

      return () => {
        socket.disconnect();
      };
    };

    const cleanup = setupSocket();
    return () => { cleanup.then(c => c && c()); };
  }, [activeId, isGrupo, myUserId, router]);

  if (mensagens.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column' }}>
        <p>Sem mensagens ainda.</p>
        <p style={{ fontSize: '0.85rem' }}>Envie a primeira mensagem!</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {mensagens.map(msg => {
        const isMine = msg.remetente_id === myUserId;
        return (
          <div key={msg.id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: '8px' }}>
            
            {!isMine && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, marginTop: isGrupo ? '18px' : '0' }}>
                {msg.foto_url ? (
                  <img src={msg.foto_url} alt={msg.remetente_nome || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                    {(msg.remetente_nome || '?').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {isGrupo && !isMine && msg.remetente_nome && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px' }}>
                  {msg.remetente_nome}
                </div>
              )}
              <div style={{
                background: isMine ? 'var(--primary)' : 'var(--surface)',
                color: isMine ? '#fff' : 'var(--text-main)',
                padding: '12px 16px',
                borderRadius: '16px',
                borderBottomRightRadius: isMine ? '4px' : '16px',
                borderBottomLeftRadius: !isMine ? '4px' : '16px',
                boxShadow: 'var(--shadow-sm)',
                border: isMine ? 'none' : '1px solid var(--border)'
              }}>
                {msg.conteudo}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMine ? 'right' : 'left' }}>
                {new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
