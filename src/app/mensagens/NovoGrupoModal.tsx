'use client';

import { useState } from 'react';
import { criarGrupo } from '@/actions/mensagens';

export default function NovoGrupoModal({ usuarios }: { usuarios: { id: number, nome: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleUsuario = (id: number) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || selecionados.length === 0) return;
    
    setLoading(true);
    try {
      await criarGrupo(nome, selecionados);
      setIsOpen(false);
      setNome('');
      setSelecionados([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ width: '100%', padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        ➕ Novo Grupo
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-main)' }}>Criar Novo Grupo</h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Nome do Grupo</label>
                <input 
                  type="text" 
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Membros</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
                  {usuarios.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input 
                        type="checkbox" 
                        checked={selecionados.includes(u.id)}
                        onChange={() => toggleUsuario(u.id)}
                        style={{ marginRight: '12px' }}
                      />
                      {u.nome}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsOpen(false)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading || selecionados.length === 0 || !nome.trim()} style={{ padding: '8px 16px', border: 'none', background: 'var(--primary)', color: '#fff', borderRadius: '6px', cursor: 'pointer', opacity: (loading || selecionados.length === 0 || !nome.trim()) ? 0.5 : 1 }}>
                  {loading ? 'Criando...' : 'Criar Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
