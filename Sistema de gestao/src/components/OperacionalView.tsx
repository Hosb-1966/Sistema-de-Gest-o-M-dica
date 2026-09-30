import React, { useState, useEffect } from 'react';
import { OperacionalData, OperacionalConsultorio, OperacionalSlot, DayOfWeek, RecessoWeekData, DoctorTeamItem } from '../types';
import { RecessoView } from './RecessoView';
import { loadOperacionalData, saveOperacionalData, getOperacionalKey } from '../lib/supabaseService';
import { createInitialOperacionalUnitData } from '../data/mockData';
import {
  Building2,
  Users,
  Clock,
  Calendar,
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck,
  Palmtree,
  Sliders,
} from 'lucide-react';

interface OperacionalViewProps {
  operacionalStore?: Record<string, OperacionalData>;
  onSaveUnitData?: (key: string, data: OperacionalData) => void;
  data?: OperacionalData; // fallback
  setData?: (updater: React.SetStateAction<OperacionalData>) => void;
  examesData?: OperacionalData; // fallback
  setExamesData?: (updater: React.SetStateAction<OperacionalData>) => void;
  recessoData: RecessoWeekData[];
  setRecessoData: React.Dispatch<React.SetStateAction<RecessoWeekData[]>>;
  doctors?: DoctorTeamItem[];
  canEdit?: boolean;
}

const daysOfWeek: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const OperacionalView: React.FC<OperacionalViewProps> = ({
  operacionalStore,
  onSaveUnitData,
  data,
  setData,
  examesData,
  setExamesData,
  recessoData,
  setRecessoData,
  doctors,
  canEdit = true,
}) => {
  const [activeModule, setActiveModule] = useState<'consultas' | 'exames' | 'recesso'>('consultas');
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('Fonseca');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Local state cache per unit & module
  const [localUnitsMap, setLocalUnitsMap] = useState<Record<string, OperacionalData>>({});

  const currentModule = activeModule === 'exames' ? 'exames' : 'consultas';
  const currentKey = getOperacionalKey(currentModule, selectedUnit);

  const getUnitData = (unitName: string, module: 'consultas' | 'exames'): OperacionalData => {
    const key = getOperacionalKey(module, unitName);
    if (operacionalStore && operacionalStore[key] && operacionalStore[key].consultorios) {
      return operacionalStore[key];
    }
    if (localUnitsMap[key] && localUnitsMap[key].consultorios) {
      return localUnitsMap[key];
    }
    return createInitialOperacionalUnitData(module, unitName);
  };

  const currentData = getUnitData(selectedUnit, currentModule);

  const setCurrentData = (updater: React.SetStateAction<OperacionalData>) => {
    const key = currentKey;
    const prevData = getUnitData(selectedUnit, currentModule);
    const nextData = typeof updater === 'function' ? updater(prevData) : updater;
    const finalData = { ...nextData, unit: selectedUnit };

    setLocalUnitsMap((prev) => ({
      ...prev,
      [key]: finalData,
    }));

    if (onSaveUnitData) {
      onSaveUnitData(key, finalData);
    } else {
      saveOperacionalData(finalData, key);
    }
  };

  useEffect(() => {
    if (activeModule === 'recesso') return;
    let isMounted = true;

    async function fetchUnitData() {
      const key = currentKey;
      if (operacionalStore?.[key] || localUnitsMap[key]) return;
      const fallback = createInitialOperacionalUnitData(currentModule, selectedUnit);
      const loaded = await loadOperacionalData(fallback, key);
      if (isMounted && loaded) {
        setLocalUnitsMap((prev) => ({
          ...prev,
          [key]: loaded,
        }));
        if (onSaveUnitData) {
          onSaveUnitData(key, loaded);
        }
      }
    }

    fetchUnitData();

    return () => {
      isMounted = false;
    };
  }, [selectedUnit, activeModule, currentKey, operacionalStore]);

  // Slot Edit Modal State
  const [editingSlotInfo, setEditingSlotInfo] = useState<{
    consultorioId: string;
    day: DayOfWeek;
    period: 'manha' | 'tarde';
    slot: OperacionalSlot;
  } | null>(null);

  const [editDoctorName, setEditDoctorName] = useState('');
  const [editTimeRange, setEditTimeRange] = useState('');

  // Delete Consultorio / Exame Modal State
  const [deletingConsultorioInfo, setDeletingConsultorioInfo] = useState<{ id: string; name: string } | null>(null);

  // Add Consultorio Modal State
  const [isAddConsultorioOpen, setIsAddConsultorioOpen] = useState(false);
  const [newConsultorioName, setNewConsultorioName] = useState('');

  const units = ['Fonseca', 'Centro', 'São Gonçalo', 'Icaraí'];

  const handleSave = () => {
    const key = currentKey;
    const finalData = {
      ...currentData,
      unit: selectedUnit,
    };
    if (onSaveUnitData) {
      onSaveUnitData(key, finalData);
    } else {
      saveOperacionalData(finalData, key);
    }
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Unidade,Consultório,Período,SEG,TER,QUA,QUI,SEX,SÁB\n';

    currentData.consultorios.forEach((cons) => {
      ['manha', 'tarde'].forEach((period) => {
        const periodLabel = period === 'manha' ? 'Manhã' : 'Tarde';
        const rowData = daysOfWeek.map((day) => {
          const slot = cons.schedule[day]?.[period as 'manha' | 'tarde'];
          if (!slot || !slot.doctorName) return '""';
          return `"${slot.doctorName} (${slot.timeRange})"${slot.isDesmontado ? ' [DESMONTADO]' : ''}`;
        });
        csvContent += `"${selectedUnit}","${cons.name}","${periodLabel}",${rowData.join(',')}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Escala_Operacional_${activeModule}_${selectedUnit}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handlePrint = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  const handleAddConsultorio = () => {
    const defaultPrefix = activeModule === 'exames' ? 'EXAME' : 'CONS.';
    const name = newConsultorioName.trim() || `${defaultPrefix} ${currentData.consultorios.length + 1}`;
    const cleanUnit = selectedUnit
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
    const newConsultorio: OperacionalConsultorio = {
      id: `cons_${activeModule}_${cleanUnit}_${Date.now()}`,
      name: name.toUpperCase(),
      schedule: daysOfWeek.reduce((acc, day) => {
        acc[day] = {
          manha: { doctorName: '', timeRange: '08:00 - 12:00' },
          tarde: { doctorName: '', timeRange: '14:00 - 18:00' },
        };
        return acc;
      }, {} as OperacionalConsultorio['schedule']),
    };

    setCurrentData((prev) => ({
      ...prev,
      consultorios: [...prev.consultorios, newConsultorio],
    }));
    setNewConsultorioName('');
    setIsAddConsultorioOpen(false);
  };

  const handleDeleteConsultorio = (id: string, name: string) => {
    setDeletingConsultorioInfo({ id, name });
  };

  const handleStartEditSlot = (
    consultorioId: string,
    day: DayOfWeek,
    period: 'manha' | 'tarde',
    slot: OperacionalSlot
  ) => {
    setEditingSlotInfo({ consultorioId, day, period, slot });
    const isDesmontado = slot.isDesmontado || slot.doctorName === 'DESMONTADO';
    const isVago = !isDesmontado && (!slot.doctorName || slot.doctorName.trim().toUpperCase() === 'VAGO');
    setEditDoctorName(isDesmontado ? 'DESMONTADO' : isVago ? 'VAGO' : slot.doctorName || '');
    setEditTimeRange(isVago || isDesmontado ? '' : slot.timeRange || '');
  };

  const handleSaveSlotEdit = () => {
    if (!editingSlotInfo) return;

    const trimmedDoctor = editDoctorName.trim().toUpperCase();
    const isDesmontado = trimmedDoctor === 'DESMONTADO';
    const isVago = !trimmedDoctor || trimmedDoctor === 'VAGO';

    setCurrentData((prev) => {
      const updatedConsultorios = prev.consultorios.map((cons) => {
        if (cons.id !== editingSlotInfo.consultorioId) return cons;

        const updatedDaySchedule = { ...cons.schedule[editingSlotInfo.day] };
        updatedDaySchedule[editingSlotInfo.period] = {
          doctorName: isDesmontado ? 'DESMONTADO' : isVago ? '' : trimmedDoctor,
          timeRange: isDesmontado || isVago ? '' : editTimeRange.trim(),
          isDesmontado: isDesmontado,
        };

        return {
          ...cons,
          schedule: {
            ...cons.schedule,
            [editingSlotInfo.day]: updatedDaySchedule,
          },
        };
      });

      return {
        ...prev,
        consultorios: updatedConsultorios,
      };
    });

    setEditingSlotInfo(null);
  };

  const isSlotWithDoctor = (slot?: OperacionalSlot) => {
    if (!slot) return false;
    if (slot.isDesmontado) return false;
    const name = slot.doctorName ? slot.doctorName.trim() : '';
    if (!name) return false;
    const upper = name.toUpperCase();
    return upper !== 'VAGO' && upper !== 'DESMONTADO' && upper !== 'DISPONÍVEL' && upper !== 'DISPONIVEL' && upper !== '-' && upper !== 'N/A';
  };

  // Active Consultorios count
  const activeCount = currentData.consultorios.filter((c) => {
    const scheduleValues = Object.values(c.schedule) as Array<{ manha: OperacionalSlot; tarde: OperacionalSlot }>;
    return scheduleValues.some(
      (dayObj) => isSlotWithDoctor(dayObj.manha) || isSlotWithDoctor(dayObj.tarde)
    );
  }).length;

  // Registered doctors count in the currently selected unit (automatically computed from currentData.consultorios)
  const unitDoctorsSet = new Set<string>();

  currentData.consultorios.forEach((cons) => {
    daysOfWeek.forEach((day) => {
      const daySchedule = cons.schedule?.[day];
      ['manha', 'tarde'].forEach((period) => {
        const slot = daySchedule?.[period as 'manha' | 'tarde'];
        if (isSlotWithDoctor(slot) && slot?.doctorName) {
          const docClean = slot.doctorName.trim().toUpperCase();
          if (docClean) {
            unitDoctorsSet.add(docClean);
          }
        }
      });
    });
  });

  const registeredDoctorsCount = unitDoctorsSet.size;
  const formattedDoctorsCount = registeredDoctorsCount < 10 ? `0${registeredDoctorsCount}` : `${registeredDoctorsCount}`;

  // Status counts: Occupied vs Vago slots (automatically recomputed on every slot change)
  let occupiedSlotsCount = 0;
  let vagoSlotsCount = 0;

  currentData.consultorios.forEach((cons) => {
    daysOfWeek.forEach((day) => {
      const daySchedule = cons.schedule?.[day];
      ['manha', 'tarde'].forEach((period) => {
        const slot = daySchedule?.[period as 'manha' | 'tarde'];
        const isDesmontado = slot?.isDesmontado || slot?.doctorName === 'DESMONTADO';
        const isVago = !isDesmontado && (!slot?.doctorName || slot.doctorName.trim() === '' || slot.doctorName.trim().toUpperCase() === 'VAGO');
        if (!isDesmontado) {
          if (isVago) {
            vagoSlotsCount++;
          } else {
            occupiedSlotsCount++;
          }
        }
      });
    });
  });

  const moduleTitle = activeModule === 'consultas' ? 'Consultas' : activeModule === 'exames' ? 'Exames' : 'Recesso';

  // Sub-module Dropdown Navigation Header Bar
  const renderModuleDropdown = () => (
    <div className="bg-white rounded-xl p-3 px-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-normal">Módulo Operacional:</span>
        <div className="relative">
          <button
            onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
            className="bg-[#0F2942] hover:bg-[#0A2036] text-white text-xs font-normal px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-medium">{moduleTitle}</span>
            <ChevronDown className="w-4 h-4 text-slate-300" />
          </button>

          {isModuleDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-40 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setActiveModule('consultas');
                  setIsModuleDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-normal flex items-center gap-2.5 cursor-pointer ${
                  activeModule === 'consultas' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Consultas</span>
              </button>

              <button
                onClick={() => {
                  setActiveModule('exames');
                  setIsModuleDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-normal flex items-center gap-2.5 cursor-pointer border-t border-slate-100 ${
                  activeModule === 'exames' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Exames</span>
              </button>

              <button
                onClick={() => {
                  setActiveModule('recesso');
                  setIsModuleDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-normal flex items-center gap-2.5 cursor-pointer border-t border-slate-100 ${
                  activeModule === 'recesso' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Palmtree className="w-4 h-4 text-amber-600" />
                <span>Recesso</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-400 font-normal hidden sm:block">
        Selecione uma opção para alternar as páginas do Operacional
      </div>
    </div>
  );

  if (activeModule === 'recesso') {
    return (
      <div className="space-y-4">
        {renderModuleDropdown()}
        <RecessoView recessoData={recessoData} setRecessoData={setRecessoData} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* DROPDOWN NAVIGATION HEADER */}
      {renderModuleDropdown()}

      {/* HEADER SECTION */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-4">
        {/* Navigation bar for units */}
        <div className="space-y-2 text-xs text-slate-600 font-normal">
          <div className="text-slate-600 font-normal">
            Navegar para outra unidade de <span className="font-normal text-slate-800">{moduleTitle}</span>:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {units.map((unit) => {
              const isSelected = selectedUnit === unit;
              return (
                <button
                  key={unit}
                  onClick={() => {
                    setSelectedUnit(unit);
                  }}
                  className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E426E] text-white font-medium shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-normal'
                  }`}
                >
                  {unit}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title + Subtitle */}
        <div>
          <h1 className="text-base sm:text-lg font-normal text-[#0F2942] tracking-tight">
            {moduleTitle} - {selectedUnit}
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Unidade Médica - Agenda de {moduleTitle}
          </p>
        </div>

        {/* KPI Cards Row - Compacted */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Card 1: Consultórios / Exames */}
          <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between items-center text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs font-normal">
              <Building2 className="w-3.5 h-3.5 text-[#1E426E]" />
              <span>{activeModule === 'exames' ? 'Salas / Exames' : 'Consultórios'}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-base font-normal text-slate-900">
                {activeCount > 0 ? activeCount : currentData.consultorios.length}/{currentData.consultorios.length}
              </div>
              <div className="text-[11px] text-slate-500 font-normal">Ativos</div>
            </div>
          </div>

          {/* Card 2: Medicos */}
          <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between items-center text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs font-normal">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Medicos</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-base font-normal text-slate-900">{formattedDoctorsCount}</div>
              <div className="text-[11px] text-slate-500 font-normal">Cadastrados</div>
            </div>
          </div>

          {/* Card 3: Atividade Semanal */}
          <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between items-center text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs font-normal">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-medium text-xs text-slate-800 truncate" title={`Atividade Semanal: ${activeModule === 'exames' ? 'Exames' : 'Consultas'}`}>
                Atividade Semanal: {activeModule === 'exames' ? 'Exames' : 'Consultas'}
              </span>
            </div>
            <div className="w-full text-[11px] text-slate-700 space-y-1 pt-0.5 max-w-[210px] mx-auto">
              <div className="flex items-center justify-between px-2">
                <span className="flex items-center gap-1 text-slate-600">
                  SEG: <strong className="text-slate-900 font-semibold">08</strong>
                </span>
                <span className="text-slate-300 font-light">|</span>
                <span className="flex items-center gap-1 text-slate-600">
                  TER: <strong className="text-slate-900 font-semibold">08</strong>
                </span>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="flex items-center gap-1 text-slate-600">
                  QUA: <strong className="text-slate-900 font-semibold">08</strong>
                </span>
                <span className="text-slate-300 font-light">|</span>
                <span className="flex items-center gap-1 text-slate-600">
                  QUI: <strong className="text-slate-900 font-semibold">08</strong>
                </span>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="flex items-center gap-1 text-slate-600">
                  SEX: <strong className="text-slate-900 font-semibold">08</strong>
                </span>
                <span className="text-slate-300 font-light">|</span>
                <span className="flex items-center gap-1 text-slate-500">
                  SAB: <strong className="text-slate-600 font-semibold">0</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Status */}
          <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between items-center text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs font-normal">
              <Calendar className="w-3.5 h-3.5 text-[#1E426E]" />
              <span>Status</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-xs sm:text-sm font-normal text-slate-900 flex items-center justify-center flex-wrap gap-x-2 gap-y-0.5">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Online: <strong className="font-semibold text-slate-900">{occupiedSlotsCount}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                  <span className="text-red-600">Offline:</span> <strong className="font-semibold text-red-600">{vagoSlotsCount}</strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-normal mt-0.5 text-center">
                {occupiedSlotsCount} {occupiedSlotsCount === 1 ? 'consultório ocupado' : 'consultórios ocupados'} e {vagoSlotsCount} {vagoSlotsCount === 1 ? 'vago' : 'vagos'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE SECTION */}
      <div className="space-y-4">
        {/* Top Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          {showSaveToast && (
            <div className="flex items-center gap-1.5 text-xs font-normal text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Escala Operacional de {moduleTitle} salva com sucesso!</span>
            </div>
          )}

          {canEdit ? (
            <>
              <button
                onClick={handleSave}
                className="bg-[#2366F6] hover:bg-[#1D53C9] active:bg-[#1848B2] text-white font-normal text-xs px-4 py-2 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Salvar</span>
              </button>

              <button
                onClick={() => setIsAddConsultorioOpen(true)}
                className="bg-[#0F3763] hover:bg-[#0C2A4C] active:bg-[#09203B] text-white font-normal text-xs px-3.5 py-2 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Modo Visualização (Alterações restritas ao Administrador)
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="bg-[#374151] hover:bg-[#1F2937] active:bg-[#111827] text-white font-normal text-xs px-3.5 py-2 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Exportar</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 py-1 overflow-hidden">
                <button
                  onClick={handlePrint}
                  className="w-full text-left px-4 py-2.5 text-xs font-normal text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2.5 text-xs font-normal text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Exportar CSV / Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="bg-[#0A2B4E] text-white text-xs font-normal uppercase tracking-wider">
                  <th className="py-3 px-2 border-r border-[#1C426E] w-28 text-center">
                    {activeModule === 'exames' ? 'SALAS' : 'CONSULTÓRIOS'}
                  </th>
                  <th className="py-3 px-3 border-r border-[#1C426E] w-24 text-center">PERÍODO</th>
                  {daysOfWeek.map((day) => (
                    <th key={day} className="py-3 px-3 border-r border-[#1C426E] text-center last:border-r-0">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentData.consultorios.map((cons) => (
                  <React.Fragment key={cons.id}>
                    {/* Row 1: Manhã */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      {/* Name (spans 2 rows: Manhã & Tarde) */}
                      <td
                        rowSpan={2}
                        className="py-3 px-1.5 border-r border-slate-200 border-b border-dashed border-slate-400 font-normal text-xs text-slate-700 text-center bg-slate-50/80 align-middle"
                      >
                        <div className="flex items-center justify-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteConsultorio(cons.id, cons.name)}
                              title="Remover Item"
                              className="text-rose-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <span className="font-normal text-xs text-slate-700">{cons.name}</span>
                        </div>
                      </td>

                      {/* Período: Manhã */}
                      <td className="p-3 border-r border-slate-200 text-xs font-normal text-slate-600 text-center bg-white align-middle">
                        Manhã
                      </td>

                      {/* Days Slots for Manhã */}
                      {daysOfWeek.map((day) => {
                        const slot = cons.schedule[day]?.manha || { doctorName: '', timeRange: '' };
                        const isDesmontado = slot.isDesmontado || slot.doctorName === 'DESMONTADO';
                        const isVago = !isDesmontado && (!slot.doctorName || slot.doctorName.trim().toUpperCase() === 'VAGO');

                        return (
                          <td
                            key={`m_${cons.id}_${day}`}
                            onClick={() => canEdit && handleStartEditSlot(cons.id, day, 'manha', slot)}
                            className={`p-1.5 border-r border-slate-200 last:border-r-0 align-middle ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div
                              className={`rounded-lg py-2 px-2 transition-all shadow-2xs text-center flex flex-col justify-center min-h-[52px] ${
                                isDesmontado
                                  ? 'bg-slate-200 text-slate-600 border border-slate-300'
                                  : !isVago
                                  ? 'bg-[#BCE3FE] text-[#1E293B] border border-[#93C5FD]/40 hover:bg-[#A6D8FC]'
                                  : 'bg-slate-100 text-slate-800 font-medium border border-dashed border-slate-400 hover:bg-slate-200/80'
                              }`}
                            >
                              <div
                                className={`text-[11px] uppercase tracking-wide leading-tight line-clamp-1 ${
                                  isVago ? 'font-semibold text-slate-800' : 'font-normal'
                                }`}
                              >
                                {isDesmontado ? 'DESMONTADO' : isVago ? 'VAGO' : slot.doctorName}
                              </div>
                              {!isDesmontado && !isVago && slot.timeRange ? (
                                <div className="text-[10px] text-slate-600 font-normal mt-0.5">
                                  {slot.timeRange}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 2: Tarde */}
                    <tr className="hover:bg-slate-50/50 transition-colors border-b border-dashed border-slate-400">
                      {/* Período: Tarde */}
                      <td className="p-3 border-r border-slate-200 text-xs font-normal text-slate-600 text-center bg-white align-middle">
                        Tarde
                      </td>

                      {/* Days Slots for Tarde */}
                      {daysOfWeek.map((day) => {
                        const slot = cons.schedule[day]?.tarde || { doctorName: '', timeRange: '' };
                        const isDesmontado = slot.isDesmontado || slot.doctorName === 'DESMONTADO';
                        const isVago = !isDesmontado && (!slot.doctorName || slot.doctorName.trim().toUpperCase() === 'VAGO');

                        return (
                          <td
                            key={`t_${cons.id}_${day}`}
                            onClick={() => canEdit && handleStartEditSlot(cons.id, day, 'tarde', slot)}
                            className={`p-1.5 border-r border-slate-200 last:border-r-0 align-middle ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div
                              className={`rounded-lg py-2 px-2 transition-all shadow-2xs text-center flex flex-col justify-center min-h-[52px] ${
                                isDesmontado
                                  ? 'bg-slate-200 text-slate-600 border border-slate-300'
                                  : !isVago
                                  ? 'bg-[#FFD8A8] text-[#1E293B] border border-[#FDBA74]/40 hover:bg-[#FCCB92]'
                                  : 'bg-slate-100 text-slate-800 font-medium border border-dashed border-slate-400 hover:bg-slate-200/80'
                              }`}
                            >
                              <div
                                className={`text-[11px] uppercase tracking-wide leading-tight line-clamp-1 ${
                                  isVago ? 'font-semibold text-slate-800' : 'font-normal'
                                }`}
                              >
                                {isDesmontado ? 'DESMONTADO' : isVago ? 'VAGO' : slot.doctorName}
                              </div>
                              {!isDesmontado && !isVago && slot.timeRange ? (
                                <div className="text-[10px] text-slate-600 font-normal mt-0.5">
                                  {slot.timeRange}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTTOM INSTRUCTION BANNER */}
          <div className="bg-[#0A2B4E] text-white text-xs font-normal py-3 px-5 border-t border-[#1C426E]">
            Instrução: Sessão ativa. Clique em qualquer célula para editar. Digite "DESMONTADO" para marcar como inativo.
          </div>
        </div>
      </div>

      {/* EDIT SLOT MODAL */}
      {editingSlotInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0A2B4E] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-normal uppercase tracking-wide">
                  Editar Célula Operacional ({moduleTitle})
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {editingSlotInfo.day} — {editingSlotInfo.period === 'manha' ? 'Manhã' : 'Tarde'}
                </p>
              </div>
              <button
                onClick={() => setEditingSlotInfo(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1">
                  {activeModule === 'exames' ? 'Nome do Exame / Técnico / Status' : 'Nome do Médico / Status'}
                </label>
                <input
                  type="text"
                  value={editDoctorName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditDoctorName(val);
                    if (val.trim().toUpperCase() === 'VAGO' || val.trim() === '') {
                      setEditTimeRange('');
                    }
                  }}
                  placeholder={activeModule === 'exames' ? 'Ex: ULTRASSONOGRAFIA ou "VAGO"' : 'Ex: DR. CARLOS SILVA ou "VAGO"'}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-normal"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Digite <strong className="text-slate-700 font-normal">VAGO</strong> para deixar vago, ou <strong className="text-slate-700 font-normal">DESMONTADO</strong> para inativar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 mb-1">
                  Horário do Atendimento
                </label>
                <input
                  type="text"
                  value={editTimeRange}
                  onChange={(e) => setEditTimeRange(e.target.value)}
                  placeholder="Ex: 08:00 - 12:00"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal"
                />
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditDoctorName('DESMONTADO');
                    setEditTimeRange('');
                  }}
                  className="text-xs font-normal text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Marcar "DESMONTADO"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditDoctorName('VAGO');
                    setEditTimeRange('');
                  }}
                  className="text-xs font-normal text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Limpar (Vago)
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingSlotInfo(null)}
                className="px-4 py-2 text-xs font-normal text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSlotEdit}
                className="px-4 py-2 text-xs font-normal text-white bg-[#2366F6] hover:bg-[#1D53C9] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONSULTORIO / EXAME MODAL */}
      {isAddConsultorioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0F3763] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-xs font-normal uppercase tracking-wide">
                Adicionar {activeModule === 'exames' ? 'Nova Sala de Exame' : 'Novo Consultório'}
              </h3>
              <button
                onClick={() => setIsAddConsultorioOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block text-xs font-normal text-slate-700">
                Nome do {activeModule === 'exames' ? 'Exame / Sala' : 'Consultório'}
              </label>
              <input
                type="text"
                value={newConsultorioName}
                onChange={(e) => setNewConsultorioName(e.target.value)}
                placeholder={activeModule === 'exames' ? `Ex: EXAME ${currentData.consultorios.length + 1}` : `Ex: CONS. ${currentData.consultorios.length + 1}`}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-normal"
              />
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddConsultorioOpen(false)}
                className="px-4 py-2 text-xs font-normal text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddConsultorio}
                className="px-4 py-2 text-xs font-normal text-white bg-[#0F3763] hover:bg-[#0C2A4C] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingConsultorioInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-xs font-normal uppercase tracking-wide">
                Confirmar Exclusão
              </h3>
              <button
                onClick={() => setDeletingConsultorioInfo(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 font-normal">
                Deseja realmente remover <strong className="font-semibold text-slate-900">{deletingConsultorioInfo.name}</strong> da escala operacional?
              </p>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingConsultorioInfo(null)}
                className="px-4 py-2 text-xs font-normal text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const idToDelete = deletingConsultorioInfo.id;
                  setCurrentData((prev) => ({
                    ...prev,
                    consultorios: prev.consultorios.filter((c) => c.id !== idToDelete),
                  }));
                  setDeletingConsultorioInfo(null);
                }}
                className="px-4 py-2 text-xs font-normal text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
