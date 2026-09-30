import React from 'react';
import { TabType, AppUser } from '../types';
import {
  Calendar,
  LayoutDashboard,
  Clock,
  FileCheck,
  BookOpen,
  Shield,
  Menu,
  Sliders,
  UserCheck,
  Users,
  LogOut,
  User,
  Lock,
} from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab?: (tab: TabType) => void;
  onOpenMobileMenu?: () => void;
  userRole?: string;
  currentUser?: AppUser | null;
  onOpenUserManagement?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  userRole = 'Administrador',
  currentUser,
  onOpenUserManagement,
  onLogout,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'operacional', label: 'Operacional', icon: <Sliders className="w-4 h-4" /> },
    { id: 'remarcacoes', label: 'Remarcações', icon: <Calendar className="w-4 h-4" /> },
    { id: 'equipe_medica', label: 'Equipe Médica', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'consultas', label: 'Consultas', icon: <Clock className="w-4 h-4" /> },
    { id: 'exames', label: 'Exames', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'intranet', label: 'Intranet', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Active view title with role badge & mobile menu trigger */}
          <div className="flex items-center gap-3">
            {onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                className="lg:hidden text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors cursor-pointer"
                title="Abrir Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <h1 className="text-lg font-normal text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">{currentTab?.icon}</span>
              <span>{currentTab?.label}</span>
            </h1>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-normal border ${
                isAdmin
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              <Shield className={`w-3 h-3 ${isAdmin ? 'text-amber-600' : 'text-blue-600'}`} />
              {isAdmin ? 'Administrador (Edição)' : 'Usuário (Consulta)'}
            </span>
          </div>

          {/* Right Header: Admin Permissions Button & User Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && onOpenUserManagement && (
              <button
                onClick={onOpenUserManagement}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-all shadow-2xs cursor-pointer"
                title="Gerenciar Permissões de Acesso dos Usuários"
              >
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Permissões de Acesso</span>
                <span className="sm:hidden">Acessos</span>
              </button>
            )}

            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-800">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{currentUser.username}</span>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    title="Sair da Conta"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline font-normal">Sair</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


