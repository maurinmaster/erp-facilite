'use client';

import React from 'react';
import Link from 'next/link';

interface ClienteAndamento {
  projeto_id: number;
  cliente_nome: string;
  contrato_status: string;
  servico_nome: string;
  kanban_status: string;
  responsavel_nome: string | null;
  total_tarefas: number;
  tarefas_concluidas: number;
}

interface Props {
  clientes: ClienteAndamento[];
}

export default function ClientesEmAndamento({ clientes }: Props) {

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getProgress = (c: ClienteAndamento) => {
    if (c.kanban_status === 'Finalizado') return 100;
    
    if ((c.kanban_status === 'Em Produção' || c.kanban_status === 'Corrigindo') && c.total_tarefas > 0) {
      return Math.round((c.tarefas_concluidas / c.total_tarefas) * 100);
    }

    switch (c.kanban_status) {
      case 'Na Fila': return 15;
      case 'Em Produção': return 35;
      case 'Corrigindo': return 50;
      case 'Aprovação Interna': return 65;
      case 'Aguardando Cliente': return 85;
      default: return 10;
    }
  };

  if (!clientes || clientes.length === 0) return null;

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      padding: '24px',
      marginTop: '32px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Clientes em Andamento</h3>
        <Link href="/producao" style={{ fontSize: '0.85rem', color: '#10b981', textDecoration: 'none', fontWeight: 500 }}>
          Ver todos →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {clientes.map((c) => {
          const progress = getProgress(c);

          return (
            <Link href={`/producao?projeto_id=${c.projeto_id}`} key={c.projeto_id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              gap: '16px',
              background: '#fff',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              
              {/* Avatar Cliente */}
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#e6f4ea',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {getInitials(c.cliente_nome)}
              </div>

              {/* Informações Principais */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {c.cliente_nome}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: c.contrato_status === 'Ativo' ? '#e6f4ea' : '#fef08a',
                    color: c.contrato_status === 'Ativo' ? '#10b981' : '#ca8a04',
                    fontWeight: 500
                  }}>
                    {c.contrato_status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {c.servico_nome} &nbsp;•&nbsp; {c.kanban_status}
                </div>
              </div>

              {/* Barra de Progresso */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '120px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{progress}%</span>
                <div style={{ height: '4px', flex: 1, background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                </div>
              </div>

              {/* Responsável e Seta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  flexShrink: 0
                }} title={c.responsavel_nome || 'Sem responsável'}>
                  {c.responsavel_nome ? getInitials(c.responsavel_nome).substring(0, 2) : '-'}
                </div>
              </div>

            </Link>
          )
        })}
      </div>
    </div>
  );
}
