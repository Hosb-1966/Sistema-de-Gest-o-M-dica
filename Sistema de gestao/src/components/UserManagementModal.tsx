import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  Key,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  User,
  Eye,
  Sliders,
  Calendar,
  LayoutDashboard,
  Clock,
  FileCheck,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { AppUser, TabType, UserRole } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUsers: AppUser[];
  onSaveUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  currentUserId: string;
}

const AVAILABLE_PAGES: { id: TabType; label: string; icon: React.ReactNode; category: string }[] = [
  { id: 'consultas', label: 'Consultas', icon: <Clock className="w-3.5 h-3.5" />, category: 'Call Center' },
  { id: 'exames', label: 'Exames', icon: <FileCheck className="w-3.5 h-3.5" />, category: 'Call Center' },
  { id: 'intranet', label: 'Intranet', icon: <BookOpen className="w-3.5 h-3.5" />, category: 'Call Center' },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" />, category: 'Gestão' },
  { id: 'operacional', label: 'Operacional', icon: <Sliders className="w-3.5 h-3.5" />, category: 'Gestão' },
  { id: 'remarcacoes', label: 'Remarcações', icon: <Calendar className="w-3.5 h-3.5" />, category: 'Gestão' },
  { id: 'equipe_medica', label: 'Equipe Médica', icon: <UserCheck className="w-3.5 h-3.5" />, category: 'Gestão' },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  appUsers,
  onSaveUser,
  onDeleteUser,
  currentUserId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [permissions, setPermissions] = useState<TabType[]>(['consultas', 'exames']);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleOpenNew = () => {
    setSelectedUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('user');
    setPermissions(['consultas', 'exames']);
    setFormError('');
    setIsEditing(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setSelectedUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setPermissions([...user.permissions]);
    setFormError('');
    setIsEditing(true);
  };

  const handleTogglePermission = (pageId: TabType) => {
    if (permissions.includes(pageId)) {
      setPermissions(permissions.filter((p) => p !== pageId));
    } else {
      setPermissions([...permissions, pageId]);
    }
  };

  const handleSelectAllPermissions = () => {
    setPermissions(AVAILABLE_PAGES.map((p) => p.id));
  };

  const handleClearPermissions = () => {
    setPermissions([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !username.trim() || !password.trim()) {
      setFormError('Por favor preencha nome, login e senha.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = appUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername && (!selectedUser || u.id !== selectedUser.id)
    );
    if (existing) {
      setFormError('Este login já está em uso por outro usuário.');
      return;
    }

    if (role === 'user' && permissions.length === 0) {
      setFormError('Selecione pelo menos uma página de acesso para este usuário.');
      return;
    }

    setSaving(true);
    try {
      const userToSave: AppUser = {
        id: selectedUser ? selectedUser.id : `user-${Date.now()}`,
        name: name.trim(),
        username: cleanUsername,
        password: password.trim(),
        role: role,
        // Admins have access to all pages; users have specific permissions
        permissions: role === 'admin' ? AVAILABLE_PAGES.map((p) => p.id) : permissions,
        canEdit: role === 'admin',
        createdAt: selectedUser ? selectedUser.createdAt : new Date().toISOString(),
      };

      await onSaveUser(userToSave);
      setIsEditing(false);
      setSelectedUser(null);
    } catch (err) {
      setFormError('Erro ao salvar usuário no banco de dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (user.username === 'admin') {
      alert('O administrador padrão não pode ser excluído.');
      return;
    }
    if (user.id === currentUserId) {
      alert('Você não pode excluir o seu próprio login atualmente ativo.');
      return;
    }
    if (confirm(`Tem certeza que deseja excluir o acesso de "${user.name}" (${user.username})?`)) {
      await onDeleteUser(user.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C426E] text-white flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Gerenciamento de Logins & Permissões
              </h2>
              <p className="text-xs text-slate-500">
                O Administrador define as páginas liberadas para cada login. Edição restrita ao Administrador.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isEditing ? (
            /* User Form (Create / Edit) */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#1C426E]" />
                  {selectedUser ? `Editar Login: ${selectedUser.username}` : 'Criar Novo Login'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Voltar para lista
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C426E]/20 focus:border-[#1C426E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C426E]/20 focus:border-[#1C426E] bg-white"
                  >
                    <option value="user">Usuário Comum (Visualização conforme permissões)</option>
                    <option value="admin">Administrador (Acesso Total + Permissão de Alteração)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Usuário (Login)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: carlos.callcenter"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C426E]/20 focus:border-[#1C426E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha de acesso"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1C426E]/20 focus:border-[#1C426E]"
                    required
                  />
                </div>
              </div>

              {/* Permissions Selector */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800">
                      Páginas Liberadas para Visualização
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {role === 'admin'
                        ? 'Administradores possuem acesso automático a todas as páginas e direito exclusivo de edição.'
                        : 'Marque quais páginas este usuário poderá consultar:'}
                    </p>
                  </div>
                  {role !== 'admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Marcar todas
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleClearPermissions}
                        className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {AVAILABLE_PAGES.map((page) => {
                    const isChecked = role === 'admin' || permissions.includes(page.id);
                    return (
                      <label
                        key={page.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${
                          role === 'admin'
                            ? 'bg-slate-50 border-slate-200 opacity-80 cursor-default'
                            : isChecked
                            ? 'bg-blue-50/60 border-blue-200 text-blue-900 cursor-pointer'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={role === 'admin'}
                          checked={isChecked}
                          onChange={() => handleTogglePermission(page.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-slate-500">{page.icon}</span>
                        <div className="truncate">
                          <div className="text-xs font-medium">{page.label}</div>
                          <div className="text-[10px] text-slate-400">{page.category}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Informative Alert */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs">
                <strong>Regra de Permissão:</strong> A permissão para alterar dados em qualquer
                módulo do sistema é exclusiva do Administrador. Logins de usuários comuns têm
                apenas permissão de leitura/consulta às páginas selecionadas acima.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium bg-[#1C426E] text-white hover:bg-[#163557] rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Gravando no banco...' : 'Salvar Acesso'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Users Table */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Logins Cadastrados ({appUsers.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Clique em editar para ajustar as páginas permitidas ou alterar senha.
                  </p>
                </div>
                <button
                  onClick={handleOpenNew}
                  className="px-3 py-1.5 text-xs font-medium bg-[#1C426E] text-white hover:bg-[#163557] rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Novo Login</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Usuário / Nome</th>
                      <th className="py-2.5 px-3">Perfil</th>
                      <th className="py-2.5 px-3">Páginas Liberadas</th>
                      <th className="py-2.5 px-3">Permissão de Alteração</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appUsers.map((user) => {
                      const isAdmin = user.role === 'admin';
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{user.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              login: <strong>{user.username}</strong> | senha: {user.password}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                isAdmin
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              <Shield className="w-3 h-3" />
                              {isAdmin ? 'Administrador' : 'Usuário'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[260px]">
                            {isAdmin ? (
                              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Todas as páginas liberadas
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {user.permissions.map((p) => {
                                  const label = AVAILABLE_PAGES.find((item) => item.id === p)?.label || p;
                                  return (
                                    <span
                                      key={p}
                                      className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200"
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                                {user.permissions.length === 0 && (
                                  <span className="text-[10px] text-red-500 italic">
                                    Nenhuma página liberada
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {isAdmin ? (
                              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Total (Edição)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> Somente Visualização
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                title="Editar Permissões"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {user.username !== 'admin' && (
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Excluir Login"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Banco de Dados: Tabela <code>app_users</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
