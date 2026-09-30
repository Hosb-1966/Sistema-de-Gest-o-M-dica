import React, { useState, useEffect } from 'react';
import { TabType, OperacionalData, AppUser } from './types';
import {
  initialRemarcacoes,
  initialConsultaDoctors,
  initialExameDoctors,
  generateInitialSchedule,
  initialIntranetCategories,
  initialIntranetArticles,
  initialRecessoData,
  initialOperacionalData,
  initialOperacionalExamesData,
  initialEquipeMedica,
} from './data/mockData';
import {
  loadRemarcacoes,
  saveRemarcacoes,
  loadIntranetCategories,
  saveIntranetCategories,
  loadIntranetArticles,
  saveIntranetArticles,
  loadRecessoData,
  saveRecessoData,
  loadScheduleColumns,
  saveScheduleColumns,
  loadScheduleGrid,
  saveScheduleGrid,
  loadOperacionalData,
  saveOperacionalData,
  loadAllOperacionalData,
  loadEquipeMedica,
  saveEquipeMedica,
  loadAppUsers,
  saveAppUser,
  deleteAppUser,
  INITIAL_APP_USERS,
} from './lib/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RemarcacoesView } from './components/RemarcacoesView';
import { DashboardView } from './components/DashboardView';
import { ScheduleMatrixView } from './components/ScheduleMatrixView';
import { IntranetView } from './components/IntranetView';
import { RecessoView } from './components/RecessoView';
import { OperacionalView } from './components/OperacionalView';
import { EquipeMedicaView } from './components/EquipeMedicaView';
import { LoginPage } from './components/LoginPage';
import { UserManagementModal } from './components/UserManagementModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auth & Permissions State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [appUsers, setAppUsers] = useState<AppUser[]>(INITIAL_APP_USERS);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Remarcações State
  const [remarcacoesItems, setRemarcacoesItems] = useState(initialRemarcacoes);

  // Consultas Matrix State
  const [consultaColumns, setConsultaColumns] = useState(() => initialConsultaDoctors.map((c) => ({ ...c })));
  const [consultaGrid, setConsultaGrid] = useState(() => generateInitialSchedule(false));

  // Exames Matrix State
  const [exameColumns, setExameColumns] = useState(() => initialExameDoctors.map((c) => ({ ...c })));
  const [exameGrid, setExameGrid] = useState(() => generateInitialSchedule(true));

  // Intranet State
  const [intranetCategories, setIntranetCategories] = useState(initialIntranetCategories);
  const [intranetArticles, setIntranetArticles] = useState(initialIntranetArticles);

  // Recesso State
  const [recessoData, setRecessoData] = useState(initialRecessoData);

  // Operacional Store (independent per unit & module)
  const [operacionalStore, setOperacionalStore] = useState<Record<string, OperacionalData>>({});
  const [operacionalData, setOperacionalData] = useState(initialOperacionalData);
  const [operacionalExamesData, setOperacionalExamesData] = useState(initialOperacionalExamesData);

  // Equipe Médica State
  const [equipeMedicaData, setEquipeMedicaData] = useState(initialEquipeMedica);

  // Load persistent data on mount
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      try {
        const [
          remarcacoes,
          categories,
          articles,
          recesso,
          consultCols,
          consultG,
          examCols,
          examG,
          allOperacional,
          operacional,
          operacionalExames,
          equipeMedica,
          loadedUsers,
        ] = await Promise.all([
          loadRemarcacoes(initialRemarcacoes),
          loadIntranetCategories(initialIntranetCategories),
          loadIntranetArticles(initialIntranetArticles),
          loadRecessoData(initialRecessoData),
          loadScheduleColumns('consultas', initialConsultaDoctors),
          loadScheduleGrid('consultas', generateInitialSchedule(false)),
          loadScheduleColumns('exames', initialExameDoctors),
          loadScheduleGrid('exames', generateInitialSchedule(true)),
          loadAllOperacionalData(),
          loadOperacionalData(initialOperacionalData, 'main_operacional'),
          loadOperacionalData(initialOperacionalExamesData, 'exames_operacional'),
          loadEquipeMedica(initialEquipeMedica),
          loadAppUsers(),
        ]);

        if (isMounted) {
          if (remarcacoes && remarcacoes.length > 0) setRemarcacoesItems(remarcacoes);
          if (categories && categories.length > 0) setIntranetCategories(categories);
          if (articles && articles.length > 0) setIntranetArticles(articles);
          if (recesso && recesso.length > 0) setRecessoData(recesso);
          if (consultCols && consultCols.length > 0) setConsultaColumns(consultCols);
          if (consultG && Object.keys(consultG).length > 0) setConsultaGrid(consultG);
          if (examCols && examCols.length > 0) setExameColumns(examCols);
          if (examG && Object.keys(examG).length > 0) setExameGrid(examG);
          if (allOperacional && Object.keys(allOperacional).length > 0) setOperacionalStore(allOperacional);
          if (operacional && operacional.consultorios.length > 0) setOperacionalData(operacional);
          if (operacionalExames && operacionalExames.consultorios.length > 0) setOperacionalExamesData(operacionalExames);
          if (equipeMedica && equipeMedica.length > 0) setEquipeMedicaData(equipeMedica);
          if (loadedUsers && loadedUsers.length > 0) {
            setAppUsers(loadedUsers);
            // If current user is logged in, refresh their permissions from DB
            if (currentUser) {
              const fresh = loadedUsers.find((u) => u.id === currentUser.id);
              if (fresh) {
                setCurrentUser(fresh);
                localStorage.setItem('auth_user', JSON.stringify(fresh));
              }
            }
          }
        }
      } catch (err) {
        console.error('Error initializing data:', err);
      }
    }

    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Enforce permitted tab for non-admin user
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      if (currentUser.permissions && !currentUser.permissions.includes(activeTab)) {
        setActiveTab(currentUser.permissions[0] || 'consultas');
      }
    }
  }, [currentUser, activeTab]);

  // Auth Handlers
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } catch (_) {}
    if (user.role !== 'admin' && user.permissions && !user.permissions.includes(activeTab)) {
      setActiveTab(user.permissions[0] || 'consultas');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('auth_user');
    } catch (_) {}
  };

  const handleSaveUser = async (user: AppUser) => {
    await saveAppUser(user);
    setAppUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = user;
        return next;
      }
      return [...prev, user];
    });
    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
      try {
        localStorage.setItem('auth_user', JSON.stringify(user));
      } catch (_) {}
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteAppUser(userId);
    setAppUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Handlers with auto-saving to Supabase
  const handleSetRemarcacoes = (updater: React.SetStateAction<typeof remarcacoesItems>) => {
    setRemarcacoesItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRemarcacoes(next);
      return next;
    });
  };

  const handleSetConsultaColumns = (updater: React.SetStateAction<typeof consultaColumns>) => {
    setConsultaColumns((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveScheduleColumns('consultas', next);
      return next;
    });
  };

  const handleSetConsultaGrid = (updater: React.SetStateAction<typeof consultaGrid>) => {
    setConsultaGrid((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveScheduleGrid('consultas', next);
      return next;
    });
  };

  const handleSetExameColumns = (updater: React.SetStateAction<typeof exameColumns>) => {
    setExameColumns((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveScheduleColumns('exames', next);
      return next;
    });
  };

  const handleSetExameGrid = (updater: React.SetStateAction<typeof exameGrid>) => {
    setExameGrid((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveScheduleGrid('exames', next);
      return next;
    });
  };

  const handleSetIntranetCategories = (updater: React.SetStateAction<typeof intranetCategories>) => {
    setIntranetCategories((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveIntranetCategories(next);
      return next;
    });
  };

  const handleSetIntranetArticles = (updater: React.SetStateAction<typeof intranetArticles>) => {
    setIntranetArticles((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveIntranetArticles(next);
      return next;
    });
  };

  const handleSetRecessoData = (updater: React.SetStateAction<typeof recessoData>) => {
    setRecessoData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRecessoData(next);
      return next;
    });
  };

  const handleSaveOperacionalUnit = (key: string, unitData: OperacionalData) => {
    setOperacionalStore((prev) => ({
      ...prev,
      [key]: unitData,
    }));
    saveOperacionalData(unitData, key);
  };

  const handleSetOperacionalData = (updater: React.SetStateAction<typeof operacionalData>) => {
    setOperacionalData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveOperacionalData(next, 'main_operacional');
      return next;
    });
  };

  const handleSetOperacionalExamesData = (updater: React.SetStateAction<typeof operacionalExamesData>) => {
    setOperacionalExamesData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveOperacionalData(next, 'exames_operacional');
      return next;
    });
  };

  const handleSetEquipeMedicaData = (updater: React.SetStateAction<typeof equipeMedicaData>) => {
    setEquipeMedicaData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveEquipeMedica(next);
      return next;
    });
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} appUsers={appUsers} />;
  }

  const canEdit = currentUser.role === 'admin';
  const userRoleLabel = canEdit ? 'Administrador' : 'Usuário';

  return (
    <div className="min-h-screen bg-[#F4F8FC] text-slate-800 flex font-sans antialiased selection:bg-[#E8F2FA] selection:text-[#163252]">
      {/* Side Navigation Menu using requested palette */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        userRole={userRoleLabel}
        currentUser={currentUser}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          userRole={userRoleLabel}
          currentUser={currentUser}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeTab === 'remarcacoes' && (
            <RemarcacoesView items={remarcacoesItems} setItems={handleSetRemarcacoes} canEdit={canEdit} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              remarcacoesItems={remarcacoesItems}
              operacionalStore={operacionalStore}
              operacionalData={operacionalData}
              operacionalExamesData={operacionalExamesData}
            />
          )}

          {activeTab === 'consultas' && (
            <ScheduleMatrixView
              title="Consultas"
              columns={consultaColumns}
              setColumns={handleSetConsultaColumns}
              gridData={consultaGrid}
              setGridData={handleSetConsultaGrid}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'exames' && (
            <ScheduleMatrixView
              title="Exames"
              columns={exameColumns}
              setColumns={handleSetExameColumns}
              gridData={exameGrid}
              setGridData={handleSetExameGrid}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'intranet' && (
            <IntranetView
              categories={intranetCategories}
              setCategories={handleSetIntranetCategories}
              articles={intranetArticles}
              setArticles={handleSetIntranetArticles}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'recesso' && (
            <RecessoView recessoData={recessoData} setRecessoData={handleSetRecessoData} />
          )}

          {activeTab === 'operacional' && (
            <OperacionalView
              operacionalStore={operacionalStore}
              onSaveUnitData={handleSaveOperacionalUnit}
              data={operacionalData}
              setData={handleSetOperacionalData}
              examesData={operacionalExamesData}
              setExamesData={handleSetOperacionalExamesData}
              recessoData={recessoData}
              setRecessoData={handleSetRecessoData}
              doctors={equipeMedicaData}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'equipe_medica' && (
            <EquipeMedicaView
              doctors={equipeMedicaData}
              setDoctors={handleSetEquipeMedicaData}
              onSaveToSupabase={() => saveEquipeMedica(equipeMedicaData)}
              canEdit={canEdit}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#C8E0F4]/60 bg-white py-3.5 px-6 text-center text-xs text-gray-500 mt-auto">
          © {new Date().getFullYear()} Sistema de Gestão Médica — Painel Clínico Harmonizado
        </footer>
      </div>

      {/* Admin User & Permissions Management Modal */}
      {isUserManagementOpen && canEdit && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          appUsers={appUsers}
          onSaveUser={handleSaveUser}
          onDeleteUser={handleDeleteUser}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}
