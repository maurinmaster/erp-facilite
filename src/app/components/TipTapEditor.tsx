'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react';
import styles from '@/app/producao/producao.module.css';

interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
}

export interface TipTapRef {
  insertText: (text: string) => void;
}

// Utilitário para comprimir a imagem via Canvas
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context is null'));
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas to Blob failed'));
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const TipTapEditor = forwardRef<TipTapRef, TipTapEditorProps>(({ value, onChange, placeholder, footerLeft, footerRight }, ref) => {
  const [isUploading, setIsUploading] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const finalPlaceholder = placeholder || "Comente, ou digite '/' para usar comandos";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: styles.tiptapImage,
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: styles.tiptapTaskList,
        },
      }),
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: styles.tiptapLink,
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.tiptapEditorContent,
      },
    },
  });

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editor) {
        editor.chain().focus().insertContent(text).run();
      }
    }
  }));

  useEffect(() => {
    if (editor && value === '' && editor.getHTML() !== '<p></p>') {
      editor.commands.setContent('');
    }
  }, [value, editor]);

  // Lógica do Custom Floating Menu (Notion-style)
  useEffect(() => {
    const updateMenu = () => {
      if (!editor || !editor.view || !wrapperRef.current) {
        setMenuCoords(null);
        return;
      }
      
      // Checa se o editor tá com foco e numa linha vazia
      if (!editor.isFocused) {
        // Sem foco, não mostra.
        return;
      }

      const { selection } = editor.state;
      const { empty, $anchor } = selection;

      const lineText = $anchor.parent.textContent;
      const isSlashCommand = lineText === '/' && editor.isActive('paragraph');

      if (empty && isSlashCommand) {
        const coords = editor.view.coordsAtPos(selection.from);
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        
        const menuHeight = 350; // Altura estimada do menu
        const spaceBelow = window.innerHeight - coords.bottom;
        
        let topPos = coords.bottom - wrapperRect.top + 4;
        if (spaceBelow < menuHeight) {
          // Virar para cima do cursor
          topPos = coords.top - wrapperRect.top - menuHeight - 4;
        }

        setMenuCoords({
          top: topPos,
          left: Math.max(0, coords.left - wrapperRect.left), 
        });
      } else {
        setMenuCoords(null);
      }
    };

    if (editor) {
      editor.on('selectionUpdate', updateMenu);
      editor.on('update', updateMenu);
      editor.on('focus', updateMenu);
      editor.on('blur', () => {
        // pequeno delay pro click no menu funcionar antes de sumir
        setTimeout(() => setMenuCoords(null), 200);
      });
    }

    return () => {
      if (editor) {
        editor.off('selectionUpdate', updateMenu);
        editor.off('update', updateMenu);
        editor.off('focus', updateMenu);
        editor.off('blur');
      }
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Comprime a imagem no client-side
      const compressedFile = await compressImage(file, 1200, 0.75);

      const formData = new FormData();
      formData.append('file', compressedFile);

      // Envia para a nossa nova rota de API
      const res = await fetch('/api/upload/comentarios', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload');

      const data = await res.json();
      
      // Insere a imagem no editor com a URL recebida do servidor
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
      // Limpa o input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={styles.tiptapWrapper} style={{ position: 'relative' }}>
      
      {/* Input oculto para upload de imagem */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleImageUpload} 
      />

      {/* Editor Main Content Area */}
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <EditorContent editor={editor} />
        
        {/* CUSTOM FLOATING MENU (NOTION-STYLE) */}
        {menuCoords && (
          <div 
            className={styles.tiptapFloatingMenu} 
            style={{ 
              position: 'absolute', 
              top: menuCoords.top, 
              left: menuCoords.left, 
              zIndex: 100 
            }}
          >
            <div className={styles.tiptapFloatingHeader}>Blocos básicos</div>
            
            <button onClick={() => { editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).setParagraph().run(); setMenuCoords(null); }} className={styles.tiptapFloatingBtn}>
              <div className={styles.tiptapFloatingBtnLeft}>
                <span className={styles.tiptapFloatingBtnIcon}>T</span>
                Texto
              </div>
            </button>
            
            <button onClick={() => { editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 1 }).run(); setMenuCoords(null); }} className={styles.tiptapFloatingBtn}>
              <div className={styles.tiptapFloatingBtnLeft}>
                <span className={styles.tiptapFloatingBtnIcon}>H₁</span>
                Título 1
              </div>
              <span className={styles.tiptapFloatingBtnShortcut}>#</span>
            </button>
            
            <button onClick={() => { editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 2 }).run(); setMenuCoords(null); }} className={styles.tiptapFloatingBtn}>
              <div className={styles.tiptapFloatingBtnLeft}>
                <span className={styles.tiptapFloatingBtnIcon}>H₂</span>
                Título 2
              </div>
              <span className={styles.tiptapFloatingBtnShortcut}>##</span>
            </button>
            
            <button onClick={() => { editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 3 }).run(); setMenuCoords(null); }} className={styles.tiptapFloatingBtn}>
              <div className={styles.tiptapFloatingBtnLeft}>
                <span className={styles.tiptapFloatingBtnIcon}>H₃</span>
                Título 3
              </div>
              <span className={styles.tiptapFloatingBtnShortcut}>###</span>
            </button>

            <button onClick={() => { editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleBulletList().run(); setMenuCoords(null); }} className={styles.tiptapFloatingBtn}>
              <div className={styles.tiptapFloatingBtnLeft}>
                <span className={styles.tiptapFloatingBtnIcon}>•</span>
                Lista com marcadores
              </div>
              <span className={styles.tiptapFloatingBtnShortcut}>-</span>
            </button>

            <button onClick={() => { editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleOrderedList().run(); setMenuCoords(null); }} className={styles.tiptapFloatingBtn}>
              <div className={styles.tiptapFloatingBtnLeft}>
                <span className={styles.tiptapFloatingBtnIcon}>1.</span>
                Lista numerada
              </div>
              <span className={styles.tiptapFloatingBtnShortcut}>1.</span>
            </button>

            <button onClick={() => { editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleTaskList().run(); setMenuCoords(null); }} className={styles.tiptapFloatingBtn}>
              <div className={styles.tiptapFloatingBtnLeft}>
                <span className={styles.tiptapFloatingBtnIcon}>☑</span>
                Lista de tarefas
              </div>
              <span className={styles.tiptapFloatingBtnShortcut}>[]</span>
            </button>

            <button onClick={() => { editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run(); fileInputRef.current?.click(); setMenuCoords(null); }} className={styles.tiptapFloatingBtn}>
              <div className={styles.tiptapFloatingBtnLeft}>
                <span className={styles.tiptapFloatingBtnIcon}>🖼️</span>
                Imagem
              </div>
            </button>
          </div>
        )}

        {editor.isEmpty && !editor.isFocused && (
          <div className={styles.tiptapPlaceholder}>{finalPlaceholder}</div>
        )}
      </div>

      {/* Main Toolbar (Now at bottom) */}
      <div className={styles.tiptapToolbar}>
        <div className={styles.tiptapToolbarLeft}>
          {footerLeft}
          
          <button
            onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
            className={styles.tiptapBtn}
            title="Inserir Imagem do Computador"
            disabled={isUploading}
          >
            {isUploading ? '⏳' : '🖼️'}
          </button>
        </div>
        
        <div className={styles.tiptapToolbarRight}>
          {footerRight}
        </div>
      </div>
      
    </div>
  );
});

TipTapEditor.displayName = 'TipTapEditor';

export default TipTapEditor;
