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
              if (key === 'acessos' || key === 'anexos' || key === 'observacoes') return null;
              return (
                <div key={key} className={styles.briefingItem}>
                  <div className={styles.briefingLabel}>{key.replace(/_/g, ' ')}</div>
                  <div className={styles.briefingValue}>{String(value)}</div>
                </div>
              );
            })}
          </div>

          {briefing.observacoes && (
            <div className={styles.briefingSection}>
              <h3>Observações</h3>
              <div className={styles.briefingValue} style={{ whiteSpace: 'pre-wrap' }}>
                {briefing.observacoes}
              </div>
            </div>
          )}

          {briefing.anexos && briefing.anexos.length > 0 && (
            <div className={styles.briefingSection}>
              <h3>Links e Anexos</h3>
              {briefing.anexos.map((anexo: any, index: number) => (
                <div key={index} className={styles.briefingItem}>
                  <div className={styles.briefingLabel}>{anexo.nome}</div>
                  <a href={anexo.url} target="_blank" rel="noreferrer" className={styles.briefingValue} style={{ display: 'block', color: 'var(--primary)', textDecoration: 'none' }}>
                    {anexo.url}
                  </a>
                </div>
              ))}
            </div>
          )}

          {briefing.acessos && briefing.acessos.length > 0 && (
            <div className={styles.briefingSection}>
              <h3>Acessos (Descriptografados)</h3>
              {briefing.acessos.map((acesso: any, index: number) => (
                <div key={index} className={styles.briefingValue} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <strong>{acesso.plataforma}</strong>
                  <span>Login: {acesso.login}</span>
                  <span>Senha: {acesso.senha || 'Não informada'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
