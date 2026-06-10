import { getSession } from '@/actions/auth';
import { getUsuariosDestinatarios, getMensagemDetalhes } from '@/actions/correio';
import { redirect } from 'next/navigation';
import NovaMensagemClient from '@/app/correio/nova/NovaMensagemClient';

export const dynamic = 'force-dynamic';

export default async function NovaMensagemPage({ searchParams }: { searchParams?: Promise<{ reply?: string, forward?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const usuarios = await getUsuariosDestinatarios();
  const destinatarios = usuarios.filter(u => u.id !== session.id);

  const permissoes = session.permissoes || {};
  const canSendPopup = session.perfil === 'Admin' || permissoes.enviar_alertas === 'full';

  let initialAssunto = '';
  let initialCorpo = '';
  let initialDestinatarios: number[] = [];

  if (searchParams) {
    const resolvedParams = await searchParams;
    if (resolvedParams?.reply) {
      const original = await getMensagemDetalhes(Number(resolvedParams.reply));
      if (original) {
        initialAssunto = `RE: ${original.assunto.replace(/^RE:\s*/i, '')}`;
        initialCorpo = `<br/><br/><br/><blockquote><strong>De:</strong> ${original.remetente_nome}<br/><strong>Data:</strong> ${new Date(original.created_at).toLocaleString('pt-BR')}<br/><strong>Assunto:</strong> ${original.assunto}<br/><br/>${original.corpo}</blockquote>`;
        initialDestinatarios = [original.remetente_id];
      }
    } else if (resolvedParams?.forward) {
      const original = await getMensagemDetalhes(Number(resolvedParams.forward));
      if (original) {
        initialAssunto = `ENC: ${original.assunto.replace(/^ENC:\s*/i, '')}`;
        initialCorpo = `<br/><br/><br/>---------- Mensagem Encaminhada ----------<br/><strong>De:</strong> ${original.remetente_nome}<br/><strong>Data:</strong> ${new Date(original.created_at).toLocaleString('pt-BR')}<br/><strong>Assunto:</strong> ${original.assunto}<br/><br/><blockquote>${original.corpo}</blockquote>`;
      }
    }
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Nova Mensagem</h1>
      </div>

      <NovaMensagemClient 
        destinatariosPossiveis={destinatarios} 
        canSendPopup={canSendPopup} 
        initialAssunto={initialAssunto}
        initialCorpo={initialCorpo}
        initialDestinatarios={initialDestinatarios}
      />
    </div>
  );
}
