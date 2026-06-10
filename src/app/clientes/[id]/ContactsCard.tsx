'use client';

import { useState } from 'react';
import { addContato, removeContato, Contato } from '@/actions/contato';
import styles from '../clientes.module.css';

interface Props {
  clienteId: number;
  contatos: Contato[];
}

export default function ContactsCard({ clienteId, contatos }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await addContato(clienteId, formData);
    setIsAdding(false);
  }

  return (
    <div className={styles.profileSection}>
      <div className={styles.sectionTitle}>
        Contatos da Empresa
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className={styles.headerAction}>
            + Adicionar
          </button>
        )}
      </div>

      {isAdding && (
        <div className={styles.miniForm}>
          <h4 style={{ marginBottom: '12px', fontSize: '0.95rem' }}>Adicionar Contato</h4>
          <form action={handleAdd}>
            <div className={styles.addressGrid}>
              <input type="text" name="nome" placeholder="Nome *" required className={styles.input} />
              <input type="text" name="cargo" placeholder="Cargo (ex: Sócio)" className={styles.input} />
              <input type="email" name="email" placeholder="Email" className={styles.input} />
              <input type="tel" name="telefone" placeholder="Telefone" className={styles.input} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsAdding(false)} className={styles.secondaryButton}>
                Cancelar
              </button>
              <button type="submit" className={styles.primaryButton}>
                Adicionar Contato
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.itemList}>
        {contatos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum contato adicionado.</p>
        ) : (
          contatos.map((contato) => (
            <div key={contato.id} className={styles.itemCard}>
              <div className={styles.itemInfo}>
                <h4>
                  {contato.nome}{' '}
                  {contato.cargo && <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>- {contato.cargo}</span>}
                </h4>
                <p>
                  {contato.email} {contato.email && contato.telefone ? '|' : ''} {contato.telefone}
                </p>
              </div>
              <form action={removeContato.bind(null, clienteId, contato.id!)}>
                <button type="submit" className={styles.deleteButton}>Remover</button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
