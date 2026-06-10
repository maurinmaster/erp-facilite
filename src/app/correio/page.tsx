import { getSession } from '@/actions/auth';
import { getCaixaEntrada, getEnviados } from '@/actions/correio';
import { redirect } from 'next/navigation';
import CorreioClient from '@/app/correio/CorreioClient';

export const dynamic = 'force-dynamic';

export default async function CorreioPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  // Verify permission
  if (session.perfil !== 'Admin') {
    const permissoes = session.permissoes || {};
    if (!permissoes.correio || permissoes.correio === 'none') {
      redirect('/');
    }
  }

  const caixaEntrada = await getCaixaEntrada();
  const enviados = await getEnviados();

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Correio</h1>
        <p className="page-description">Comunicação interna com sua equipe</p>
      </div>

      <CorreioClient caixaEntrada={caixaEntrada} enviados={enviados} />
    </div>
  );
}
