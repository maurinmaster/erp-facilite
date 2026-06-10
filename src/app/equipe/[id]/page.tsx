import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEquipe } from '@/actions/auth';
import { getEstatisticasMembro } from '@/actions/estatisticas';
import styles from '../equipe.module.css';

export const dynamic = 'force-dynamic';

export default async function MembroProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuarioId = parseInt(id, 10);
  
  if (isNaN(usuarioId)) notFound();

  const equipe = await getEquipe();
  const membro = equipe.find(m => m.id === usuarioId);
  if (!membro) notFound();

  const stats = await getEstatisticasMembro(usuarioId);

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Desempenho: {membro.nome}</h1>
          <p className="page-description">{membro.email} | Nível: {membro.perfil}</p>
        </div>
        <Link href="/equipe" className={styles.secondaryButton}>
          &larr; Voltar
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Tarefas Pendentes</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.tarefas_pendentes}</p>
        </div>
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Tarefas Concluídas</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.tarefas_concluidas}</p>
        </div>
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Tempo Médio de Tratativa</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ea580c' }}>
            {stats.tempo_medio_horas < 1 && stats.tempo_medio_horas > 0 
              ? `${Math.round(stats.tempo_medio_horas * 60)} min`
              : `${stats.tempo_medio_horas.toFixed(1)}h`}
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Histórico Geral de Atividades</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '12px' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '16px', width: '2px', background: '#e5e7eb' }}></div>

          {stats.logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', marginLeft: '16px' }}>Nenhuma atividade registrada.</p>
          ) : (
            stats.logs.map((log) => (
              <div key={log.id + log.tipo} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: log.tipo === 'CRM' ? '#ea580c' : 'var(--primary)', marginTop: '6px', boxShadow: '0 0 0 4px #ffffff' }}></div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                    <strong style={{ color: log.tipo === 'CRM' ? '#ea580c' : 'var(--primary)' }}>{log.tipo}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(log.criado_em).toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {log.detalhes}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
