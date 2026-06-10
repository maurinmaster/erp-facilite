import Link from 'next/link';
import ServicoForm from './ServicoForm';
import { getBriefingTemplates } from '@/actions/briefing';
import styles from '../../clientes/clientes.module.css';

export default async function NovoServicoCatalogoPage() {
  const briefingTemplates = await getBriefingTemplates();
  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Cadastrar Serviço no Catálogo</h1>
          <p className="page-description">
            Crie um novo serviço e defina o fluxo de tarefas padrão para a produção.
          </p>
        </div>
        <Link href="/catalogo" className={styles.secondaryButton}>
          &larr; Voltar
        </Link>
      </div>

      <ServicoForm briefingTemplates={briefingTemplates} />
    </div>
  );
}
