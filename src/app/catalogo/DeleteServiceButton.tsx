'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import styles from './catalogo.module.css';

export default function DeleteServiceButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      className={`${styles.actionBtn} ${styles.delete}`}
      title="Excluir Serviço"
      onClick={(e) => {
        if (!window.confirm('Tem certeza que deseja deletar este serviço? Isso enviará ele para a Lixeira, mas contratos ativos não serão afetados.')) {
          e.preventDefault();
        }
      }}
    >
      {pending ? '⏳' : <Trash2 size={16} />}
    </button>
  );
}
