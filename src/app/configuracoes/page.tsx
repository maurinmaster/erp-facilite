import { getSession } from '@/actions/auth';
import { getConfiguracoes } from '@/actions/configuracoes';
import ConfiguracoesClient from './ConfiguracoesClient';
import { redirect } from 'next/navigation';

import { getPerfis } from '@/actions/permissoes';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const session = await getSession();
  if (session?.perfil !== 'Admin') {
    redirect('/');
  }

  const configuracoes = await getConfiguracoes();
  const perfis = await getPerfis();

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Configurações Globais</h1>
        <p className="page-description">Gerencie os parâmetros globais e regras de negócio do sistema</p>
      </div>

      <ConfiguracoesClient configuracoes={configuracoes} perfis={perfis} />
    </div>
  );
}
