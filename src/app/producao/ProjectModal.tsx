'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './producao.module.css';
import { addComentario, updateProjetoConfig, assignResponsavel, removeResponsavel, updateChecklistStatus, addChecklistItem, deleteChecklistItem, assignChecklistItem } from '@/actions/producao';
import TipTapEditor, { TipTapRef } from '@/app/components/TipTapEditor';
import EmojiPicker from 'emoji-picker-react';

interface ProjectModalProps {
  projeto: any;
  usuarios: any[];
  sessao: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ProjectModal({ projeto, usuarios, sessao, onClose, onRefresh }: ProjectModalProps) {
  const [activeTab, setActiveTab] = useState<'config'|'checklist'|'briefing'|'comentarios'|'historico'>('config');
  // Local state for config form
  const [prioridade, setPrioridade] = useState(projeto.prioridade || 'Normal');
  const [prazo, setPrazo] = useState(projeto.prazo ? new Date(projeto.prazo).toISOString().split('T')[0] : '');
  
  // Local state for new checklist item
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistUserId, setNewChecklistUserId] = useState('');

  // Local state for Comments
  const [comentario, setComentario] = useState('');
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<TipTapRef>(null);

  const canAssign = sessao?.permissoes?.producao === 'full';
  const canEditChecklist = sessao?.permissoes?.producao === 'full' || sessao?.permissoes?.producao === 'limited';
  const canManageChecklist = sessao?.permissoes?.producao === 'full';

  const briefing = projeto.dados_acordados || {};

  const handleSalvarConfig = async () => {
    try {
      await updateProjetoConfig(projeto.projeto_id, { 
        prioridade, 
        prazo: prazo || undefined 
      });
      onRefresh();
      alert("Configurações atualizadas!");
    } catch (error: any) {
      alert(error.message || "Erro ao salvar.");
    }
  };

  const handleAddComentario = async () => {
    if (!comentario.trim() && !anexoFile) return;
    try {
      const formData = new FormData();
      formData.append('projetoId', String(projeto.projeto_id));
      formData.append('usuarioId', '1'); // FIXME: Puxar do auth real
      formData.append('comentario', comentario);
      if (anexoFile) {
        formData.append('anexo', anexoFile);
      }

      await addComentario(formData);
      
      setComentario('');
      setAnexoFile(null);
      onRefresh();
    } catch (e) {
      alert("Erro ao enviar comentário.");
    }
  };

  const insertMention = (nome: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(`@${nome} `);
    } else {
      setComentario(prev => prev + `@${nome} `);
    }
    setShowMentionMenu(false);
  };

  const formatCommentText = (text: string) => {
    if (!text) return null;
    
    // Divide por espaço para processar palavras
    const words = text.split(/(\s+)/);
    
    return words.map((word, i) => {
      // É uma menção?
      if (word.startsWith('@') && word.length > 1) {
        const cleanName = word.substring(1).replace(/[.,!?]$/, ''); // Remove pontuações do final
        const matchedUser = usuarios.find(u => u.nome.toLowerCase() === cleanName.toLowerCase());
        
        if (matchedUser && matchedUser.foto_url) {
          return (
            <span key={i} className={styles.mentionHighlight} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <img src={matchedUser.foto_url} alt={matchedUser.nome} style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
              {word}
            </span>
          );
        }

        return <span key={i} className={styles.mentionHighlight}>{word}</span>;
      }
      // É um link?
      if (word.startsWith('http://') || word.startsWith('https://')) {
        return <a key={i} href={word} target="_blank" rel="noreferrer" className={styles.linkHighlight}>{word}</a>;
      }
      return word;
    });
  };

  // Correção: Enviar usuário real. Vou ajustar a prop depois, por hora envio ID 1.

  const handleAssign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = Number(e.target.value);
    if (!userId) return;
    try {
      await assignResponsavel(projeto.projeto_id, userId);
      // Resetar o dropdown para a opção vazia
      e.target.value = "";
      onRefresh();
    } catch (e) {
      alert("Erro ao atribuir.");
    }
  };

  const handleRemoveAssign = async (userId: number) => {
    try {
      await removeResponsavel(projeto.projeto_id, userId);
      onRefresh();
    } catch (e) {
      alert("Erro ao remover.");
    }
  };

  const handleToggleChecklist = async (tarefaId: number, currentStatus: string) => {
    if (!canEditChecklist) return;
    const newStatus = currentStatus === 'Concluída' ? 'Pendente' : 'Concluída';
    try {
      await updateChecklistStatus(tarefaId, newStatus);
      onRefresh();
    } catch (e) {
      alert("Erro ao atualizar checklist.");
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      await addChecklistItem(
        projeto.projeto_id, 
        newChecklistTitle, 
        newChecklistUserId ? Number(newChecklistUserId) : undefined
      );
      setNewChecklistTitle('');
      setNewChecklistUserId('');
      onRefresh();
    } catch (e) {
      alert("Erro ao adicionar item no checklist.");
    }
  };

  const handleAssignChecklist = async (tarefaId: number, uId: number | null) => {
    if (!canManageChecklist) return;
    try {
      await assignChecklistItem(tarefaId, uId);
      onRefresh();
    } catch (e) {
      alert("Erro ao atribuir usuário à tarefa.");
    }
  };

  const handleDeleteChecklist = async (tarefaId: number) => {
    if (!canManageChecklist) return;
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      await deleteChecklistItem(tarefaId);
      onRefresh();
    } catch (e) {
      alert("Erro ao excluir item.");
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{projeto.servico_nome}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cliente: {projeto.cliente_nome}</div>
          </div>
          <button className={styles.btnClose} onClick={onClose} title="Fechar"><X size={20} /></button>
        </div>

        <div className={styles.modalTabs}>
          {['config', 'checklist', 'briefing', 'comentarios', 'historico'].map(tab => (
            <button 
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        <div 
          className={styles.modalBody}
          style={{ 
            overflowY: activeTab === 'comentarios' ? 'hidden' : 'auto',
            display: activeTab === 'comentarios' ? 'flex' : 'block',
            flexDirection: 'column'
          }}
        >
          {activeTab === 'config' && (
            <div>
              <h3>Configurações e Atribuições</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className={styles.formGroup}>
                  <label>Prioridade</label>
                  <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    {(sessao?.perfil === 'Admin' || sessao?.perfil === 'Gestor' || projeto.prioridade === 'Urgente') && (
                      <option value="Urgente">Urgente</option>
                    )}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Prazo de Entrega</label>
                  <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
                </div>
              </div>
              <button className={styles.btnPrimary} onClick={handleSalvarConfig}>Salvar Configurações</button>

              <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

              {canAssign && (
                <div className={styles.formGroup}>
                  <label>Atribuir Membro da Equipe</label>
                  <select onChange={handleAssign} value="">
                    <option value="">Selecione um usuário...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.perfil})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <h4>Responsáveis Atuais</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {projeto.responsaveis.map((r: any) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background)', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      {r.nome}
                      {canAssign && (
                        <span style={{ color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleRemoveAssign(r.id)}>&times;</span>
                      )}
                    </div>
                  ))}
                  {projeto.responsaveis.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ninguém atribuído.</span>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div>
              <h3>Checklist de Produção</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Marque as tarefas conforme forem concluídas ou delegue novas tarefas para a equipe.
              </p>
              
              {canManageChecklist && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                  <input 
                    type="text" 
                    placeholder="Adicionar nova tarefa..." 
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddChecklist();
                    }}
                  />
                  <select 
                    value={newChecklistUserId} 
                    onChange={(e) => setNewChecklistUserId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  >
                    <option value="">Responsável</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                  <button onClick={handleAddChecklist} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Adicionar
                  </button>
                </div>
              )}

              {projeto.checklist.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Este serviço ainda não possui tarefas no checklist.</p>
              ) : (
                projeto.checklist.map((item: any) => (
                  <div key={item.id} className={`${styles.checklistItem} ${item.status === 'Concluída' ? styles.done : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={item.status === 'Concluída'} 
                        onChange={() => handleToggleChecklist(item.id, item.status)} 
                        disabled={!canEditChecklist}
                        style={{ width: '16px', height: '16px', cursor: canEditChecklist ? 'pointer' : 'default' }}
                      />
                      <div style={{ flex: 1, textDecoration: item.status === 'Concluída' ? 'line-through' : 'none', color: item.status === 'Concluída' ? 'var(--text-muted)' : 'var(--text-main)', cursor: canEditChecklist ? 'pointer' : 'default' }} onClick={() => handleToggleChecklist(item.id, item.status)}>
                        {item.titulo}
                      </div>
                      
                      {canManageChecklist ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select 
                            value={item.usuario_id || ''} 
                            onChange={(e) => handleAssignChecklist(item.id, e.target.value ? Number(e.target.value) : null)}
                            style={{ fontSize: '0.75rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                          >
                            <option value="">Sem responsável</option>
                            {usuarios.map(u => (
                              <option key={u.id} value={u.id}>{u.nome}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => handleDeleteChecklist(item.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', fontSize: '1rem' }}
                            title="Excluir tarefa"
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        item.usuario_id ? (
                          <span className={styles.checklistAssigneeText} style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--surface)', borderRadius: '4px' }}>
                            {usuarios.find(u => u.id === item.usuario_id)?.nome || 'Usuário'}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'briefing' && (
            <div>
               {/* Re-using same logic as old BriefingModal */}
              {Object.entries(briefing).map(([key, value]) => {
                if (key === 'acessos' || key === 'anexos' || key === 'observacoes') return null;
                
                const renderValue = (val: any): React.ReactNode => {
                  if (val === null || val === undefined || val === '') return 'Não informado';
                  if (Array.isArray(val)) {
                    if (val.length === 0) return 'Não informado';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {val.map((item, idx) => (
                          <div key={idx} style={{ paddingLeft: '8px', borderLeft: '2px solid var(--border)' }}>
                            {renderValue(item)}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (typeof val === 'object') {
                    if (Object.keys(val).length === 0) return 'Não informado';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        {Object.entries(val).map(([subKey, subVal]) => (
                          <div key={subKey} style={{ background: 'rgba(0,0,0,0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '6px' }}>{subKey}:</span>
                            <span style={{ color: 'var(--text-main)' }}>{renderValue(subVal)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // Se for string com cara de URL, transforma em link
                  if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
                    return <a href={val} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{val}</a>;
                  }

                  return String(val);
                };

                const displayValue = renderValue(value);

                return (
                  <div key={key} style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.95rem', background: (typeof value === 'object' && value !== null) ? 'transparent' : 'var(--background)', padding: (typeof value === 'object' && value !== null) ? '0' : '8px 12px', borderRadius: '4px', marginTop: '4px', border: (typeof value === 'object' && value !== null) ? 'none' : '1px solid var(--border)' }}>
                      {displayValue}
                    </div>
                  </div>
                );
              })}

              {briefing.observacoes && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>Observações</h4>
                  <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{briefing.observacoes}</div>
                </div>
              )}

              {briefing.anexos && briefing.anexos.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>Anexos</h4>
                  {briefing.anexos.map((anexo: any, index: number) => (
                    <a key={index} href={anexo.url} target="_blank" rel="noreferrer" style={{ display: 'block', color: 'var(--primary)', textDecoration: 'none', marginBottom: '4px' }}>
                      {anexo.nome}: {anexo.url}
                    </a>
                  ))}
                </div>
              )}

              {briefing.acessos && briefing.acessos.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>Acessos (Descriptografados)</h4>
                  {briefing.acessos.map((acesso: any, index: number) => (
                    <div key={index} style={{ background: 'var(--background)', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '8px' }}>
                      <strong>{acesso.plataforma}</strong><br/>
                      Login: {acesso.login}<br/>
                      Senha: {acesso.senha || 'Não informada'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comentarios' && (
            <div className={styles.chatContainer} style={{ flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                {projeto.comentarios.map((c: any) => (
                  <div key={c.id} className={styles.commentBox}>
                    <div className={styles.commentHeader} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={styles.avatar} style={{ width: '24px', height: '24px', fontSize: '10px', ...(c.foto_url ? { padding: 0, background: 'none' } : {}) }}>
                        {c.foto_url ? (
                          <img src={c.foto_url} alt={c.autor} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          c.autor.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{c.autor}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.criado_em).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    {c.comentario?.includes('<p>') ? (
                      <div 
                        className={styles.commentRichText} 
                        dangerouslySetInnerHTML={{ __html: c.comentario }} 
                      />
                    ) : (
                      <div className={styles.commentText}>
                        {formatCommentText(c.comentario)}
                      </div>
                    )}
                    {c.anexo_url && (
                      <a href={c.anexo_url} target="_blank" rel="noreferrer" className={styles.anexoCard}>
                        📎 {c.anexo_nome || 'Baixar Anexo'}
                      </a>
                    )}
                  </div>
                ))}
                {projeto.comentarios.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhum comentário ainda.</p>}
              </div>

              <div className={styles.commentInputArea} style={{ position: 'relative', flexShrink: 0 }}>
                <TipTapEditor 
                  value={comentario}
                  onChange={setComentario}
                  ref={editorRef}
                  footerLeft={
                    <>
                      <button className={styles.tiptapBtn} onClick={() => setShowMentionMenu(!showMentionMenu)} title="Mencionar pessoa">
                        @
                      </button>
                      <button className={styles.tiptapBtn} onClick={() => fileInputRef.current?.click()} title="Anexar arquivo externo">
                        📎
                      </button>
                      <button className={styles.tiptapBtn} onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Inserir Emoji">
                        😀
                      </button>
                    </>
                  }
                  footerRight={
                    <button onClick={handleAddComentario} className={styles.primaryBtn} disabled={!comentario.trim()} style={{ padding: '6px 16px', fontSize: '0.9rem', borderRadius: '6px' }}>
                      ➤ Enviar
                    </button>
                  }
                />
                
                {showMentionMenu && (
                  <div className={styles.mentionDropdown}>
                    {usuarios.map(u => (
                      <div key={u.id} className={styles.mentionItem} onClick={() => insertMention(u.nome)}>
                        {u.nome}
                      </div>
                    ))}
                  </div>
                )}

                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 1000, marginBottom: '8px' }}>
                    <EmojiPicker 
                      onEmojiClick={(emojiData) => {
                        editorRef.current?.insertText(emojiData.emoji);
                        setShowEmojiPicker(false);
                      }} 
                    />
                  </div>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setAnexoFile(e.target.files[0]);
                    }
                  }} 
                />

                {anexoFile && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '8px' }}>
                    📎 Arquivo selecionado: {anexoFile.name} 
                    <button onClick={() => setAnexoFile(null)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', marginLeft: '8px' }}>&times;</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'historico' && (
            <div className={styles.tabContent}>
              <h3 className={styles.sectionTitle}>Histórico de Atividades</h3>
              <div className={styles.timeline}>
                {(!projeto.logs || projeto.logs.length === 0) && (
                  <p className={styles.emptyMessage}>Nenhuma atividade registrada ainda.</p>
                )}
                {projeto.logs?.map((log: any) => (
                  <div key={log.id} className={styles.timelineItem}>
                    <div className={styles.timelinePoint}></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <strong>{log.usuario_nome || 'Sistema'}</strong>
                        <span className={styles.timelineDate}>{new Date(log.criado_em).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className={styles.timelineBody}>
                        {log.detalhes}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
