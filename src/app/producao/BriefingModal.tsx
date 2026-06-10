'use client';

import styles from './producao.module.css';

interface BriefingModalProps {
  tarefa: any;
  onClose: () => void;
}

export default function BriefingModal({ tarefa, onClose }: BriefingModalProps) {
  if (!tarefa) return null;
  const briefing = tarefa.dados_acordados || {};

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Briefing: {tarefa.servico_nome}</h2>
          <button className={styles.btnClose} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.briefingSection}>
            <h3>Detalhes Principais</h3>
            {Object.entries(briefing).map(([key, value]) => {
              // If value is completely empty, don't show
              if (value === null || value === undefined || value === '') return null;
              if (Array.isArray(value) && value.length === 0) return null;
              if (typeof value === 'object' && Object.keys(value).length === 0) return null;

              if (key === 'texto_longo') {
                return (
                  <div key={key} className={styles.briefingItem} style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', background: 'transparent', padding: 0, marginBottom: '24px' }}>
                    <div className={styles.briefingLabel} style={{ marginBottom: '12px', fontSize: '0.85rem' }}>DESCRIÇÃO GERAL</div>
                    <div 
                      className="tiptap-content" 
                      style={{ background: 'var(--background)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{ __html: String(value) }} 
                    />
                  </div>
                );
              }

              if (key === 'detalhes') {
                const detalhesObj = value as Record<string, string>;
                return (
                  <div key={key} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Detalhes do Serviço</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                      {Object.entries(detalhesObj).map(([k, v]) => (
                        <div key={k} style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{k}</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)' }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (key === 'links') {
                const linksArr = value as any[];
                return (
                  <div key={key} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Links Úteis</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {linksArr.map((link, idx) => (
                        <a key={idx} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--secondary)', color: 'var(--primary)', borderRadius: '100px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.2s' }}>
                          🔗 {link.titulo || 'Acessar Link'}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }

              if (key === 'anexos') {
                const anexosArr = value as any[];
                return (
                  <div key={key} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Anexos</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {anexosArr.map((anexo, idx) => (
                        <a key={idx} href={anexo.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-main)', transition: 'border-color 0.2s' }}>
                          <span style={{ fontSize: '1.2rem' }}>📎</span>
                          <div>
                            <div style={{ fontWeight: 500 }}>{anexo.nome || 'Documento'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clique para visualizar</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }

              if (key === 'acessos') {
                const acessosArr = value as any[];
                return (
                  <div key={key} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Acessos Restritos</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                      {acessosArr.map((acesso, idx) => (
                        <div key={idx} style={{ background: 'var(--surface)', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🔑</span>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{acesso.plataforma}</strong>
                          </div>
                          <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}><span style={{ color: 'var(--text-muted)' }}>Login:</span> {acesso.login}</div>
                          <div style={{ fontSize: '0.9rem' }}><span style={{ color: 'var(--text-muted)' }}>Senha:</span> <code style={{ background: 'var(--background)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>{acesso.senha || '---'}</code></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (key === 'observacoes') {
                return (
                  <div key={key} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Observações</div>
                    <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', background: '#fffbeb', color: '#b45309', padding: '16px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                      {String(value)}
                    </div>
                  </div>
                );
              }

              // Fallback for custom generic fields
              return (
                <div key={key} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{key.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '0.95rem', background: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
