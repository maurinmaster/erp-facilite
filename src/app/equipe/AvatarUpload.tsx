'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadAvatar } from '@/actions/auth';
import styles from './equipe.module.css';

interface Props {
  usuarioId: number;
  nome: string;
  fotoUrl?: string;
  isSelfOrAdmin: boolean;
}

export default function AvatarUpload({ usuarioId, nome, fotoUrl, isSelfOrAdmin }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [cacheBuster, setCacheBuster] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCacheBuster(`?t=${Date.now()}`);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Selecione uma imagem válida (JPG, PNG ou WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      await uploadAvatar(usuarioId, formData);
      setCacheBuster(`?t=${Date.now()}`);
    } catch (error: any) {
      alert(error.message || 'Erro ao fazer upload da foto.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className={`${styles.avatarContainer} ${isSelfOrAdmin ? styles.avatarInteractive : ''}`}
      onClick={() => isSelfOrAdmin && fileInputRef.current?.click()}
    >
      {fotoUrl ? (
        <img src={`${fotoUrl}${cacheBuster}`} alt={nome} className={styles.avatarImage} />
      ) : (
        <div className={styles.avatarPlaceholder}>
          {nome.charAt(0).toUpperCase()}
        </div>
      )}

      {isSelfOrAdmin && (
        <div className={styles.avatarOverlay}>
          {isUploading ? '...' : 'Alterar'}
        </div>
      )}

      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        ref={fileInputRef} 
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
