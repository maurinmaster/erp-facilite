'use client';

import React from 'react';
import styles from './lixeira.module.css';

export default function DeleteConfirmButton() {
  return (
    <button 
      type="submit" 
      className={styles.deleteBtn}
      onClick={(e) => {
        if (!window.confirm('🚨 CUIDADO: Esta ação apagará o registro permanentemente do banco de dados e não poderá ser desfeita. Tem certeza absoluta disso?')) {
          e.preventDefault();
        }
      }}
    >
      Excluir Definitivamente
    </button>
  );
}
