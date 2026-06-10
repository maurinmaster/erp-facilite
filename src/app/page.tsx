import { getSession, hasPermission } from '@/actions/auth';
import { getDashboardMetrics } from '@/actions/dashboard';
import { Users, CircleDollarSign, Rocket, CheckCircle, BarChart2, AlertOctagon, ListTodo } from 'lucide-react';
import styles from './dashboard.module.css';
import Link from 'next/link';
import DashboardCharts from './components/DashboardCharts';
import ClientesEmAndamento from './components/ClientesEmAndamento';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  const metrics = await getDashboardMetrics();

  // Permissões
  const hasPermissoesClientesFull = await hasPermission('clientes', 'full');
  const hasPermissoesDashboardFull = await hasPermission('dashboard', 'full');
  const dataHoje = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date());
  
  // Formatadores
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Cálculos do Gráfico de Progresso
  const { statusProducao, projetosTotal } = metrics;
  const getPercent = (val: number) => projetosTotal === 0 ? 0 : Math.round((val / projetosTotal) * 100);

  const getStatusCount = (name: string) => statusProducao.find(s => s.name === name)?.value || 0;
  const countFila = getStatusCount('Na Fila');
  const countProducao = getStatusCount('Em Produção');
  const countAprovInt = getStatusCount('Aprovação Interna');
  const countAprovCli = getStatusCount('Aguardando Cliente');
  const countCorrigindo = getStatusCount('Corrigindo');
  const countFinalizado = getStatusCount('Finalizado');

  const filaWidth = getPercent(countFila);
  const producaoWidth = getPercent(countProducao);
  const aprovIntWidth = getPercent(countAprovInt);
  const aprovCliWidth = getPercent(countAprovCli);
  const corrigindoWidth = getPercent(countCorrigindo);
  const finalizadoWidth = getPercent(countFinalizado);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.welcomeHeader}>
        <div>
          <h1 className={styles.welcomeTitle}>Olá, {session?.nome?.split(' ')[0]} 👋</h1>
          <div className={styles.welcomeDate}>Bem-vindo ao Facilite ERP • {dataHoje.charAt(0).toUpperCase() + dataHoje.slice(1)}</div>
        </div>
        {hasPermissoesClientesFull && (
          <Link href="/clientes/novo" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
            + Novo Cliente
          </Link>
        )}
      </div>

      <div className={styles.kpiGrid}>
        {hasPermissoesDashboardFull && (
          <>
            <div className={styles.kpiCard} style={{ '--primary': '#3b82f6' } as React.CSSProperties}>
              <div className={styles.kpiIconWrapper}><Users size={24} /></div>
              <div className={styles.kpiLabel}>Clientes Ativos</div>
              <div className={styles.kpiValue}>{metrics.totalClientes}</div>
              <div className={styles.kpiSubtext}>Total de clientes em carteira</div>
            </div>
            <div className={styles.kpiCard} style={{ '--primary': '#10b981' } as React.CSSProperties}>
              <div className={styles.kpiIconWrapper}><CircleDollarSign size={24} /></div>
              <div className={styles.kpiLabel}>Receita (MRR)</div>
              <div className={styles.kpiValue}>{formatCurrency(metrics.receitaAtiva)}</div>
              <div className={styles.kpiSubtext}>Soma dos contratos ativos</div>
            </div>
          </>
        )}

        <div className={styles.kpiCard} style={{ '--primary': '#8b5cf6' } as React.CSSProperties}>
          <div className={styles.kpiIconWrapper}><Rocket size={24} /></div>
          <div className={styles.kpiLabel}>Projetos em Andamento</div>
          <div className={styles.kpiValue}>{metrics.projetosTotal - countFinalizado}</div>
          <div className={styles.kpiSubtext}>Sendo produzidos ou em fila</div>
        </div>

        <div className={styles.kpiCard} style={{ '--primary': '#f59e0b' } as React.CSSProperties}>
          <div className={styles.kpiIconWrapper}><CheckCircle size={24} /></div>
          <div className={styles.kpiLabel}>Total Entregues</div>
          <div className={styles.kpiValue}>{metrics.projetosConcluidosMensal}</div>
          <div className={styles.kpiSubtext}>Projetos finalizados com sucesso</div>
        </div>
      </div>

      {/* Gráficos Recharts */}
      <DashboardCharts 
        clientesPorServico={metrics.clientesPorServico}
        entregasDaSemana={metrics.entregasDaSemana}
        pendenciasPorResponsavel={metrics.pendenciasPorResponsavel}
      />

      <div className={styles.contentGrid}>
        {/* Lado Esquerdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Gráfico Visual de Produção */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={20} className={styles.sectionIcon} /> Visão Geral da Produção ({projetosTotal} projetos)
            </div>
            
            {projetosTotal === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhum projeto registrado no sistema.</p>
            ) : (
              <>
                <div className={styles.progressWrapper}>
                  {filaWidth > 0 && <div className={styles.progressSegment} style={{ width: `${filaWidth}%`, background: '#3b82f6' }} title="Na Fila"></div>}
                  {producaoWidth > 0 && <div className={styles.progressSegment} style={{ width: `${producaoWidth}%`, background: '#eab308' }} title="Em Produção"></div>}
                  {aprovIntWidth > 0 && <div className={styles.progressSegment} style={{ width: `${aprovIntWidth}%`, background: '#a855f7' }} title="Aprovação Interna"></div>}
                  {aprovCliWidth > 0 && <div className={styles.progressSegment} style={{ width: `${aprovCliWidth}%`, background: '#f97316' }} title="Aguardando Cliente"></div>}
                  {corrigindoWidth > 0 && <div className={styles.progressSegment} style={{ width: `${corrigindoWidth}%`, background: '#ef4444' }} title="Corrigindo"></div>}
                  {finalizadoWidth > 0 && <div className={styles.progressSegment} style={{ width: `${finalizadoWidth}%`, background: '#14b8a6' }} title="Finalizado"></div>}
                </div>
                
                <div className={styles.progressLegend}>
                  <div className={styles.legendItem}><div className={styles.legendColor} style={{background: '#3b82f6'}}></div> Na Fila ({countFila})</div>
                  <div className={styles.legendItem}><div className={styles.legendColor} style={{background: '#eab308'}}></div> Em Produção ({countProducao})</div>
                  <div className={styles.legendItem}><div className={styles.legendColor} style={{background: '#a855f7'}}></div> Aprov. Interna ({countAprovInt})</div>
                  <div className={styles.legendItem}><div className={styles.legendColor} style={{background: '#f97316'}}></div> Aguard. Cliente ({countAprovCli})</div>
                  <div className={styles.legendItem}><div className={styles.legendColor} style={{background: '#ef4444'}}></div> Corrigindo ({countCorrigindo})</div>
                  <div className={styles.legendItem}><div className={styles.legendColor} style={{background: '#14b8a6'}}></div> Finalizado ({countFinalizado})</div>
                </div>
              </>
            )}
          </div>

          {/* Urgências */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={20} className={styles.sectionIcon} /> Atenção Requerida (Urgentes ou Atrasados)
            </div>
            {metrics.projetosUrgentes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum projeto com tag de Urgência no momento. Ótimo trabalho!</p>
            ) : (
              <div className={styles.urgentList}>
                {metrics.projetosUrgentes.map(p => (
                  <div key={p.id} className={styles.urgentCard}>
                    <div>
                      <div className={styles.urgentTitle}>{p.servico_nome}</div>
                      <div className={styles.urgentSub}>{p.cliente_nome} • Status: {p.status}</div>
                    </div>
                    <Link href={`/producao?projeto_id=${p.id}`} className="btn" style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', textDecoration: 'none' }}>
                      Ir para Kanban
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Minhas Tarefas / Meus Projetos */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListTodo size={20} className={styles.sectionIcon} /> Minhas Tarefas (Projetos Atribuídos)
            </div>
            {metrics.meusProjetos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Você não possui projetos atribuídos no momento.</p>
            ) : (
              <div className={styles.urgentList}>
                {metrics.meusProjetos.map(p => (
                  <div key={p.id} className={styles.urgentCard} style={{ borderLeftColor: 'var(--primary)', background: 'var(--surface)' }}>
                    <div>
                      <div className={styles.urgentTitle} style={{ color: 'var(--text-main)' }}>{p.servico_nome}</div>
                      <div className={styles.urgentSub}>{p.cliente_nome} • Etapa: <strong style={{ color: 'var(--primary)' }}>{p.status}</strong></div>
                    </div>
                    <Link href={`/producao?projeto_id=${p.id}`} className="btn" style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}>
                      Acessar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clientes em Andamento */}
          <ClientesEmAndamento clientes={metrics.clientesEmAndamento} />
        </div>

        {/* Lado Direito: Timeline/Log */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionTitle}>
            🕒 Atividades Recentes
          </div>
          
          <div className={styles.timeline}>
            {metrics.recentLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sem atividades recentes.</p>
            ) : (
              metrics.recentLogs.map(log => {
                const date = new Date(log.created_at);
                const timeString = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const dateString = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                
                const formatarAcao = (acao: string) => {
                  switch (acao) {
                    case 'CREATE': return 'criou o projeto';
                    case 'UPDATE_STATUS': return 'alterou a etapa do projeto';
                    case 'ASSIGN': return 'atribuiu responsáveis';
                    case 'UNASSIGN': return 'removeu responsáveis';
                    case 'CONFIG_CHANGE': return 'atualizou configurações';
                    case 'CHECKLIST_STATUS': return 'atualizou o status de uma tarefa';
                    case 'CHECKLIST_ADD': return 'adicionou uma tarefa ao checklist';
                    case 'CHECKLIST_DELETE': return 'removeu uma tarefa do checklist';
                    default: return acao.toLowerCase().replace(/_/g, ' ');
                  }
                };
                
                return (
                  <div key={log.id} className={styles.timelineItem}>
                    <div className={styles.timelineTime}>{dateString} às {timeString}</div>
                    <div className={styles.timelineAction}>
                      <span className={styles.timelineUser}>{log.usuario_nome || 'Sistema'}</span> {formatarAcao(log.acao)} <br/>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontStyle: 'italic', display: 'block', margin: '4px 0' }}>
                        "{log.detalhes}"
                      </span>
                      {log.servico_nome && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.servico_nome} ({log.cliente_nome})</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link href="/producao" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Ver quadro completo &rarr;
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
