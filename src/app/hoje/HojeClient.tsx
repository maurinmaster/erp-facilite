'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPanoramaHoje, PanoramaHoje, PanoramaItem, MicroTarefaItem } from '@/actions/hoje';
import { CalendarDays, Users, User, ListTodo, AlertTriangle, Package, Sparkles, CheckCircle, MessageSquare } from 'lucide-react';
import styles from './hoje.module.css';

export default function HojeClient({ initialData, userId }: { initialData: PanoramaHoje, userId: number }) {
  const [view, setView] = useState<'geral' | 'individual'>('geral');
  const [data, setData] = useState<PanoramaHoje>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const newData = await getPanoramaHoje(view === 'individual' ? userId : undefined);
        setData(newData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    // Only fetch if we switch view (initial is 'geral' and already loaded)
    if (view === 'individual') {
      fetchData();
    } else {
      setData(initialData); // Use the pre-fetched global data
    }
  }, [view, userId, initialData]);

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const todayString = new Date().toLocaleDateString('pt-BR', dateOptions);
  
  const renderPrioridadeTag = (prio: string) => {
    let tagClass = styles.tagBaixa;
    if (prio === 'Alta') tagClass = styles.tagAlta;
    if (prio === 'Crítica' || prio === 'Critica') tagClass = styles.tagCritica;
    if (prio === 'Média') tagClass = styles.tagMedia;
    return <span className={`${styles.tag} ${tagClass}`}>{prio}</span>;
  };

  const getDaysDiff = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const today = new Date();
    d.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const renderCard = (item: PanoramaItem, type: 'atrasado' | 'hoje' | 'normal' | 'aguardando') => {
    const isAtrasado = type === 'atrasado';
    const cardClass = isAtrasado ? styles.cardRed : type === 'aguardando' ? styles.cardYellow : type === 'hoje' ? styles.cardGreen : '';
    
    const diff = getDaysDiff(item.prazo);
    let diffStr = '';
    if (diff !== null) {
      if (diff < 0) diffStr = `${Math.abs(diff)} dias`;
      else if (diff === 0) diffStr = 'Hoje';
      else diffStr = `${diff} dias`;
    }

    return (
      <Link href={`/producao?projeto_id=${item.projeto_id}`} className={`${styles.card} ${cardClass}`} key={item.projeto_id}>
        <div className={styles.cardLeft}>
          <div className={styles.cardContent}>
            <div className={styles.cardTitleArea}>
              <span className={styles.cardTitle}>{item.servico_nome}</span>
              {renderPrioridadeTag(item.prioridade)}
              <span className={`${styles.tag} ${styles.tagStatus}`}>{item.projeto_status}</span>
              {isAtrasado && <span className={`${styles.tag} ${styles.tagRed}`}>Atrasada</span>}
            </div>
            <span className={styles.cardSubtitle}>{item.cliente_nome}</span>
          </div>
        </div>
        <div className={styles.cardRight}>
          {diffStr && (
            <span className={`${styles.daysLabel} ${isAtrasado ? styles.daysLabelRed : ''}`}>{diffStr}</span>
          )}
          {item.responsaveis_iniciais.length > 0 && (
            <div style={{ display: 'flex', gap: '-8px' }}>
              {item.responsaveis_iniciais.map((ini, i) => (
                <div key={i} className={styles.initialsCircle}>{ini}</div>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  };

  // Group microTarefas
  let microTarefasGrouped: { title: string, tarefas: MicroTarefaItem[] }[] = [];

  const priorityScore = (prio: string) => {
    if (prio === 'Crítica' || prio === 'Critica') return 4;
    if (prio === 'Alta') return 3;
    if (prio === 'Média' || prio === 'Media') return 2;
    return 1;
  };

  const sortedMicroTarefas = [...data.microTarefas].sort((a, b) => {
    const diffA = getDaysDiff(a.prazo) ?? 999;
    const diffB = getDaysDiff(b.prazo) ?? 999;
    const prioA = priorityScore(a.prioridade);
    const prioB = priorityScore(b.prioridade);
    if (prioA !== prioB) return prioB - prioA;
    return diffA - diffB;
  });

  if (view === 'individual') {
    const groups: Record<string, MicroTarefaItem[]> = {};
    sortedMicroTarefas.forEach(t => {
      if (!groups[t.cliente_nome]) groups[t.cliente_nome] = [];
      groups[t.cliente_nome].push(t);
    });
    microTarefasGrouped = Object.keys(groups).map(k => ({ title: k, tarefas: groups[k] }));
  } else {
    const groups: Record<string, MicroTarefaItem[]> = {};
    sortedMicroTarefas.forEach(t => {
      const agente = t.agente_nome || 'Sem Agente Atribuído';
      if (!groups[agente]) groups[agente] = [];
      groups[agente].push(t);
    });
    microTarefasGrouped = Object.keys(groups).map(k => ({ title: k, tarefas: groups[k] }));
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={28} style={{ color: 'var(--primary)' }} /> <span style={{ textTransform: 'capitalize' }}>{todayString}</span>
          </h1>
        </div>
        <div className={styles.toggleGroup}>
          <button 
            className={`${styles.toggleBtn} ${view === 'geral' ? styles.toggleBtnActive : ''}`}
            onClick={() => setView('geral')}
          >
            <Users size={18} /> Equipe
          </button>
          <button 
            className={`${styles.toggleBtn} ${view === 'individual' ? styles.toggleBtnActive : ''}`}
            onClick={() => setView('individual')}
          >
            <User size={18} /> Individual
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Carregando dados...</div>
      ) : (
        <div className={styles.grid}>
          {/* Coluna Esquerda */}
          <div>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={`${styles.icon} ${styles.iconGreen}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ListTodo size={20} /></div>
                  <span style={{ fontWeight: 600 }}>Tarefas do Dia (Micro-tarefas)</span>
                </div>
                <div className={styles.badgeCount}>{data.microTarefas.length} pendentes</div>
              </div>
              
              {microTarefasGrouped.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma tarefa pendente.</p>
              ) : (
                <div className={styles.cardList}>
                  {microTarefasGrouped.map(group => (
                    <div key={group.title} className={styles.groupCard}>
                      <div className={styles.groupHeader}>{group.title}</div>
                      <div className={styles.groupBody}>
                        {group.tarefas.map(t => {
                           const diff = getDaysDiff(t.prazo);
                           const isAtrasado = diff !== null && diff < 0;
                           return (
                             <Link href={`/producao?projeto_id=${t.projeto_id}`} key={t.tarefa_id} className={styles.microTaskItem}>
                               <div className={styles.microTaskLeft}>
                                 <div className={styles.microTaskCheck}></div>
                                 <span className={styles.microTaskTitle}>{t.tarefa_titulo}</span>
                               </div>
                               <div className={styles.microTaskRight}>
                                 <span className={styles.microTaskService}>
                                   {view === 'geral' ? `${t.cliente_nome} • ` : ''}{t.servico_nome}
                                 </span>
                                 {renderPrioridadeTag(t.prioridade)}
                                 {isAtrasado && <span className={`${styles.tag} ${styles.tagRed}`}>Atrasada</span>}
                               </div>
                             </Link>
                           );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={`${styles.icon} ${styles.iconGreen}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} /></div>
                  <span style={{ fontWeight: 600 }}>Entregas Próximas</span>
                </div>
                <div className={styles.badgeCount}>{data.entregasProximas.length}</div>
              </div>
              <div className={styles.cardList}>
                {data.entregasProximas.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma entrega para os próximos 7 dias.</p>}
                {data.entregasProximas.map(t => renderCard(t, 'normal'))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={`${styles.icon} ${styles.iconPurple}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={20} /></div>
                  <span style={{ fontWeight: 600 }}>Novas Demandas</span>
                </div>
                <div className={styles.badgeCount} style={{ background: '#ede9fe', color: '#6d28d9' }}>{data.novasDemandas.length} novas</div>
              </div>
              <div className={styles.cardList}>
                {data.novasDemandas.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma nova demanda.</p>}
                {data.novasDemandas.map(t => renderCard(t, 'normal'))}
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={`${styles.icon} ${styles.iconPurple}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={20} /></div>
                  <span style={{ fontWeight: 600 }}>Aprovações Pendentes</span>
                </div>
                <div className={styles.badgeCount}>{data.aprovacoesPendentes.length}</div>
              </div>
              <div className={styles.cardList}>
                {data.aprovacoesPendentes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma aprovação interna pendente.</p>}
                {data.aprovacoesPendentes.map(t => renderCard(t, getDaysDiff(t.prazo)! < 0 ? 'atrasado' : 'normal'))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={`${styles.icon} ${styles.iconYellow}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageSquare size={20} /></div>
                  <span style={{ fontWeight: 600 }}>Clientes Aguardando Resposta</span>
                </div>
                <div className={styles.badgeCount} style={{ background: '#fefce8', color: '#a16207' }}>{data.clientesAguardando.length}</div>
              </div>
              <div className={styles.cardList}>
                {data.clientesAguardando.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum cliente aguardando no momento.</p>}
                {data.clientesAguardando.map(t => renderCard(t, 'aguardando'))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <div className={`${styles.icon} ${styles.iconRed}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={20} /></div>
                  <span style={{ fontWeight: 600 }}>Tarefas Atrasadas</span>
                </div>
                <div className={styles.badgeCount} style={{ background: '#ef4444', color: '#fff' }}>{data.tarefasAtrasadas.length}</div>
              </div>
              <div className={styles.cardList}>
                {data.tarefasAtrasadas.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Uhu! Nenhuma tarefa atrasada.</p>}
                {data.tarefasAtrasadas.map(t => renderCard(t, 'atrasado'))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
