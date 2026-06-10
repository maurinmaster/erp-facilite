'use client';

import { useState } from 'react';
import { createServicoCatalogo } from '@/actions/catalogo';
import styles from '../../clientes/clientes.module.css';
import Link from 'next/link';

interface Props {
  briefingTemplates: { id: number; titulo: string; campos: string[] }[];
}

export default function ServicoForm({ briefingTemplates }: Props) {
  const [loading, setLoading] = useState(false);
  const [tarefas, setTarefas] = useState(['']); // Começa com um campo vazio

  const handleAddTarefa = () => {
    setTarefas([...tarefas, '']);
  };

  const handleRemoveTarefa = (index: number) => {
    const newTarefas = [...tarefas];
    newTarefas.splice(index, 1);
    setTarefas(newTarefas);
  };

  const handleChangeTarefa = (index: number, val: string) => {
    const newTarefas = [...tarefas];
    newTarefas[index] = val;
    setTarefas(newTarefas);
  };

  return (
    <form action={createServicoCatalogo} onSubmit={() => setLoading(true)}>
      <div className={styles.profileSection}>
        <h3 className={styles.sectionTitle}>Informações Básicas</h3>
        <div className={styles.addressGrid}>
          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.label}>Nome do Serviço *</label>
            <input type="text" name="nome" required className={styles.input} placeholder="Ex: Criação de Identidade Visual" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tipo *</label>
            <select name="tipo" required className={styles.input}>
              <option value="Pontual">Projeto Pontual</option>
              <option value="Recorrente">Serviço Recorrente Mensal</option>
            </select>
          </div>
          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.label}>Template de Briefing Padrão</label>
            <select 
              name="briefing_template_id" 
              className={styles.input}
              onChange={(e) => {
                const selectedId = Number(e.target.value);
                if (selectedId) {
                  const template = briefingTemplates.find(bt => bt.id === selectedId);
                  if (template && template.campos.length > 0) {
                    setTarefas(template.campos);
                  }
                }
              }}
            >
              <option value="">Nenhum template selecionado</option>
              {briefingTemplates.map(bt => (
                <option key={bt.id} value={bt.id}>{bt.titulo}</option>
              ))}
            </select>
          </div>
          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.label}>Descrição Interna</label>
            <textarea name="descricao" className={styles.input} placeholder="Detalhes sobre o que contempla esse serviço..." rows={3}></textarea>
          </div>
        </div>
      </div>

      <div className={styles.profileSection}>
        <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Tarefas Padrão de Produção
          <button type="button" onClick={handleAddTarefa} className={styles.headerAction}>
            + Adicionar Tarefa
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Toda vez que você vender esse serviço, essas tarefas serão criadas automaticamente para a equipe de produção.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tarefas.map((tarefa, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', width: '20px' }}>{idx + 1}.</span>
              <input 
                type="text" 
                name="tarefas[]" 
                className={styles.input} 
                placeholder="Nome da Tarefa (Ex: Reunião de Briefing)" 
                value={tarefa}
                onChange={(e) => handleChangeTarefa(idx, e.target.value)}
                required
              />
              {tarefas.length > 1 && (
                <button type="button" onClick={() => handleRemoveTarefa(idx)} className={styles.deleteButton}>
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
        <Link href="/catalogo" className={styles.secondaryButton} style={{ textDecoration: 'none' }}>
          Cancelar
        </Link>
        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Serviço no Catálogo'}
        </button>
      </div>
    </form>
  );
}
