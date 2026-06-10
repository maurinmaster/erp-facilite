'use client';

import { useState } from 'react';
import { updateBriefingTemplate, BriefingTemplate } from '@/actions/briefing';
import styles from '../../../clientes/clientes.module.css';
import Link from 'next/link';

interface Props {
  template: BriefingTemplate;
}

export default function EditBriefingForm({ template }: Props) {
  const [loading, setLoading] = useState(false);
  const [campos, setCampos] = useState<string[]>(template.campos.length > 0 ? template.campos : ['']);

  const handleAddCampo = () => {
    setCampos([...campos, '']);
  };

  const handleRemoveCampo = (index: number) => {
    const newCampos = [...campos];
    newCampos.splice(index, 1);
    setCampos(newCampos);
  };

  const handleChangeCampo = (index: number, val: string) => {
    const newCampos = [...campos];
    newCampos[index] = val;
    setCampos(newCampos);
  };

  const updateAction = updateBriefingTemplate.bind(null, template.id);

  return (
    <form action={updateAction} onSubmit={() => setLoading(true)}>
      <div className={styles.profileSection}>
        <h3 className={styles.sectionTitle}>Título do Template</h3>
        <div className={styles.formGroup}>
          <input type="text" name="titulo" defaultValue={template.titulo} required className={styles.input} placeholder="Ex: Criação de E-commerce" />
        </div>
      </div>

      <div className={styles.profileSection}>
        <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Campos (Perguntas do Briefing)
          <button type="button" onClick={handleAddCampo} className={styles.headerAction}>
            + Adicionar Pergunta
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Ao vender um serviço com esse template, o operador será solicitado a responder estas perguntas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {campos.map((campo, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', width: '20px' }}>{idx + 1}.</span>
              <input 
                type="text" 
                name="campos[]" 
                className={styles.input} 
                placeholder="Ex: Qual o público-alvo principal?" 
                value={campo}
                onChange={(e) => handleChangeCampo(idx, e.target.value)}
                required
              />
              {campos.length > 1 && (
                <button type="button" onClick={() => handleRemoveCampo(idx)} className={styles.deleteButton}>
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
        <Link href="/briefings" className={styles.secondaryButton} style={{ textDecoration: 'none' }}>
          Cancelar
        </Link>
        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}
