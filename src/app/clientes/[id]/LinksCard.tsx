'use client';

import { useState } from 'react';
import { addLink, removeLink, Link as ClienteLink } from '@/actions/link';
import styles from '../clientes.module.css';

interface Props {
  clienteId: number;
  links: ClienteLink[];
}

export default function LinksCard({ clienteId, links }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd(formData: FormData) {
    await addLink(clienteId, formData);
    setIsAdding(false);
  }

  return (
    <div className={styles.profileSection}>
      <div className={styles.sectionTitle}>
        Links (Drive, Docs, Redes)
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className={styles.headerAction}>
            + Adicionar
          </button>
        )}
      </div>

      {isAdding && (
        <div className={styles.miniForm}>
          <form action={handleAdd}>
            <div className={styles.addressGrid} style={{ gridTemplateColumns: '1fr' }}>
              <input type="text" name="titulo" placeholder="Título (ex: Google Drive)" required className={styles.input} />
              <input type="url" name="url" placeholder="URL completa (https://...)" required className={styles.input} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsAdding(false)} className={styles.secondaryButton}>
                Cancelar
              </button>
              <button type="submit" className={styles.primaryButton}>
                Adicionar Link
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.itemList}>
        {links.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum link adicionado.</p>
        ) : (
          links.map((link) => (
            <div key={link.id} className={styles.itemCard}>
              <div className={styles.itemInfo}>
                <h4><a href={link.url} target="_blank" rel="noopener noreferrer">{link.titulo}</a></h4>
                <p style={{ wordBreak: 'break-all' }}>{link.url}</p>
              </div>
              <form action={removeLink.bind(null, clienteId, link.id!)}>
                <button type="submit" className={styles.deleteButton}>Remover</button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
