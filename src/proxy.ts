import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.ENCRYPTION_KEY || 'facilite-erp-default-secret-key-32!';
const key = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Liberar arquivos estáticos, assets e a página de login
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('facilite_session')?.value;

  // Se não tem cookie e tenta acessar qualquer outra rota -> Manda pro Login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Valida o Token
    const { payload } = await jwtVerify(sessionCookie, key, {
      algorithms: ['HS256']
    });

    const isAdmin = payload.perfil === 'Admin';
    const isGestor = payload.perfil === 'Gestor' || isAdmin;

    // Se tentar acessar equipe e NÃO for Admin, bloqueia
    if (pathname.startsWith('/equipe') && !isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Se tentar acessar catalogo e NÃO for Gestor ou Admin, bloqueia
    if (pathname.startsWith('/catalogo') && !isGestor) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Token inválido ou expirado -> Manda pro Login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configurar o matcher para rodar em todas as rotas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
