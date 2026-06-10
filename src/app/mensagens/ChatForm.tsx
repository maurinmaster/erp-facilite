'use client';

import { useState } from 'react';
import { enviarMensagemChat, enviarMensagemGrupo } from '@/actions/mensagens';

export default function ChatForm({ destinatarioId, grupoId }: { destinatarioId?: number, grupoId?: number }) {
  const [conteudo, setConteudo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conteudo.trim() || (!destinatarioId && !grupoId)) return;

    setLoading(true);
    try {
      if (grupoId) {
        await enviarMensagemGrupo(grupoId, conteudo);
      } else if (destinatarioId) {
        await enviarMensagemChat(destinatarioId, conteudo);
      }
      setConteudo('');
    } catch (e) {
      console.error(e);
      alert('Falha ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          value={conteudo}
          onChange={e => setConteudo(e.target.value)}
          placeholder="Digite sua mensagem..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !conteudo.trim()}
          style={{ padding: '0 24px', borderRadius: '24px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', opacity: (loading || !conteudo.trim()) ? 0.5 : 1 }}
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
