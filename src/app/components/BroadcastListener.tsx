'use client';

import React, { useEffect, useState } from 'react';
import { verificarPopupsNaoVistos, marcarPopupComoVisto } from '@/actions/correio';
import { AlertCircle, X } from 'lucide-react';

interface PopupData {
  id: number;
  assunto: string;
  corpo: string;
  remetente_nome: string;
}

export default function BroadcastListener() {
  const [popups, setPopups] = useState<PopupData[]>([]);

  const fetchPopups = async () => {
    try {
      const data = await verificarPopupsNaoVistos();
      if (data && data.length > 0) {
        setPopups(data);
      }
    } catch (err) {
      console.error('Erro ao verificar popups', err);
    }
  };

  useEffect(() => {
    // Busca inicial
    fetchPopups();

    // Polling a cada 15 segundos
    const interval = setInterval(() => {
      if (popups.length === 0) {
        fetchPopups();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [popups.length]);

  const handleDismiss = async (id: number) => {
    try {
      await marcarPopupComoVisto(id);
      setPopups(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Erro ao marcar popup como visto', err);
    }
  };

  if (popups.length === 0) return null;

  const currentPopup = popups[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div style={{
          background: '#ef4444',
          color: '#fff',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          fontSize: '1.2rem'
        }}>
          <AlertCircle size={24} />
          Alerta Importante
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            De: <strong>{currentPopup.remetente_nome}</strong>
          </div>
          
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>
            {currentPopup.assunto}
          </h3>

          <div 
            style={{ 
              lineHeight: '1.6', 
              color: 'var(--text-main)', 
              maxHeight: '400px', 
              overflowY: 'auto' 
            }}
            dangerouslySetInnerHTML={{ __html: currentPopup.corpo }}
            className="tiptap-content"
          />
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => handleDismiss(currentPopup.id)}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <X size={18} /> Ciente, fechar
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}
