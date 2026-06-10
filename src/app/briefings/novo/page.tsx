import Link from 'next/link';
import BriefingForm from './BriefingForm';
import styles from '../../clientes/clientes.module.css';
import { requireGestor } from '@/actions/auth';

export default async function NovoBriefingPage() {
  await requireGestor();
  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Criar Template de Briefing</h1>
          <p className="page-description">
            Defina as perguntas essenciais para a execução deste tipo de serviço.
          </p>
        </div>
        <Link href="/briefings" className={styles.secondaryButton}>
          &larr; Voltar
        </Link>
      </div>

      <BriefingForm />
    </div>
  );
}
