'use client';

import React, { useState } from 'react';
import { atualizarConfiguracao } from '@/actions/configuracoes';
import PermissoesTab from './PermissoesTab';
import { Perfil } from '@/actions/permissoes';

interface ConfigItem {
  chave: string;
  valor: string;
  descricao: string;
  updated_at: string;
}

export default function ConfiguracoesClient({ configuracoes, perfis = [] }: { configuracoes: ConfigItem[], perfis?: Perfil[] }) {
  const [activeTab, setActiveTab] = useState<'geral' | 'permissoes'>('geral');
  const [configs, setConfigs] = useState<Record<string, string>>(
    configuracoes.reduce((acc, curr) => ({ ...acc, [curr.chave]: curr.valor }), {})
  );
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleSave = async (chave: string) => {
    try {
      setSaving(true);
      setMensagem('');
      await atualizarConfiguracao(chave, configs[chave]);
      setMensagem('Configuração salva com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Menu de Abas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('geral')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'geral' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'geral' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'geral' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Configurações Globais
        </button>
        <button 
          onClick={() => setActiveTab('permissoes')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'permissoes' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'permissoes' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'permissoes' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Permissões e Cargos
        </button>
      </div>

      {activeTab === 'geral' && (
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          maxWidth: '600px'
        }}>
          {mensagem && (
        <div style={{
          padding: '12px',
          background: '#dcfce7',
          color: '#166534',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {mensagem}
        </div>
      )}

      {configuracoes.map(c => (
        <div key={c.chave} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
            {c.descricao || c.chave}
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              value={configs[c.chave]} 
              onChange={e => setConfigs({...configs, [c.chave]: e.target.value})}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <button 
              onClick={() => handleSave(c.chave)}
              disabled={saving}
              style={{
                padding: '8px 16px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Chave no banco: <code>{c.chave}</code>
          </p>
          </div>
        ))}
        </div>
      )}

      {activeTab === 'permissoes' && (
        <PermissoesTab initialPerfis={perfis} />
      )}
    </div>
  );
}
