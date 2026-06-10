'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enviarMensagem } from '@/actions/correio';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Image as ImageIcon, Link as LinkIcon, Send, AlertTriangle, ArrowLeft } from 'lucide-react';
import NextLink from 'next/link';
import { io } from 'socket.io-client';

interface Destinatario {
  id: number;
  nome: string;
  perfil: string;
}

interface Props {
  destinatariosPossiveis: Destinatario[];
  canSendPopup: boolean;
  initialAssunto?: string;
  initialCorpo?: string;
  initialDestinatarios?: number[];
}

export default function NovaMensagemClient({ destinatariosPossiveis, canSendPopup, initialAssunto = '', initialCorpo = '', initialDestinatarios = [] }: Props) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<number[]>(initialDestinatarios);
  const [assunto, setAssunto] = useState(initialAssunto);
  const [isPopup, setIsPopup] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
    ],
    content: initialCorpo,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  const handleToggleDestinatario = (id: number) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selecionados.length === destinatariosPossiveis.length) {
      setSelecionados([]);
    } else {
      setSelecionados(destinatariosPossiveis.map(d => d.id));
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/correio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Falha ao fazer upload da imagem');
      }

      const data = await res.json();
      if (data.url && editor) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar imagem.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selecionados.length === 0) {
      setError('Selecione pelo menos um destinatário.');
      return;
    }

    if (!assunto.trim()) {
      setError('O assunto é obrigatório.');
      return;
    }

    const html = editor?.getHTML() || '';
    if (html === '<p></p>' || !html.trim()) {
      setError('A mensagem não pode estar vazia.');
      return;
    }

    try {
      setEnviando(true);
      await enviarMensagem(selecionados, assunto, html, isPopup);
      
      // Notificar via WebSocket se for popup
      if (isPopup) {
        const socket = io();
        socket.emit('novo_popup', { assunto, lidos: [] });
      }

      router.push('/correio');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <NextLink href="/correio" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </NextLink>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, flex: 1 }}>Nova Mensagem</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px' }}>
        <input 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
        />
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontWeight: 600 }}>Destinatários</label>
            <button type="button" onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
              {selecionados.length === destinatariosPossiveis.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            maxHeight: '120px',
            overflowY: 'auto',
            padding: '12px',
            border: '1px solid var(--border)',
            borderRadius: '6px'
          }}>
            {destinatariosPossiveis.map(d => (
              <label key={d.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: selecionados.includes(d.id) ? 'var(--primary)' : 'var(--bg-main)',
                color: selecionados.includes(d.id) ? '#fff' : 'var(--text-main)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox" 
                  checked={selecionados.includes(d.id)} 
                  onChange={() => handleToggleDestinatario(d.id)}
                  style={{ display: 'none' }}
                />
                {d.nome}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Assunto</label>
          <input 
            type="text" 
            value={assunto}
            onChange={e => setAssunto(e.target.value)}
            placeholder="Digite o assunto da mensagem..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* TipTap Toolbar */}
        <div style={{ border: '1px solid var(--border)', borderBottom: 'none', borderRadius: '6px 6px 0 0', padding: '8px', display: 'flex', gap: '8px', background: '#f9fafb' }}>
          <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} style={{ padding: '6px 10px', background: editor?.isActive('bold') ? '#e5e7eb' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>B</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} style={{ padding: '6px 10px', background: editor?.isActive('italic') ? '#e5e7eb' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontStyle: 'italic' }}>I</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} style={{ padding: '6px 10px', background: editor?.isActive('strike') ? '#e5e7eb' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', textDecoration: 'line-through' }}>S</button>
          <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
          <button type="button" onClick={setLink} style={{ padding: '6px 10px', background: editor?.isActive('link') ? '#e5e7eb' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><LinkIcon size={16} /></button>
          <button type="button" onClick={addImage} style={{ padding: '6px 10px', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ImageIcon size={16} /></button>
        </div>
        
        <EditorContent editor={editor} style={{ border: '1px solid var(--border)', borderRadius: '0 0 6px 6px', minHeight: '250px', padding: '16px', flex: 1, overflowY: 'auto' }} />

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {canSendPopup ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={isPopup}
                onChange={e => setIsPopup(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Enviar como ALERTA (Popup na tela)
            </label>
          ) : <div />}

          <button 
            type="submit" 
            disabled={enviando}
            style={{
              padding: '12px 24px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {enviando ? 'Enviando...' : (
              <>
                <Send size={18} /> Enviar Mensagem
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
