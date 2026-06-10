'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarDays, 
  KanbanSquare, 
  MessageCircle, 
  Users, 
  Library,
  FileText,
  UserCog,
  Settings,
  Trash2,
  LogOut,
  BarChart3
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import styles from './sidebar.module.css';
import { logout } from '@/actions/auth';

interface SidebarProps {
  session: any;
}

export default function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();

  if (!session) return null;

  const permissoes = session.permissoes || {};
  const isAdmin = session.perfil === 'Admin';
  
  const canViewDashboard = isAdmin || (permissoes.dashboard && permissoes.dashboard !== 'none');
  const canViewProducao = isAdmin || (permissoes.producao && permissoes.producao !== 'none');
  const canViewHoje = canViewDashboard || canViewProducao;
  const canViewMensagens = isAdmin || (permissoes.mensagens && permissoes.mensagens !== 'none');
  const canViewClientes = isAdmin || (permissoes.clientes && permissoes.clientes !== 'none');
  
  const canViewCatalogo = isAdmin || (permissoes.catalogo && permissoes.catalogo !== 'none');
  const canViewEquipe = isAdmin || (permissoes.equipe && permissoes.equipe !== 'none');
  const canViewConfiguracoes = isAdmin || (permissoes.configuracoes && permissoes.configuracoes !== 'none');
  const canViewRelatorios = isAdmin || (permissoes.relatorios && permissoes.relatorios !== 'none');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        Facilite<span className={styles.brandHighlight}>ERP</span>
      </div>

      <div className={styles.navGroup}>
        <div className={styles.navLabel}>Principal</div>
        
        {canViewDashboard && (
          <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.navItemActive : ''}`}>
            <LayoutDashboard size={20} />
            Painel
          </Link>
        )}
        
        {canViewHoje && (
          <Link href="/hoje" className={`${styles.navItem} ${pathname === '/hoje' ? styles.navItemActive : ''}`}>
            <CalendarDays size={20} />
            Hoje
          </Link>
        )}
        
        {canViewProducao && (
          <Link href="/producao" className={`${styles.navItem} ${pathname === '/producao' ? styles.navItemActive : ''}`}>
            <KanbanSquare size={20} />
            Produção
          </Link>
        )}
        
        {canViewMensagens && (
          <Link href="/mensagens" className={`${styles.navItem} ${pathname === '/mensagens' ? styles.navItemActive : ''}`}>
            <MessageCircle size={20} />
            Chat
          </Link>
        )}

        {canViewClientes && (
          <Link href="/clientes" className={`${styles.navItem} ${pathname === '/clientes' ? styles.navItemActive : ''}`}>
            <Users size={20} />
            Clientes
          </Link>
        )}
      </div>

      {canViewCatalogo && (
        <div className={styles.navGroup}>
          <div className={styles.navLabel}>Gestão</div>
          
          <Link href="/catalogo" className={`${styles.navItem} ${pathname === '/catalogo' ? styles.navItemActive : ''}`}>
            <Library size={20} />
            Catálogo
          </Link>
          
          <Link href="/briefings" className={`${styles.navItem} ${pathname === '/briefings' ? styles.navItemActive : ''}`}>
            <FileText size={20} />
            Briefings
          </Link>

          {canViewRelatorios && (
            <Link href="/relatorios" className={`${styles.navItem} ${pathname.startsWith('/relatorios') ? styles.navItemActive : ''}`}>
              <BarChart3 size={20} />
              Relatórios
            </Link>
          )}
        </div>
      )}

      {(canViewEquipe || canViewConfiguracoes) && (
        <div className={styles.navGroup}>
          <div className={styles.navLabel}>Administração</div>
          
          {canViewEquipe && (
            <Link href="/equipe" className={`${styles.navItem} ${pathname === '/equipe' ? styles.navItemActive : ''}`}>
              <UserCog size={20} />
              Equipe
            </Link>
          )}
          
          {canViewConfiguracoes && (
            <Link href="/configuracoes" className={`${styles.navItem} ${pathname === '/configuracoes' ? styles.navItemActive : ''}`}>
              <Settings size={20} />
              Configurações
            </Link>
          )}

          {canViewConfiguracoes && (
            <Link href="/lixeira" className={`${styles.navItem} ${pathname === '/lixeira' ? styles.navItemActive : ''}`} style={{ color: pathname === '/lixeira' ? '#ffffff' : '#ef4444' }}>
              <Trash2 size={20} />
              Lixeira
            </Link>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {getInitials(session.nome)}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{session.nome}</span>
            <span className={styles.userRole}>{session.perfil}</span>
          </div>
        </div>

        <div className={styles.footerActions}>
          <NotificationBell />
          
          <form action={logout} style={{ margin: 0 }}>
             <button type="submit" className={styles.logoutBtn} title="Sair do sistema">
               <LogOut size={16} />
               Sair
             </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
