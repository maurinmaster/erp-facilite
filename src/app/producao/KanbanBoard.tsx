'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateProjetoStatus } from '@/actions/producao';
import { KanbanSquare, List } from 'lucide-react';
import ProjectModal from './ProjectModal';
import styles from './producao.module.css';

interface ProjetoKanban {
  projeto_id: number;
  projeto_status: string;
  prioridade: string;
  prazo: string | null;
  prazo_interno?: string | null;
  tags: string[] | null;
  contrato_item_id: number;
  servico_nome: string;
  servico_tipo: string;
  cliente_nome: string;
  dados_acordados: any;
  checklist: any[];
  responsaveis: any[];
  comentarios: any[];
}

interface Props {
  projetosIniciais: ProjetoKanban[];
  usuarios: any[];
  sessao: any;
}

export default function KanbanBoard({ projetosIniciais, usuarios, sessao }: Props) {
  const [projetos, setProjetos] = useState<ProjetoKanban[]>(projetosIniciais);
  const [draggedItem, setDraggedItem] = useState<ProjetoKanban | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [projetoAtivo, setProjetoAtivo] = useState<ProjetoKanban | null>(null);

  // Estados dos Filtros
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  const [filtroResponsavel, setFiltroResponsavel] = useState<number | 0>(0);
  const [filtroPrazo, setFiltroPrazo] = useState<string>('');
  const [filtroMencao, setFiltroMencao] = useState<boolean>(false);
  
  // Estado de Visualização
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const searchParams = useSearchParams();

  // Load from URL initially
  useEffect(() => {
    const projId = searchParams.get('projeto_id');
    if (projId && !projetoAtivo) {
      const p = projetosIniciais.find(x => x.projeto_id === Number(projId));
      if (p) setProjetoAtivo(p);
    }
  }, [searchParams]);

  useEffect(() => {
    setProjetos(projetosIniciais);
    if (projetoAtivo) {
      const updatedAtivo = projetosIniciais.find(p => p.projeto_id === projetoAtivo.projeto_id);
      if (updatedAtivo) setProjetoAtivo(updatedAtivo);
    }
  }, [projetosIniciais]);

  const colunas = [
    { nome: 'Na Fila', cor: '#3b82f6' }, // blue
    { nome: 'Em Produção', cor: '#eab308' }, // yellow
    { nome: 'Aprovação Interna', cor: '#a855f7' }, // purple
    { nome: 'Aguardando Cliente', cor: '#f97316' }, // orange
    { nome: 'Corrigindo', cor: '#ef4444' }, // red
    { nome: 'Finalizado', cor: '#14b8a6' } // teal
  ];

  const onDragStart = (projeto: ProjetoKanban) => {
    setDraggedItem(projeto);
  };

  const onDragOver = (e: React.DragEvent, colunaNome: string) => {
    e.preventDefault();
    setDragOverCol(colunaNome);
  };

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  const onDrop = async (e: React.DragEvent, colunaNome: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedItem || draggedItem.projeto_status === colunaNome) return;

    if (draggedItem.projeto_status === 'Aprovação Interna' && sessao?.perfil !== 'Admin' && sessao?.permissoes?.aprovar_projetos !== 'full') {
      alert("⚠️ Acesso Negado: Você não tem permissão para tirar projetos da 'Aprovação Interna'.");
      return;
    }

    const prevProjetos = [...projetos];
    setProjetos(projetos.map(p => p.projeto_id === draggedItem.projeto_id ? { ...p, projeto_status: colunaNome } : p));

    try {
      await updateProjetoStatus(draggedItem.projeto_id, colunaNome);
    } catch (error: any) {
      alert(error.message || "Erro ao mover projeto.");
      setProjetos(prevProjetos);
    }
    setDraggedItem(null);
  };

  const isAtrasado = (prazo: string | null) => {
    if (!prazo) return false;
    const prazoDate = new Date(prazo);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return prazoDate < hoje;
  };

  const isEstaSemana = (prazo: string | null) => {
    if (!prazo) return false;
    const pDate = new Date(prazo);
    const hoje = new Date();
    const fimSemana = new Date(hoje);
    fimSemana.setDate(hoje.getDate() + (7 - hoje.getDay()));
    hoje.setHours(0,0,0,0);
    fimSemana.setHours(23,59,59,999);
    return pDate >= hoje && pDate <= fimSemana;
  };

  const clientesUnicos = Array.from(new Set(projetosIniciais.map(p => p.cliente_nome))).filter(Boolean).sort();

  const projetosFiltrados = projetos.filter(p => {
    if (filtroCliente && p.cliente_nome !== filtroCliente) return false;
    
    if (filtroResponsavel > 0) {
      if (!p.responsaveis.some(r => r.id === filtroResponsavel)) return false;
    }

    if (filtroPrazo) {
      if (filtroPrazo === 'atrasado' && !isAtrasado(p.prazo)) return false;
      if (filtroPrazo === 'semana' && !isEstaSemana(p.prazo)) return false;
      if (filtroPrazo === 'sem_prazo' && p.prazo) return false;
    }

    if (filtroMencao && sessao) {
      const primeiroNome = sessao.nome.split(' ')[0];
      const regex = new RegExp(`@${primeiroNome}\\b`, 'i');
      const foiMencionado = p.comentarios.some((c: any) => regex.test(c.comentario));
      if (!foiMencionado) return false;
    }

    return true;
  });

  return (
    <>
      <div className={styles.filterBar}>
        <div className={styles.viewToggleGroup}>
          <button 
            className={`${styles.viewToggleButton} ${viewMode === 'kanban' ? styles.active : ''}`}
            onClick={() => setViewMode('kanban')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <KanbanSquare size={18} /> Kanban
          </button>
          <button 
            className={`${styles.viewToggleButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <List size={18} /> Lista
          </button>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Cliente:</span>
          <select className={styles.filterSelect} value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
            <option value="">Todos os Clientes</option>
            {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Responsável:</span>
          <select className={styles.filterSelect} value={filtroResponsavel} onChange={e => setFiltroResponsavel(Number(e.target.value))}>
            <option value={0}>Todos</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Prazo:</span>
          <select className={styles.filterSelect} value={filtroPrazo} onChange={e => setFiltroPrazo(e.target.value)}>
            <option value="">Qualquer prazo</option>
            <option value="atrasado">Atrasados</option>
            <option value="semana">Esta Semana</option>
            <option value="sem_prazo">Sem Prazo</option>
          </select>
        </div>

        <button 
          className={`${styles.filterToggle} ${filtroMencao ? styles.active : ''}`}
          onClick={() => setFiltroMencao(!filtroMencao)}
        >
          @ Fui Mencionado
        </button>

        {(filtroCliente || filtroResponsavel > 0 || filtroPrazo || filtroMencao) && (
          <button 
            className={styles.filterClearButton}
            onClick={() => {
              setFiltroCliente('');
              setFiltroResponsavel(0);
              setFiltroPrazo('');
              setFiltroMencao(false);
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {viewMode === 'kanban' ? (
        <div className={styles.boardContainer}>
        {colunas.map((coluna) => {
          const projetosDaColuna = projetosFiltrados.filter(p => p.projeto_status === coluna.nome);
          
          return (
            <div 
              key={coluna.nome} 
              className={styles.column}
              onDragOver={(e) => onDragOver(e, coluna.nome)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, coluna.nome)}
            >
              <div className={styles.columnHeader}>
                <div className={styles.columnTitleTop} style={{ borderTopColor: coluna.cor, backgroundColor: `${coluna.cor}15`, color: coluna.cor }}>
                  {coluna.nome}
                </div>
                <div className={styles.columnBadge}>
                  {projetosDaColuna.length} Tasks
                </div>
              </div>
              
              <div className={`${styles.columnBody} ${dragOverCol === coluna.nome ? styles.columnBodyDragOver : ''}`}>
                {projetosDaColuna.length === 0 ? (
                  <div className={styles.emptyColumnState}>
                    Nenhum projeto<br/>nesta etapa
                  </div>
                ) : (
                  projetosDaColuna.map((projeto) => {
                    const checkDone = projeto.checklist.filter(c => c.status === 'Concluída').length;
                    const checkTotal = projeto.checklist.length;

                    return (
                      <div 
                        key={projeto.projeto_id} 
                        className={styles.taskCard}
                        draggable
                        onDragStart={() => onDragStart(projeto)}
                        onClick={() => setProjetoAtivo(projeto)}
                      >
                        <div className={styles.taskTitle}>
                          {projeto.servico_nome}
                        </div>
                        
                        <div className={styles.taskClientLocation}>
                          Cliente: {projeto.cliente_nome}
                        </div>

                        <div className={styles.tagsContainer}>
                          {projeto.tags.map((tag, i) => (
                            <span key={i} className={`${styles.tag} ${styles.tagDefault}`}>{tag}</span>
                          ))}
                          {projeto.prioridade && (
                            <span className={`${styles.tag} ${styles['priority' + projeto.prioridade]}`}>
                              {projeto.prioridade}
                            </span>
                          )}
                        </div>
                        
                        <div className={styles.cardFooter}>
                          <div className={styles.assignees}>
                            {projeto.responsaveis.length > 0 ? (
                              projeto.responsaveis.map((r: any, i) => (
                                <div key={i} className={styles.avatar} title={r.nome} style={r.foto_url ? { padding: 0, background: 'none' } : {}}>
                                  {r.foto_url ? (
                                    <img src={r.foto_url} alt={r.nome} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    r.nome.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className={styles.avatarEmpty} title="Sem responsável">
                                ?
                              </div>
                            )}
                          </div>
                          <div className={styles.footerRight}>
                            {projeto.prazo && (
                              <div className={`${styles.dateBlock} ${isAtrasado(projeto.prazo) ? styles.atrasado : ''}`} title="Prazo (Cliente)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                <span>{new Date(projeto.prazo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                              </div>
                            )}
                            {projeto.prazo_interno && (
                              <div className={`${styles.dateBlock} ${isAtrasado(projeto.prazo_interno) ? styles.atrasado : ''}`} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }} title="Prazo Interno">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>{new Date(projeto.prazo_interno).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                              </div>
                            )}
                            {checkTotal > 0 && (
                              <div className={styles.checklistInfo} title="Checklist (Concluído/Total)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                <span>{checkDone}/{checkTotal}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className={styles.listViewContainer}>
          <table className={styles.productionTable}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Data de vencimento</th>
                <th>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {projetosFiltrados.map((projeto) => {
                const corStatus = colunas.find(c => c.nome === projeto.projeto_status)?.cor || '#94a3b8';
                return (
                  <tr key={projeto.projeto_id} className={styles.tableRow} onClick={() => setProjetoAtivo(projeto)}>
                    <td className={styles.tableCell}>
                      <div className={styles.cellTitle}>
                        {projeto.servico_nome}
                      </div>
                      <div className={styles.cellClient}>{projeto.cliente_nome}</div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.cellAvatarGroup}>
                        {projeto.responsaveis.map((r: any) => (
                          <div key={r.id} className={styles.cellAvatar} title={r.nome} style={{ zIndex: 10, ...(r.foto_url ? { padding: 0, background: 'none' } : {}) }}>
                            {r.foto_url ? (
                              <img src={r.foto_url} alt={r.nome} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              r.nome.charAt(0).toUpperCase()
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.statusBadge} style={{ backgroundColor: `${corStatus}20`, color: corStatus, border: `1px solid ${corStatus}50` }}>
                        {projeto.projeto_status}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: isAtrasado(projeto.prazo) ? 'var(--danger)' : 'var(--text-main)' }}>
                          Cliente: {projeto.prazo ? new Date(projeto.prazo).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                        </span>
                        {projeto.prazo_interno && (
                          <span style={{ fontSize: '0.8rem', color: isAtrasado(projeto.prazo_interno) ? 'var(--danger)' : '#0369a1' }}>
                            Interno: {new Date(projeto.prazo_interno).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.priorityFlag} data-priority={projeto.prioridade}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"></path></svg>
                        {projeto.prioridade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {projetoAtivo && (
        <ProjectModal 
          projeto={projetoAtivo} 
          usuarios={usuarios}
          sessao={sessao}
          onClose={() => setProjetoAtivo(null)}
          onRefresh={() => {
            // Agora apenas deixamos o modal aberto. 
            // O server action fará o revalidatePath, e o useEffect acima 
            // atualizará os dados automaticamente no background!
          }}
        />
      )}
    </>
  );
}
