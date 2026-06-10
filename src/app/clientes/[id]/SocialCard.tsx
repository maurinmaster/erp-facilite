'use client';

import { useState } from 'react';
import { updateRedesSociais, Cliente } from '@/actions/cliente';
import styles from '../clientes.module.css';

interface Props {
  cliente: Cliente;
}

export default function SocialCard({ cliente }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSubmit(formData: FormData) {
    await updateRedesSociais(cliente.id!, formData);
    setIsEditing(false);
  }

  return (
    <div className={styles.profileSection}>
      <div className={styles.sectionTitle}>
        Redes Sociais
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className={styles.headerAction}>
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <form action={handleSubmit}>
          <div className={styles.addressGrid} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Instagram (URL ou @)</label>
              <input type="text" name="instagram" className={styles.input} defaultValue={cliente.instagram || ''} placeholder="https://instagram.com/..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Facebook (URL)</label>
              <input type="text" name="facebook" className={styles.input} defaultValue={cliente.facebook || ''} placeholder="https://facebook.com/..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>LinkedIn (URL)</label>
              <input type="text" name="linkedin" className={styles.input} defaultValue={cliente.linkedin || ''} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={() => setIsEditing(false)} className={styles.secondaryButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.primaryButton}>
              Salvar Redes Sociais
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.dataGrid}>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Instagram</span>
            <span className={styles.dataValue}>
              {cliente.instagram ? <a href={cliente.instagram} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)'}}>{cliente.instagram}</a> : '-'}
            </span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Facebook</span>
            <span className={styles.dataValue}>
              {cliente.facebook ? <a href={cliente.facebook} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)'}}>{cliente.facebook}</a> : '-'}
            </span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>LinkedIn</span>
            <span className={styles.dataValue}>
              {cliente.linkedin ? <a href={cliente.linkedin} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary)'}}>{cliente.linkedin}</a> : '-'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
