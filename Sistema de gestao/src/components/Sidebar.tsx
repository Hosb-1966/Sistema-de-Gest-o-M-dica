import React from 'react';
import { TabType, AppUser } from '../types';
import {
  Calendar,
  LayoutDashboard,
  Clock,
  FileCheck,
  BookOpen,
  Palmtree,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  User,
  UserCheck,
  Sliders,
  Users,
  LogOut,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  userRole?: string;
  currentUser?: AppUser | null;
  onOpenUserManagement?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  userRole = 'Administrador',
  currentUser,
  onOpenUserManagement,
  onLogout,
}) => {
  const allNavItems: { id: TabType; label: string; icon: React.ReactNode; category: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, category: 'Gestão' },
    { id: 'operacional', label: 'Operacional', icon: <Sliders className="w-5 h-5" />, category: 'Gestão' },
    { id: 'remarcacoes', label: 'Remarcações', icon: <Calendar className="w-5 h-5" />, category: 'Gestão' },
    { id: 'equipe_medica', label: 'Equipe Médica', icon: <UserCheck className="w-5 h-5" />, category: 'Gestão' },
    { id: 'consultas', label: 'Consultas', icon: <Clock className="w-5 h-5" />, category: 'Call Center' },
    { id: 'exames', label: 'Exames', icon: <FileCheck className="w-5 h-5" />, category: 'Call Center' },
    { id: 'intranet', label: 'Intranet', icon: <BookOpen className="w-5 h-5" />, category: 'Call Center' },
  ];

  // Permissões do usuário para cada aba
  const isAllowed = (tabId: TabType) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions.includes(tabId);
  };

  // Exibe todos os itens no menu conforme solicitado
  const navItems = allNavItems;

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const displayName = currentUser?.name || 'Administrador Geral';
  const displayRole = currentUser?.role === 'admin' ? 'Administrador' : 'Usuário (Consulta)';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#255284] text-white border-r border-[#316399] shadow-xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#316399] bg-[#1C426E]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-normal text-sm tracking-tight text-white leading-tight">
                Gestão Médica
              </span>
              <span className="text-[10px] text-sky-200 font-normal tracking-wider uppercase">
                Painel Clínico
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-sky-200 hover:text-white p-1 rounded-lg hover:bg-[#316399] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex text-sky-200 hover:text-white p-1.5 rounded-lg hover:bg-[#316399] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Status Card */}
      {!isCollapsed ? (
        <div className="p-3 mx-3 mt-3 rounded-xl border border-[#316399] bg-[#1C426E]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-400/20 border border-sky-300/30 flex items-center justify-center text-sky-200 text-xs font-normal flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate" title={displayName}>
                {displayName}
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] font-normal text-sky-200 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-sky-300" />
                <span className="truncate">{displayRole}</span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair do sistema"
                className="p-1 text-sky-300 hover:text-white hover:bg-[#316399] rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-3 flex flex-col items-center gap-2 border-b border-[#316399]" title={`${displayName} - ${displayRole}`}>
          <div className="w-8 h-8 rounded-lg bg-sky-400/20 border border-sky-300/30 flex items-center justify-center text-sky-200 text-xs font-normal">
            <User className="w-4 h-4" />
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair"
              className="p-1 text-sky-300 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-4 space-y-5">
        {/* Render grouped links */}
        {['Gestão', 'Call Center', 'Comunicação'].map((category) => {
          const items = navItems.filter((i) => i.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-normal text-sky-200 uppercase tracking-wider mb-1.5">
                  {category}
                </div>
              )}

              {items.map((item) => {
                const allowed = isAllowed(item.id);
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    disabled={!allowed}
                    onClick={() => {
                      if (allowed) {
                        handleSelectTab(item.id);
                      }
                    }}
                    title={
                      !allowed
                        ? `Acesso restrito (${item.label}) - Sem permissão do administrador`
                        : isCollapsed
                        ? item.label
                        : undefined
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-normal transition-all relative ${
                      !allowed
                        ? 'opacity-40 cursor-not-allowed text-sky-200/50 bg-transparent select-none'
                        : isActive
                        ? 'bg-[#316399] text-white shadow-sm cursor-pointer'
                        : 'text-sky-100 hover:text-white hover:bg-[#1C426E]/60 cursor-pointer'
                    }`}
                  >
                    {isActive && allowed && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />
                    )}

                    <span
                      className={`transition-colors flex-shrink-0 ${
                        !allowed
                          ? 'text-sky-300/40'
                          : isActive
                          ? 'text-white'
                          : 'text-sky-200 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>

                    {!isCollapsed && (
                      <span className={`truncate ${!allowed ? 'text-sky-200/60' : ''}`}>
                        {item.label}
                      </span>
                    )}

                    {!allowed && !isCollapsed && (
                      <Lock className="w-3.5 h-3.5 text-sky-300/40 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Admin Access & Permission Management Button */}
        {currentUser?.role === 'admin' && onOpenUserManagement && (
          <div className="pt-2 border-t border-[#316399]/60">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-normal text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Controle de Acessos
              </div>
            )}
            <button
              onClick={onOpenUserManagement}
              title={isCollapsed ? 'Gerenciar Permissões' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-normal bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-400/30 transition-all cursor-pointer group"
            >
              <Users className="w-5 h-5 text-amber-300 group-hover:text-white shrink-0" />
              {!isCollapsed && <span className="truncate font-medium">Permissões de Acesso</span>}
            </button>
          </div>
        )}
      </nav>

      {/* Footer / Palette Indicator */}
      <div className="p-3 border-t border-[#316399] bg-[#1C426E] text-center">
        {!isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-1.5 w-full rounded-full overflow-hidden border border-[#316399]">
              <div className="flex-1 bg-[#1C426E]" />
              <div className="flex-1 bg-[#255284]" />
              <div className="flex-1 bg-[#316399]" />
              <div className="flex-1 bg-blue-500" />
              <div className="flex-1 bg-sky-400" />
            </div>
            <span className="text-[10px] text-sky-200 font-normal">MedGestão v2.0</span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-sky-300 mx-auto" />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer */}
          <div className="relative w-64 max-w-xs h-full z-10 shadow-2xl animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
