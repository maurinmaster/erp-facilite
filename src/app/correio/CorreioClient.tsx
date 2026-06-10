'use client';

import React, { useState } from 'react';
import { MensagemResumo, excluirMensagemEntrada, excluirMensagemEnviada } from '@/actions/correio';
import { Mail, Send, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

interface CorreioClientProps {
  caixaEntrada: MensagemResumo[];
  enviados: MensagemResumo[];
}

export default function CorreioClient({ caixaEntrada, enviados }: CorreioClientProps) {
  const [activeTab, setActiveTab] = useState<'entrada' | 'enviados'>('entrada');
  const [deletando, setDeletando] = useState<number | null>(null);

  const mensagens = activeTab === 'entrada' ? caixaEntrada : enviados;

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!confirm('Deseja realmente excluir esta mensagem?')) return;
    
    setDeletando(id);
    try {
      if (activeTab === 'entrada') {
        await excluirMensagemEntrada(id);
      } else {
        await excluirMensagemEnviada(id);
      }
    } catch (err) {
      alert('Erro ao excluir mensagem');
    } finally {
      setDeletando(null);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Sidebar Correio */}
      <div style={{ 
        width: '240px', 
        background: '#fff', 
        borderRadius: '8px', 
        border: '1px solid var(--border)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <Link href="/correio/nova" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'var(--primary)',
          color: '#fff',
          padding: '10px',
          borderRadius: '6px',
          fontWeight: 600,
          textDecoration: 'none',
          marginBottom: '16px'
        }}>
          <Edit size={18} /> Nova Mensagem
        </Link>

        <button 
          onClick={() => setActiveTab('entrada')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: activeTab === 'entrada' ? 'var(--bg-hover)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: activeTab === 'entrada' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'entrada' ? 600 : 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <Mail size={18} /> Caixa de Entrada
        </button>

        <button 
          onClick={() => setActiveTab('enviados')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: activeTab === 'enviados' ? 'var(--bg-hover)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: activeTab === 'enviados' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'enviados' ? 600 : 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <Send size={18} /> Enviados
        </button>
      </div>

      {/* Lista de Mensagens */}
      <div style={{ 
        flex: 1, 
        background: '#fff', 
        borderRadius: '8px', 
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            {activeTab === 'entrada' ? 'Caixa de Entrada' : 'Enviados'}
          </h2>
        </div>

        {mensagens.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma mensagem encontrada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {mensagens.map(msg => (
              <Link 
                key={msg.id} 
                href={`/correio/${msg.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: !msg.lida && activeTab === 'entrada' ? 'rgba(79, 70, 229, 0.05)' : '#fff',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
              >
                {!msg.lida && activeTab === 'entrada' && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    marginRight: '12px'
                  }} />
                )}
                
                <div style={{ flex: 1, display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ width: '180px', fontWeight: !msg.lida && activeTab === 'entrada' ? 600 : 400 }}>
                    {msg.remetente_nome}
                  </div>
                  
                  <div style={{ flex: 1, fontWeight: !msg.lida && activeTab === 'entrada' ? 600 : 400 }}>
                    {msg.is_popup && <span style={{ 
                      fontSize: '0.7rem', 
                      background: '#ef4444', 
                      color: '#fff', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      marginRight: '8px',
                      fontWeight: 600
                    }}>POPUP</span>}
                    {msg.assunto}
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', width: '120px', textAlign: 'right' }}>
                    {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </div>
                </div>

                <button 
                  onClick={(e) => handleDelete(e, msg.id)}
                  disabled={deletando === msg.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    padding: '8px',
                    cursor: 'pointer',
                    marginLeft: '16px',
                    opacity: deletando === msg.id ? 0.5 : 1
                  }}
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
