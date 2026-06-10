import { getProjetosKanban } from '@/actions/producao';
import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import KanbanBoard from './KanbanBoard';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ProducaoPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Busca os Projetos enriquecidos
  const projetos = await getProjetosKanban();

  // Busca os usuários da equipe para Atribuição no Modal
  const [usuariosRows] = await pool.query('SELECT id, nome, perfil FROM usuarios ORDER BY nome ASC');
  const usuarios = usuariosRows as any[];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>
            Produção
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Gerencie os serviços em andamento e as tarefas da agência.</p>
        </div>
      </div>
      
      <KanbanBoard projetosIniciais={projetos} usuarios={usuarios} sessao={session} />
    </div>
  );
}
