import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar um nome único e seguro
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(originalExt) ? originalExt : 'jpg';
    const filename = `${uniqueSuffix}.${safeExt}`;

    // Pasta de destino: public/uploads/comentarios
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'comentarios');
    
    // Tenta criar o diretório, ignora o erro se já existir
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignorar
    }

    const filepath = join(uploadDir, filename);

    // Salvar o arquivo fisicamente
    await writeFile(filepath, buffer);

    // Retornar a URL pública
    const fileUrl = `/uploads/comentarios/${filename}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    return NextResponse.json({ error: 'Erro interno no servidor ao salvar a imagem.' }, { status: 500 });
  }
}
