import Link from 'next/link';
import { getSession } from '@/actions/auth';
import { getEquipeWithStats } from '@/actions/equipeStats';
import { getPerfis } from '@/actions/permissoes';
import EquipeActions from './EquipeActions';
import AvatarUpload from './AvatarUpload';
import { ChevronRight, Users, CheckSquare, CheckCircle2, AlertTriangle, Mail, Phone } from 'lucide-react';
import styles from './equipe.module.css';

export const dynamic = 'force-dynamic';

export default async function EquipePage() {
  const session = await getSession();
  const equipe = await getEquipeWithStats();
  const perfis = await getPerfis();
  const perfisValidos = perfis.map(p => p.nome);

  return (
    <div className="container">
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Gestão da Equipe</h1>
          <p className="page-description">Gerencie os acessos, permissões e perfis da sua agência</p>
        </div>
        {(session?.perfil === 'Admin') && (
          <Link href="/equipe/novo" className={styles.primaryButton}>
            + Novo Membro
          </Link>
        )}
      </div>

      <div className={styles.grid}>
        {equipe.map((membro) => {
          const isSelfOrAdmin = session?.id === membro.id || session?.perfil === 'Admin' || session?.perfil === 'Gestor';
          
          return (
            <div key={membro.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardUserInfo}>
                  <AvatarUpload 
                    usuarioId={membro.id} 
                    nome={membro.nome} 
                    fotoUrl={membro.foto_url} 
                    isSelfOrAdmin={isSelfOrAdmin} 
                  />
                  <div className={styles.cardText}>
                    <h3 className={styles.cardName}>{membro.nome}</h3>
                    <p className={styles.cardRole}>{membro.perfil}</p>
                    {membro.telefone ? (
                      <div className={styles.cardEmail}>
                        <Phone size={12} /> {membro.telefone}
                      </div>
                    ) : (
                      <div className={styles.cardEmail}>
                        <Mail size={12} /> {membro.email}
                      </div>
                    )}
                  </div>
                </div>
                
                {isSelfOrAdmin && (
                  <Link href={`/equipe/${membro.id}`} className={styles.cardActionRight}>
                    <ChevronRight size={20} />
                  </Link>
                )}
              </div>
              
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <div className={styles.statValue}>
                    <Users size={16} color="#22c55e" /> {membro.clientesCount}
                  </div>
                  <div className={styles.statLabel}>Clientes</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statValue}>
                    <CheckSquare size={16} color="#22c55e" /> {membro.tarefasPendentes}
                  </div>
                  <div className={styles.statLabel}>Tarefas</div>
                </div>
              </div>

              <div className={styles.badgeRow}>
                {membro.tarefasAtrasadas > 0 ? (
                  <div className={`${styles.badge} ${styles.badgeAtrasada}`}>
                    <AlertTriangle size={12} /> {membro.tarefasAtrasadas} atrasada{membro.tarefasAtrasadas > 1 ? 's' : ''}
                  </div>
                ) : (
                  <div className={`${styles.badge} ${styles.badgeEmDia}`}>
                    <CheckCircle2 size={12} /> Em dia
                  </div>
                )}
              </div>

              <div className={styles.progressContainer}>
                <div className={styles.progressText}>
                  <span>Taxa de conclusão</span>
                  <span>{membro.taxaConclusao}%</span>
                </div>
                <div className={styles.progressBarBg}>
                  <div 
                    className={styles.progressBarFill} 
                    style={{ width: `${membro.taxaConclusao}%`, backgroundColor: membro.taxaConclusao > 0 ? '#22c55e' : '#e2e8f0' }}
                  ></div>
                </div>
              </div>

              {session?.perfil === 'Admin' && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <EquipeActions 
                    usuarioId={membro.id} 
                    isSelf={session.id === membro.id} 
                    perfisValidos={perfisValidos} 
                  />
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
