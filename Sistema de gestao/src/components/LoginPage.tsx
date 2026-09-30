import React, { useState } from 'react';
import { Activity, Lock, User, ShieldCheck, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { AppUser } from '../types';

interface LoginPageProps {
  onLogin: (user: AppUser) => void;
  appUsers: AppUser[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, appUsers }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Por favor, preencha o usuário e a senha.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const found = appUsers.find(
        (u) => u.username.toLowerCase() === trimmedUser && u.password === password
      );

      if (found) {
        onLogin(found);
      } else {
        setErrorMessage('Usuário ou senha incorretos. Verifique suas credenciais.');
      }
      setLoading(false);
    }, 250);
  };

  const handleQuickFill = (user: AppUser) => {
    setUsername(user.username);
    setPassword(user.password);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo and Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0F2942] text-white shadow-md mb-3.5">
            <Activity className="w-7 h-7 text-sky-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Gestão Médica Integrada
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Acesso Restrito ao Painel Clínico & Administrativo
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200">
          <div className="mb-5 text-center">
            <h2 className="text-base font-semibold text-slate-800">Identificação de Usuário</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Entre com seu login para acessar suas páginas autorizadas
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: admin ou seu usuário"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1C426E]/20 focus:border-[#1C426E] transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Senha
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1C426E]/20 focus:border-[#1C426E] transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#1C426E] hover:bg-[#163557] active:bg-[#102741] text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access Credentials helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Acessos Rápidos Disponíveis:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {appUsers.slice(0, 2).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickFill(user)}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-[#1C426E]/40 hover:bg-slate-50/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 group-hover:text-[#1C426E]">
                    <span>{user.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-normal ${
                        user.role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'admin' ? 'Adm (Edição)' : 'Usuário (Consulta)'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Login: <span className="font-mono text-slate-700 font-medium">{user.username}</span> | Senha: <span className="font-mono text-slate-700 font-medium">{user.password}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <span>Gestão Hospitalar & Call Center • Acesso Seguro</span>
        </div>
      </div>
    </div>
  );
};
