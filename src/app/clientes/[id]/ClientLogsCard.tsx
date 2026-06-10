'use client';

import styles from '../clientes.module.css';

interface Log {
  id: number;
  acao: string;
  detalhes: string;
  usuario_nome: string;
  criado_em: string;
}

interface Props {
  logs: Log[];
}

export default function ClientLogsCard({ logs }: Props) {
  return (
    <div className={styles.profileSection} style={{ gridColumn: '1 / -1' }}>
      <h3 className={styles.sectionTitle}>Histórico de Atividades do Cliente</h3>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        paddingLeft: '12px',
        marginTop: '16px'
      }}>
        {/* Pseudo-element for timeline vertical line */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '16px',
          width: '2px',
          background: '#e5e7eb'
        }}></div>

        {(!logs || logs.length === 0) && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '16px' }}>Nenhuma atividade registrada ainda.</p>
        )}

        {logs?.map((log) => (
          <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--primary)',
              marginTop: '6px',
              boxShadow: '0 0 0 4px #ffffff'
            }}></div>
            <div style={{
              flex: 1,
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                <strong>{log.usuario_nome || 'Sistema'}</strong>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(log.criado_em).toLocaleString('pt-BR')}</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                {log.detalhes}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
