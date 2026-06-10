'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../clientes.module.css';
import { deleteItemContrato } from '@/actions/producao';

interface ItemContrato {
  item_id: number;
  valor_fechado: number;
  criado_em: string;
  servico_nome: string;
  servico_tipo: string;
  projeto_status: string;
}

interface Props {
  clienteId: number;
  itens: ItemContrato[];
}

export default function ContractsCard({ clienteId, itens }: Props) {
  const router = useRouter();

  const handleDelete = async (itemId: number) => {
    if (confirm('Tem certeza que deseja excluir este serviço? Esta ação apagará todo o histórico de produção, tarefas e anexos ligados a ele.')) {
      try {
        await deleteItemContrato(itemId, clienteId);
        router.refresh();
      } catch (e) {
        alert("Erro ao excluir serviço.");
      }
    }
  };

  const ativos = itens.filter(item => item.projeto_status !== 'Finalizado' && item.projeto_status !== 'Concluído');
  const historico = itens.filter(item => item.projeto_status === 'Finalizado' || item.projeto_status === 'Concluído');

  const renderCard = (item: ItemContrato, isHistorico: boolean) => (
    <div key={item.item_id} className={`${styles.cleanCard} ${isHistorico ? styles.cleanCardHistorico : ''}`}>
      <div className={styles.cleanCardHeader}>
        <div>
          <h4 className={styles.cleanCardTitle}>{item.servico_nome}</h4>
          <span className={styles.cleanCardSubtitle}>
            {item.servico_tipo}
          </span>
        </div>
        <div className={styles.cleanCardMeta}>
          {new Date(item.criado_em).toLocaleDateString('pt-BR')}
        </div>
      </div>
      
      <div className={styles.cleanCardBody}>
        <div className={styles.cleanCardTags}>
          <span className={`${styles.tag} ${isHistorico ? styles.tagSuccess : styles.tagPrimary}`}>
            {item.projeto_status || 'Briefing'}
          </span>
          <span className={`${styles.tag} ${styles.tagDefault}`}>
            {Number(item.valor_fechado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>
      
      <div className={styles.cleanCardFooter}>
        <button 
          onClick={() => handleDelete(item.item_id)} 
          className={styles.actionBtnDanger}
        >
          Excluir
        </button>
        <Link href={`/clientes/${clienteId}/servicos/${item.item_id}/editar`} className={styles.actionBtnPrimary}>
          Editar
        </Link>
      </div>
    </div>
  );

  return (
    <div className={styles.profileSection} style={{ gridColumn: '1 / -1' }}>
      <div className={styles.sectionHeaderFlex}>
        <h3 className={styles.sectionTitleClean}>Serviços Ativos</h3>
        <Link href={`/clientes/${clienteId}/servicos/novo`} className={styles.primaryButton}>
          + Vender Serviço
        </Link>
      </div>

      <div className={styles.cleanGrid}>
        {ativos.length === 0 ? (
          <div className={styles.emptyStateClean}>Nenhum serviço em andamento.</div>
        ) : (
          ativos.map(item => renderCard(item, false))
        )}
      </div>

      {historico.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <h3 className={styles.sectionTitleClean}>Histórico de Serviços</h3>
          <div className={styles.cleanGrid}>
            {historico.map(item => renderCard(item, true))}
          </div>
        </div>
      )}
    </div>
  );
}
