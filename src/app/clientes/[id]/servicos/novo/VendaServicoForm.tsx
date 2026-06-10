'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ativarServico, updateItemContrato } from '@/actions/producao';
import { ServicoCatalogoComTemplates } from '@/actions/catalogo';
import styles from '../../../clientes.module.css';
import TipTapEditor from '@/app/components/TipTapEditor';
import React from 'react';

interface Props {
  clienteId: number;
  servicosCatalogo: ServicoCatalogoComTemplates[];
  initialItem?: any; // Para modo de Edição
}

export default function VendaServicoForm({ clienteId, servicosCatalogo, initialItem }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Se for edição, trava a troca de serviço e preenche os dados
  const isEditing = !!initialItem;
  const [servicoId, setServicoId] = useState(initialItem?.servico_catalogo_id?.toString() || '');
  const [valorFechado, setValorFechado] = useState<number>(initialItem?.valor_fechado || 0);
  
  // Estados Dinâmicos do Briefing
  const briefing = initialItem?.dados_acordados || {};
  
  const [longText, setLongText] = useState(briefing.texto_longo || '');
  
  // Converter detalhes (objeto) devolta para array de chaves/valores
  const initialDetails = briefing.detalhes 
    ? Object.keys(briefing.detalhes).map(k => ({ key: k, value: briefing.detalhes[k] })) 
    : [];
  const [briefingFields, setBriefingFields] = useState<{key: string, value: string}[]>(initialDetails);
  
  const [acessos, setAcessos] = useState<{plataforma: string, login: string, senha: string}[]>(briefing.acessos || []);
  const [links, setLinks] = useState<{titulo: string, url: string}[]>(briefing.links || []);
  const [anexos, setAnexos] = useState<{nome: string, url: string}[]>(briefing.anexos || []);

  // Auto-preencher campos de briefing quando o serviço mudar (somente na criação)
  useEffect(() => {
    if (isEditing) return;
    const selectedService = servicosCatalogo.find(s => s.id.toString() === servicoId);
    if (selectedService && selectedService.briefing_campos && selectedService.briefing_campos.length > 0) {
      setBriefingFields(selectedService.briefing_campos.map((campo: string) => ({ key: campo, value: '' })));
    } else {
      setBriefingFields([]);
    }
  }, [servicoId, servicosCatalogo, isEditing]);

  // Helpers genéricos para manipular arrays
  const addArrayItem = (setter: any, emptyItem: any) => {
    setter((prev: any) => [...prev, emptyItem]);
  };
  const removeArrayItem = (setter: any, index: number) => {
    setter((prev: any) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };
  const changeArrayItem = (setter: any, index: number, field: string, val: string) => {
    setter((prev: any) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Monta o JSON apenas com os campos preenchidos
      const jsonAcordado: any = {};

      if (longText.trim()) {
        jsonAcordado.texto_longo = longText.trim();
      }

      const detalhes: Record<string, string> = {};
      briefingFields.forEach(f => {
        if (f.key.trim() && f.value.trim()) {
          detalhes[f.key.trim()] = f.value.trim();
        }
      });
      if (Object.keys(detalhes).length > 0) jsonAcordado.detalhes = detalhes;

      const acessosValidos = acessos.filter(a => a.plataforma.trim());
      if (acessosValidos.length > 0) jsonAcordado.acessos = acessosValidos;

      const linksValidos = links.filter(l => l.url.trim());
      if (linksValidos.length > 0) jsonAcordado.links = linksValidos;

      const anexosValidos = anexos.filter(a => a.url.trim());
      if (anexosValidos.length > 0) jsonAcordado.anexos = anexosValidos;

      const payload = {
        cliente_id: clienteId,
        servico_catalogo_id: Number(servicoId),
        valor_fechado: Number(valorFechado) || 0,
        dados_acordados: jsonAcordado
      };

      if (isEditing) {
        await updateItemContrato(initialItem.id, payload);
      } else {
        await ativarServico(payload);
      }

      router.push(`/clientes/${clienteId}`);
    } catch (error) {
      console.error('Erro ao vender serviço:', error);
      alert('Falha ao ativar o serviço. Verifique o console.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.profileGrid} style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* SEÇÃO 1: DADOS COMERCIAIS */}
      <div className={styles.profileSection} style={{ gridColumn: '1 / -1' }}>
        <h3 className={styles.sectionTitle}>Detalhes Comerciais</h3>
        <div className={styles.addressGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Serviço Vendido *</label>
            <select 
              required 
              className={styles.input} 
              value={servicoId} 
              onChange={(e) => setServicoId(e.target.value)}
              disabled={isEditing}
              style={isEditing ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
            >
              <option value="">Selecione o Serviço do Catálogo...</option>
              {servicosCatalogo.map(s => (
                <option key={s.id} value={s.id}>{s.nome} ({s.tipo})</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Valor do Serviço (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              className={styles.input} 
              value={valorFechado} 
              onChange={(e) => setValorFechado(Number(e.target.value))}
              placeholder="Ex: 1500.00"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: CONSTRUTOR DE BRIEFING */}
      <div className={styles.profileSection} style={{ gridColumn: '1 / -1' }}>
        <div className={styles.sectionTitle} style={{ borderBottom: 'none', marginBottom: '8px' }}>
          Construtor de Escopo / Briefing
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Adicione apenas as informações necessárias. Deixe em branco o que não precisar usar.
        </p>

        {/* 2.1 TEXTO LONGO */}
        <div style={{ marginBottom: '24px' }}>
          <label className={styles.label}>Descrição Geral do Projeto (Texto Livre)</label>
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--background)' }}>
            <TipTapEditor
              value={longText}
              onChange={setLongText}
              placeholder="Cole aqui notas de reunião, resumos do que foi acordado..."
            />
          </div>
        </div>

        {/* 2.2 ACESSOS */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <strong style={{ fontSize: '0.9rem' }}>Acessos e Senhas</strong>
            <button type="button" onClick={() => addArrayItem(setAcessos, {plataforma:'', login:'', senha:''})} className={styles.headerAction}>
              + Adicionar Acesso
            </button>
          </div>
          {acessos.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum acesso inserido.</span>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {acessos.map((acc, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="text" className={styles.input} placeholder="Plataforma (ex: Instagram)" value={acc.plataforma} onChange={(e) => changeArrayItem(setAcessos, idx, 'plataforma', e.target.value)} />
                <input type="text" className={styles.input} placeholder="Login" value={acc.login} onChange={(e) => changeArrayItem(setAcessos, idx, 'login', e.target.value)} />
                <input type="text" className={styles.input} placeholder="Senha" value={acc.senha} onChange={(e) => changeArrayItem(setAcessos, idx, 'senha', e.target.value)} />
                <button type="button" onClick={() => removeArrayItem(setAcessos, idx)} className={styles.deleteButton} title="Remover">&times;</button>
              </div>
            ))}
          </div>
        </div>

        {/* 2.3 LINKS ÚTEIS */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <strong style={{ fontSize: '0.9rem' }}>Links de Referência</strong>
            <button type="button" onClick={() => addArrayItem(setLinks, {titulo:'', url:''})} className={styles.headerAction}>
              + Adicionar Link
            </button>
          </div>
          {links.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum link inserido.</span>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {links.map((link, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="text" className={styles.input} placeholder="Título (ex: Pinterest)" value={link.titulo} onChange={(e) => changeArrayItem(setLinks, idx, 'titulo', e.target.value)} />
                <input type="url" className={styles.input} placeholder="URL (https://...)" value={link.url} onChange={(e) => changeArrayItem(setLinks, idx, 'url', e.target.value)} />
                <button type="button" onClick={() => removeArrayItem(setLinks, idx)} className={styles.deleteButton} title="Remover">&times;</button>
              </div>
            ))}
          </div>
        </div>

        {/* 2.4 ANEXOS (DRIVE) */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <strong style={{ fontSize: '0.9rem' }}>Anexos (URLs Google Drive / Dropbox)</strong>
            <button type="button" onClick={() => addArrayItem(setAnexos, {nome:'', url:''})} className={styles.headerAction}>
              + Adicionar Anexo
            </button>
          </div>
          {anexos.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum anexo inserido.</span>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {anexos.map((anexo, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="text" className={styles.input} placeholder="Nome (ex: Logo em Alta)" value={anexo.nome} onChange={(e) => changeArrayItem(setAnexos, idx, 'nome', e.target.value)} />
                <input type="url" className={styles.input} placeholder="Link da Pasta ou Arquivo" value={anexo.url} onChange={(e) => changeArrayItem(setAnexos, idx, 'url', e.target.value)} />
                <button type="button" onClick={() => removeArrayItem(setAnexos, idx)} className={styles.deleteButton} title="Remover">&times;</button>
              </div>
            ))}
          </div>
        </div>

        {/* 2.5 DETALHES EXTRAS (CHAVE-VALOR) */}
        <div style={{ padding: '16px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <strong style={{ fontSize: '0.9rem' }}>Detalhes Dinâmicos (Chave-Valor)</strong>
            <button type="button" onClick={() => addArrayItem(setBriefingFields, {key:'', value:''})} className={styles.headerAction}>
              + Adicionar Chave
            </button>
          </div>
          {briefingFields.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum detalhe inserido.</span>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {briefingFields.map((field, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="text" className={styles.input} placeholder="Campo (ex: Tema)" value={field.key} onChange={(e) => changeArrayItem(setBriefingFields, idx, 'key', e.target.value)} />
                <span style={{ color: 'var(--text-muted)' }}>:</span>
                <input type="text" className={styles.input} placeholder="Valor (ex: Moderno)" value={field.value} onChange={(e) => changeArrayItem(setBriefingFields, idx, 'value', e.target.value)} />
                <button type="button" onClick={() => removeArrayItem(setBriefingFields, idx)} className={styles.deleteButton} title="Remover">&times;</button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
        <Link href={`/clientes/${clienteId}`} className={styles.secondaryButton} style={{ textDecoration: 'none' }}>
          Cancelar
        </Link>
        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? 'Salvando...' : (isEditing ? 'Salvar Edição' : 'Finalizar Venda e Iniciar Produção')}
        </button>
      </div>

    </form>
  );
}
