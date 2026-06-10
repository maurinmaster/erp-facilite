'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import styles from '../catalogo/catalogo.module.css';

export default function DeleteBriefingButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      className={`${styles.actionBtn} ${styles.delete}`}
      title="Excluir Briefing"
      onClick={(e) => {
        if (!window.confirm('Tem certeza que deseja deletar este template? Serviços que o utilizam ficarão sem template padrão.')) {
          e.preventDefault();
        }
      }}
    >
      {pending ? '⏳' : <Trash2 size={16} />}
    </button>
  );
}
