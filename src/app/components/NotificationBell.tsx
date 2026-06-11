'use client';

import { useState, useEffect, useMemo } from 'react';
import { getNotificacoesNaoLidas, marcarNotificacaoComoLida, Notificacao } from '@/actions/notificacoes';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotificacoes = async () => {
    try {
      const data = await getNotificacoesNaoLidas();
      setNotificacoes(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Busca inicial
    fetchNotificacoes();

    // Conectar WebSocket
    const setupSocket = async () => {
      const { io } = await import('socket.io-client');
      const { getSession } = await import('@/actions/auth');
      const session = await getSession();
      if (!session) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
      const socket = io(wsUrl);
      
      const joinRoom = () => {
        socket.emit('join_user', session.id);
      };

      if (socket.connected) {
        joinRoom();
      } else {
        socket.on('connect', joinRoom);
      }

      const onNewEvent = (payload: any) => {
        // Refetch garante que temos o payload completo e o contador unread correto
        fetchNotificacoes();
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        console.log('[NotificationBell] Recebido evento do WS:', payload);

        if (payload && payload.titulo) {
          toast((t) => (
            <div 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
              onClick={() => {
                toast.dismiss(t.id);
                if (payload.link) window.location.href = payload.link;
              }}
            >
              <strong style={{ fontSize: '0.9rem', color: '#111' }}>{payload.titulo}</strong>
              {payload.mensagem && <span style={{ fontSize: '0.8rem', color: '#555' }}>{payload.mensagem}</span>}
            </div>
          ), { duration: 5000, style: { padding: '12px 16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } });
        }
      };

      socket.on('nova_notificacao', onNewEvent);
      socket.on('nova_mensagem', onNewEvent); // O sino tb reage a mensagens diretas!

      return () => {
        socket.off('nova_notificacao', onNewEvent);
        socket.off('nova_mensagem', onNewEvent);
        socket.off('connect', joinRoom);
      };
    };

    const cleanup = setupSocket();
    return () => { cleanup.then(c => c && c()); };
  }, []);

  const handleMarcarLida = async (ids: number[]) => {
    await marcarNotificacaoComoLida(ids);
    setNotificacoes(prev => prev.filter(n => !ids.includes(n.id)));
  };

  // Agrupa notificações do tipo MENSAGEM pelo remetente
  const groupedNotificacoes = useMemo(() => {
    const groups = new Map<string, any>();
    const others: any[] = [];

    notificacoes.forEach(n => {
      if (n.tipo === 'MENSAGEM' && n.remetente_id) {
        const key = `msg_${n.remetente_id}`;
        if (groups.has(key)) {
          const g = groups.get(key);
          g.ids.push(n.id);
          g.count += 1;
          g.titulo = `${g.count} novas mensagens de ${n.remetente_nome || 'alguém'}`;
          g.mensagem = 'Novas mensagens aguardando no chat';
          // Mantém a data/link da mais recente (primeira da lista que entra no map)
        } else {
          groups.set(key, {
            ...n,
            ids: [n.id],
            count: 1,
            titulo: `1 nova mensagem de ${n.remetente_nome || 'alguém'}`
          });
        }
      } else {
        others.push({ ...n, ids: [n.id], count: 1 });
      }
    });

    const result = [...Array.from(groups.values()), ...others];
    // Ordena pela data de criacao da mais recente do grupo
    result.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    return result;
  }, [notificacoes]);

  // Quantidade total a exibir no badge do sino
  const badgeCount = groupedNotificacoes.length;

  return (
    <>
      <Toaster position="bottom-right" containerStyle={{ zIndex: 999999 }} />
      <div style={{ position: 'relative' }}>
        <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', 
          position: 'relative', padding: '4px' 
        }}
      >
        <Bell size={20} style={{ color: 'var(--text-main)' }} />
        {badgeCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0, background: 'var(--danger)', 
            color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', 
            borderRadius: '50%', width: '18px', height: '18px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            animation: 'pulse 2s infinite'
          }}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '40px', right: '0', 
          width: '320px', background: 'var(--surface)', 
          border: '1px solid var(--border)', borderRadius: '8px', 
          boxShadow: 'var(--shadow-md)', zIndex: 50,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>Notificações</h4>
          </div>
          
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {groupedNotificacoes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Você não tem notificações novas.
              </div>
            ) : (
              groupedNotificacoes.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => {
                    handleMarcarLida(notif.ids);
                    setIsOpen(false);
                    if (notif.link) {
                      window.location.href = notif.link; // Usa location pq o push do next precisa do useRouter q n ta importado aqui, mas location resolve bem. Se nao, importo useRouter
                    }
                  }}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--border)', 
                    position: 'relative',
                    cursor: notif.link ? 'pointer' : 'default',
                    background: 'var(--surface)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{notif.titulo}</strong>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarcarLida(notif.ids);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                      title="Marcar como lida"
                    >
                      &times;
                    </button>
                  </div>
                  {notif.mensagem && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{notif.mensagem}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {new Date(notif.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
