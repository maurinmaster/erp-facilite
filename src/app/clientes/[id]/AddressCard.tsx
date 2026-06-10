'use client';

import { useState } from 'react';
import { updateEndereco, Cliente } from '@/actions/cliente';
import styles from '../clientes.module.css';

interface Props {
  cliente: Cliente;
}

export default function AddressCard({ cliente }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSubmit(formData: FormData) {
    await updateEndereco(cliente.id!, formData);
    setIsEditing(false);
  }

  return (
    <div className={styles.profileSection}>
      <div className={styles.sectionTitle}>
        Endereço da Empresa
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className={styles.headerAction}>
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <form action={handleSubmit}>
          <div className={styles.addressGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>CEP</label>
              <input type="text" name="cep" className={styles.input} defaultValue={cliente.cep || ''} />
            </div>
            <div className={`${styles.formGroup} ${styles.colSpan2}`}>
              <label className={styles.label}>Logradouro (Rua, Av...)</label>
              <input type="text" name="logradouro" className={styles.input} defaultValue={cliente.logradouro || ''} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Número</label>
              <input type="text" name="numero" className={styles.input} defaultValue={cliente.numero || ''} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Complemento</label>
              <input type="text" name="complemento" className={styles.input} defaultValue={cliente.complemento || ''} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Bairro</label>
              <input type="text" name="bairro" className={styles.input} defaultValue={cliente.bairro || ''} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Cidade</label>
              <input type="text" name="cidade" className={styles.input} defaultValue={cliente.cidade || ''} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Estado (UF)</label>
              <input type="text" name="estado" className={styles.input} defaultValue={cliente.estado || ''} maxLength={2} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={() => setIsEditing(false)} className={styles.secondaryButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.primaryButton}>
              Salvar Endereço
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.dataGrid}>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Logradouro</span>
            <span className={styles.dataValue}>{cliente.logradouro || '-'}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Número</span>
            <span className={styles.dataValue}>{cliente.numero || '-'}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Complemento</span>
            <span className={styles.dataValue}>{cliente.complemento || '-'}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Bairro</span>
            <span className={styles.dataValue}>{cliente.bairro || '-'}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>Cidade / UF</span>
            <span className={styles.dataValue}>
              {cliente.cidade ? `${cliente.cidade} / ${cliente.estado || ''}` : '-'}
            </span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.dataLabel}>CEP</span>
            <span className={styles.dataValue}>{cliente.cep || '-'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
