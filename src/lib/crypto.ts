import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Tenta usar a chave do .env. Se não existir, usa um fallback (em prod, DEVE estar no .env)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'facilite-erp-default-secret-key-32!'; 
const IV_LENGTH = 16;

/**
 * Criptografa uma string
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), 
    iv
  );
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Retorna iv e o texto criptografado juntos
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Descriptografa uma string
 */
export function decrypt(text: string): string {
  if (!text) return text;
  
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Provavelmente não está criptografado
    
    const iv = Buffer.from(textParts.shift() as string, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), 
      iv
    );
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return text; // Se falhar (ex: chave errada), retorna o original
  }
}

/**
 * Cria um Hash irreversível (com salt) para senhas de usuários
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verifica se a senha em texto plano corresponde ao Hash salvo
 */
export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  try {
    const [salt, key] = hash.split(':');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return key === derivedKey;
  } catch(e) {
    return false;
  }
}
