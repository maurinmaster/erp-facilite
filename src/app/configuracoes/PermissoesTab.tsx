'use client';

import React, { useState } from 'react';
import { Perfil, createPerfil, updatePerfil, deletePerfil } from '@/actions/permissoes';

interface PermissoesTabProps {
  initialPerfis: Perfil[];
}

const MODULOS = [
  { id: 'dashboard', nome: 'Dashboard Principal' },
  { id: 'clientes', nome: 'Gestão de Clientes' },
  { id: 'producao', nome: 'Produção (Kanban)' },
  { id: 'aprovar_projetos', nome: 'Pode Aprovar Projetos Internamente' },
  { id: 'relatorios', nome: 'Relatórios' },
  { id: 'catalogo', nome: 'Catálogo de Serviços' },
  { id: 'equipe', nome: 'Membros da Equipe' },
  { id: 'mensagens', nome: 'Mensagens / Notificações' },
  { id: 'correio', nome: 'Correio Interno (E-mail)' },
  { id: 'enviar_alertas', nome: 'Pode Enviar Alertas (Popups)' },
  { id: 'configuracoes', nome: 'Configurações Globais' }
];

const NIVEIS = [
  { value: 'none', label: 'Sem Acesso' },
  { value: 'read', label: 'Apenas Leitura' },
  { value: 'limited', label: 'Acesso Restrito' },
  { value: 'full', label: 'Acesso Total' }
];

export default function PermissoesTab({ initialPerfis }: PermissoesTabProps) {
  const [perfis, setPerfis] = useState<Perfil[]>(initialPerfis);
  const [selectedPerfil, setSelectedPerfil] = useState<Perfil | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelect = (p: Perfil) => {
    setSelectedPerfil({ ...p, permissoes: { ...p.permissoes } });
    setIsCreating(false);
  };

  const handlePermissionChange = (moduloId: string, level: string) => {
    if (!selectedPerfil) return;
    setSelectedPerfil({
      ...selectedPerfil,
      permissoes: {
        ...selectedPerfil.permissoes,
        [moduloId]: level
      }
    });
  };

  const handleSave = async () => {
    if (!selectedPerfil) return;
    setSaving(true);
    try {
      if (isCreating) {
        if (!newNome.trim()) {
          alert('Digite o nome da nova atribuição');
          return;
        }
        const novoId = await createPerfil(newNome, selectedPerfil.permissoes);
        const novoPerfil: Perfil = { id: novoId, nome: newNome, permissoes: selectedPerfil.permissoes };
        setPerfis([...perfis, novoPerfil]);
        setSelectedPerfil(novoPerfil);
        setIsCreating(false);
        setNewNome('');
        alert('Perfil criado com sucesso!');
      } else {
        await updatePerfil(selectedPerfil.id, selectedPerfil.permissoes);
        setPerfis(perfis.map(p => p.id === selectedPerfil.id ? selectedPerfil : p));
        alert('Permissões salvas com sucesso!');
      }
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta atribuição?')) return;
    try {
      await deletePerfil(id);
      setPerfis(perfis.filter(p => p.id !== id));
      if (selectedPerfil?.id === id) setSelectedPerfil(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir');
    }
  };

  const startCreate = () => {
    setIsCreating(true);
    setSelectedPerfil({
      id: 0,
      nome: 'Novo Perfil',
      permissoes: {}
    });
    setNewNome('');
  };

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Coluna Esquerda: Lista de Perfis */}
      <div style={{ width: '250px', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Atribuições</h3>
          <button onClick={startCreate} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {perfis.map(p => (
            <div 
              key={p.id} 
              onClick={() => handleSelect(p)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: selectedPerfil?.id === p.id && !isCreating ? '#eff6ff' : '#fff',
                fontWeight: selectedPerfil?.id === p.id && !isCreating ? 600 : 400,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {p.nome}
              {!['Admin', 'Gestor', 'Operador'].includes(p.nome) && (
                <span 
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                  style={{ color: 'var(--danger)', fontSize: '1.2rem', padding: '0 4px' }}
                >
                  &times;
                </span>
              )}
            </div>
          ))}
          {isCreating && (
            <div style={{ padding: '12px 16px', background: '#eff6ff', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
              (Nova Atribuição)
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: Editor de Permissões */}
      {selectedPerfil ? (
        <div style={{ flex: 1, background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
          
          {isCreating ? (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Nome da nova atribuição</label>
              <input 
                type="text" 
                value={newNome}
                onChange={e => setNewNome(e.target.value)}
                placeholder="Ex: Assistente de Vendas"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '1rem' }}
              />
            </div>
          ) : (
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.25rem' }}>Permissões de: <span style={{ color: 'var(--primary)' }}>{selectedPerfil.nome}</span></h2>
          )}

          <div style={{ display: 'grid', gap: '16px' }}>
            {MODULOS.map(mod => (
              <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 500 }}>{mod.nome}</span>
                <select 
                  value={selectedPerfil.permissoes[mod.id] || 'none'}
                  onChange={e => handlePermissionChange(mod.id, e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: '#fff', width: '200px' }}
                  disabled={selectedPerfil.nome === 'Admin' && !isCreating}
                >
                  {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSave} 
              disabled={saving || (selectedPerfil.nome === 'Admin' && !isCreating)}
              style={{
                padding: '10px 24px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Regras'}
            </button>
          </div>
          
          {selectedPerfil.nome === 'Admin' && !isCreating && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '12px', textAlign: 'right' }}>
              As permissões do Admin não podem ser alteradas.
            </p>
          )}

        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px', background: '#f8fafc', height: '200px' }}>
          Selecione uma atribuição ao lado para editar suas permissões
        </div>
      )}

    </div>
  );
}
