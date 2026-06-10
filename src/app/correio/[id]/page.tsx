import { getSession } from '@/actions/auth';
import { getMensagemDetalhes } from '@/actions/correio';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LeituraMensagemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const mensagem = await getMensagemDetalhes(Number(id));

  if (!mensagem) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px' }}>
        <h2>Mensagem não encontrada ou você não tem acesso.</h2>
        <Link href="/correio" style={{ color: 'var(--primary)', marginTop: '16px', display: 'inline-block' }}>Voltar para o Correio</Link>
      </div>
    );
  }

  const dataFormatada = new Date(mensagem.created_at).toLocaleString('pt-BR');

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/correio" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 className="page-title" style={{ margin: 0 }}>{mensagem.assunto}</h1>
        {mensagem.is_popup && (
          <span style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>POPUP</span>
        )}
      </div>

      <div style={{ flex: 1, background: '#fff', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '1.1rem' }}>
              <User size={18} />
              {mensagem.remetente_nome}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {dataFormatada}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/correio/nova?reply=${mensagem.id}`} style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-main)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>
                  Responder
                </Link>
                <Link href={`/correio/nova?forward=${mensagem.id}`} style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-main)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>
                  Encaminhar
                </Link>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Users size={16} style={{ marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: 500 }}>Para:</span>{' '}
              {mensagem.destinatarios.map(d => d.nome).join(', ')}
            </div>
          </div>
        </div>

        <div 
          style={{ padding: '24px', flex: 1, overflowY: 'auto', lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: mensagem.corpo }}
          className="tiptap-content"
        />
      </div>
    </div>
  );
}
