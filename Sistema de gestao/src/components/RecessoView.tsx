import React, { useState } from 'react';
import { RecessoWeekData, RecessoConsultorio, DayOfWeek, RecessoSlot } from '../types';
import {
  Plus,
  Trash2,
  X,
  Check,
  Building2,
  Users,
  Clock,
  Calendar,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

interface RecessoViewProps {
  recessoData: RecessoWeekData[];
  setRecessoData: React.Dispatch<React.SetStateAction<RecessoWeekData[]>>;
}

const daysOfWeek: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const RecessoView: React.FC<RecessoViewProps> = ({
  recessoData,
  setRecessoData,
}) => {
  // State for editable top header cards
  const [headerCards, setHeaderCards] = useState({
    unidade: 'HOSB - Fonseca',
    coordName: 'Dra. Ana Costa',
    recepName: 'Mariana Silva',
    preExamesName: 'Patricia Santos',
    orientCirurgicaName: 'Dr. Felipe Barros',
    tecnicoExamesName: 'Dr. Lucas Oliveira',
    setorAutorizacaoName: 'Fernanda Souza',
  });

  // Modal state for adding a consultório
  const [activeWeekForAdd, setActiveWeekForAdd] = useState<string | null>(null);
  const [newConsultorioName, setNewConsultorioName] = useState('');

  // Delete modals state
  const [deletingConsultorioInfo, setDeletingConsultorioInfo] = useState<{
    weekId: string;
    consultorioId: string;
    name: string;
  } | null>(null);
  const [deletingWeekInfo, setDeletingWeekInfo] = useState<{ id: string; title: string } | null>(null);

  // Editing state for a specific slot: weekId_consultorioId_day_period
  const [editingSlotKey, setEditingSlotKey] = useState<string | null>(null);
  const [editDoctorName, setEditDoctorName] = useState('');
  const [editTimeRange, setEditTimeRange] = useState('');

  // Top Actions Bar States
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const handleSave = () => {
    setRecessoData([...recessoData]);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleAddWeek = () => {
    const weekCount = recessoData.length + 1;
    const newWeekId = `week_${Date.now()}`;

    const defaultConsultorios: RecessoConsultorio[] = [
      {
        id: `c_${Date.now()}_1`,
        name: 'CONS. 1',
        schedule: daysOfWeek.reduce((acc, day) => {
          acc[day] = {
            manha: { doctorName: 'DR. MÉDICO', timeRange: '08:00 - 12:00' },
            tarde: { doctorName: 'DRA. MÉDICA', timeRange: '14:00 - 18:00' },
          };
          return acc;
        }, {} as RecessoConsultorio['schedule']),
      },
      {
        id: `c_${Date.now()}_2`,
        name: 'CONS. 2',
        schedule: daysOfWeek.reduce((acc, day) => {
          acc[day] = {
            manha: { doctorName: 'DRA. MÉDICA', timeRange: '08:00 - 12:00' },
            tarde: { doctorName: 'DR. MÉDICO', timeRange: '14:00 - 18:00' },
          };
          return acc;
        }, {} as RecessoConsultorio['schedule']),
      },
    ];

    const newWeek: RecessoWeekData = {
      id: newWeekId,
      title: `SEMANA DE RECESSO ${weekCount}`,
      consultorios: defaultConsultorios,
    };

    setRecessoData((prev) => [...prev, newWeek]);
  };

  const handleDeleteWeek = (weekId: string, title: string) => {
    setDeletingWeekInfo({ id: weekId, title });
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Semana,Consultório,Período,SEG,TER,QUA,QUI,SEX,SÁB\n';

    recessoData.forEach((week) => {
      week.consultorios.forEach((cons) => {
        ['manha', 'tarde'].forEach((period) => {
          const periodLabel = period === 'manha' ? 'Manhã' : 'Tarde';
          const rowData = daysOfWeek.map((day) => {
            const slot = cons.schedule[day]?.[period as 'manha' | 'tarde'];
            return slot ? `"${slot.doctorName} (${slot.timeRange})"` : '""';
          });
          csvContent += `"${week.title}","${cons.name}","${periodLabel}",${rowData.join(',')}\n`;
        });
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Escala_Recesso_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handlePrint = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  const handleStartEditSlot = (
    weekId: string,
    consultorioId: string,
    day: DayOfWeek,
    period: 'manha' | 'tarde',
    currentSlot: RecessoSlot
  ) => {
    const key = `${weekId}_${consultorioId}_${day}_${period}`;
    setEditingSlotKey(key);
    setEditDoctorName(currentSlot.doctorName || '');
    setEditTimeRange(currentSlot.timeRange || (period === 'manha' ? '08:00 - 12:00' : '14:00 - 18:00'));
  };

  const handleSaveSlot = (
    weekId: string,
    consultorioId: string,
    day: DayOfWeek,
    period: 'manha' | 'tarde'
  ) => {
    setRecessoData((prev) =>
      prev.map((week) => {
        if (week.id !== weekId) return week;
        return {
          ...week,
          consultorios: week.consultorios.map((c) => {
            if (c.id !== consultorioId) return c;
            return {
              ...c,
              schedule: {
                ...c.schedule,
                [day]: {
                  ...c.schedule[day],
                  [period]: {
                    doctorName: editDoctorName.toUpperCase(),
                    timeRange: editTimeRange,
                  },
                },
              },
            };
          }),
        };
      })
    );
    setEditingSlotKey(null);
  };

  const handleAddConsultorio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWeekForAdd || !newConsultorioName.trim()) return;

    const newId = `c_${Date.now()}`;
    const defaultSchedule = daysOfWeek.reduce((acc, day) => {
      acc[day] = {
        manha: { doctorName: 'DR. MÉDICO', timeRange: '08:00 - 12:00' },
        tarde: { doctorName: 'DRA. MÉDICA', timeRange: '14:00 - 18:00' },
      };
      return acc;
    }, {} as RecessoConsultorio['schedule']);

    const newConsultorio: RecessoConsultorio = {
      id: newId,
      name: newConsultorioName.toUpperCase().trim(),
      schedule: defaultSchedule,
    };

    setRecessoData((prev) =>
      prev.map((week) => {
        if (week.id !== activeWeekForAdd) return week;
        return {
          ...week,
          consultorios: [...week.consultorios, newConsultorio],
        };
      })
    );

    setNewConsultorioName('');
    setActiveWeekForAdd(null);
  };

  const handleDeleteConsultorio = (weekId: string, consultorioId: string, name: string) => {
    setDeletingConsultorioInfo({ weekId, consultorioId, name });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Editable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Unidade */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col items-center justify-center text-center space-y-3 min-h-[140px]">
          <Building2 className="w-8 h-8 text-[#0F294A]" />
          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-xs text-slate-600 font-medium">Unidade:</span>
            <input
              type="text"
              value={headerCards.unidade}
              onChange={(e) => setHeaderCards({ ...headerCards, unidade: e.target.value })}
              className="bg-[#EBF4FF] border border-[#90C2FF] text-[#0F294A] font-semibold text-xs px-3 py-1.5 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-blue-500 w-full max-w-[180px]"
            />
          </div>
        </div>

        {/* Card 2: Funcionarios (Coordenação / Recepção) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-1.5">
            <Users className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-sm text-[#0F294A]">Funcionários</span>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="block text-slate-600 font-medium text-[11px] mb-1">Coordenação:</span>
              <textarea
                rows={2}
                value={headerCards.coordName}
                onChange={(e) => setHeaderCards({ ...headerCards, coordName: e.target.value })}
                placeholder="Insira um ou mais nomes..."
                className="w-full text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-md p-1.5 border border-slate-200 focus:border-blue-400 focus:outline-none transition-all resize-y"
              />
            </div>
            <div>
              <span className="block text-slate-600 font-medium text-[11px] mb-1">Recepção:</span>
              <textarea
                rows={2}
                value={headerCards.recepName}
                onChange={(e) => setHeaderCards({ ...headerCards, recepName: e.target.value })}
                placeholder="Insira um ou mais nomes..."
                className="w-full text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-md p-1.5 border border-slate-200 focus:border-blue-400 focus:outline-none transition-all resize-y"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Funcionarios (Pre-exames / Orientação Cirurgica) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-1.5">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="font-semibold text-sm text-[#0F294A]">Funcionários</span>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="block text-slate-600 font-medium text-[11px] mb-1">Pré-exames:</span>
              <textarea
                rows={2}
                value={headerCards.preExamesName}
                onChange={(e) => setHeaderCards({ ...headerCards, preExamesName: e.target.value })}
                placeholder="Insira um ou mais nomes..."
                className="w-full text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-md p-1.5 border border-slate-200 focus:border-blue-400 focus:outline-none transition-all resize-y"
              />
            </div>
            <div>
              <span className="block text-slate-600 font-medium text-[11px] mb-1">Orientação Cirúrgica:</span>
              <textarea
                rows={2}
                value={headerCards.orientCirurgicaName}
                onChange={(e) => setHeaderCards({ ...headerCards, orientCirurgicaName: e.target.value })}
                placeholder="Insira um ou mais nomes..."
                className="w-full text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-md p-1.5 border border-slate-200 focus:border-blue-400 focus:outline-none transition-all resize-y"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Funcionarios (Tecnico de Exames / Setor de autorização) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-1.5">
            <Calendar className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span className="font-semibold text-sm text-[#0F294A]">Funcionários</span>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="block text-slate-600 font-medium text-[11px] mb-1">Técnico de Exames:</span>
              <textarea
                rows={2}
                value={headerCards.tecnicoExamesName}
                onChange={(e) => setHeaderCards({ ...headerCards, tecnicoExamesName: e.target.value })}
                placeholder="Insira um ou mais nomes..."
                className="w-full text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-md p-1.5 border border-slate-200 focus:border-blue-400 focus:outline-none transition-all resize-y"
              />
            </div>
            <div>
              <span className="block text-slate-600 font-medium text-[11px] mb-1">Setor de Autorização:</span>
              <textarea
                rows={2}
                value={headerCards.setorAutorizacaoName}
                onChange={(e) => setHeaderCards({ ...headerCards, setorAutorizacaoName: e.target.value })}
                placeholder="Insira um ou mais nomes..."
                className="w-full text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-md p-1.5 border border-slate-200 focus:border-blue-400 focus:outline-none transition-all resize-y"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Action Buttons Bar: Salvar | + Adicionar Semana | Exportar v */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 pb-1">
        {showSaveToast && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Escala salva com sucesso!</span>
          </div>
        )}

        <button
          onClick={handleSave}
          className="bg-[#2366F6] hover:bg-[#1D53C9] active:bg-[#1848B2] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>Salvar</span>
        </button>

        <button
          onClick={handleAddWeek}
          className="bg-[#109B48] hover:bg-[#0D823C] active:bg-[#0A6930] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Semana</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="bg-[#374151] hover:bg-[#1F2937] active:bg-[#111827] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Exportar</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-30 py-1 overflow-hidden">
              <button
                onClick={handlePrint}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Imprimir / PDF</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar CSV / Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {recessoData.map((week) => (
        <div key={week.id} className="space-y-4">
          {/* Header Title + Delete Week option + + Consultorio button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-normal text-slate-800 tracking-tight uppercase">
                {week.title}
              </h2>
              {recessoData.length > 1 && (
                <button
                  onClick={() => handleDeleteWeek(week.id, week.title)}
                  title="Excluir esta semana de recesso"
                  className="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setActiveWeekForAdd(week.id)}
              className="flex items-center gap-1.5 bg-[#255284] hover:bg-[#1E426E] text-white font-normal text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Consultório</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-x-auto">
            <table className="w-full border-collapse text-center min-w-[950px]">
              {/* Lighter Blue Table Header Bar */}
              <thead>
                <tr className="bg-[#255284] text-white text-xs font-normal uppercase tracking-wider">
                  <th className="py-3 px-3 text-left w-28 border-r border-[#316399]">
                    Consultórios
                  </th>
                  <th className="py-3 px-3 w-20 border-r border-[#316399]">Período</th>
                  {daysOfWeek.map((day) => (
                    <th key={day} className="py-3 px-3 border-r border-[#316399] last:border-r-0">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body per Consultório */}
              <tbody className="divide-y divide-gray-200 text-xs">
                {week.consultorios.map((cons) => (
                  <React.Fragment key={cons.id}>
                    {/* Sub-row 1: Manhã */}
                    <tr className="bg-white">
                      {/* Consultório Name (spans 2 rows) */}
                      <td
                        rowSpan={2}
                        className="py-4 px-3 font-normal text-gray-700 align-middle border-r border-gray-200 text-left bg-gray-50/50"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteConsultorio(week.id, cons.id, cons.name)}
                            title="Excluir Consultório"
                            className="text-rose-400 hover:text-rose-600 p-0.5 rounded-sm hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span>{cons.name}</span>
                        </div>
                      </td>

                      {/* Período Name */}
                      <td className="py-3 px-2 font-normal text-gray-500 border-r border-gray-200 bg-gray-50/30">
                        Manhã
                      </td>

                      {/* Days Slots for Manhã */}
                      {daysOfWeek.map((day) => {
                        const slot = cons.schedule[day]?.manha || {
                          doctorName: '',
                          timeRange: '08:00 - 12:00',
                        };
                        const isVago = !slot.doctorName || slot.doctorName.trim() === '' || slot.doctorName.trim().toUpperCase() === 'VAGO';
                        const key = `${week.id}_${cons.id}_${day}_manha`;
                        const isEditing = editingSlotKey === key;

                        return (
                          <td key={day} className="p-2 border-r border-gray-200 last:border-r-0">
                            {isEditing ? (
                              <div className="p-1.5 bg-sky-50 rounded-md border border-sky-300 space-y-1">
                                <input
                                  type="text"
                                  value={editDoctorName}
                                  onChange={(e) => setEditDoctorName(e.target.value)}
                                  placeholder="NOME MÉDICO"
                                  className="w-full bg-white border border-sky-300 rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-gray-800 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={editTimeRange}
                                  onChange={(e) => setEditTimeRange(e.target.value)}
                                  placeholder="08:00 - 12:00"
                                  className="w-full bg-white border border-sky-300 rounded-sm px-1.5 py-0.5 text-[10px] text-gray-600 focus:outline-none"
                                />
                                <div className="flex items-center justify-center gap-2 pt-1">
                                  <button
                                    onClick={() =>
                                      handleSaveSlot(week.id, cons.id, day, 'manha')
                                    }
                                    className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSlotKey(null)}
                                    className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  handleStartEditSlot(
                                    week.id,
                                    cons.id,
                                    day,
                                    'manha',
                                    slot
                                  )
                                }
                                className={`rounded-xl py-2.5 px-3 cursor-pointer transition-all shadow-2xs text-center flex flex-col justify-center min-h-[52px] ${
                                  !isVago
                                    ? 'bg-[#BCE3FE] text-[#1E293B] border border-[#93C5FD]/40 hover:bg-[#A6D8FC]'
                                    : 'bg-slate-100 text-slate-800 font-medium border border-dashed border-slate-400 hover:bg-slate-200/80'
                                }`}
                              >
                                <div
                                  className={`text-[11px] uppercase tracking-wide leading-tight line-clamp-1 ${
                                    isVago ? 'font-semibold text-slate-800' : 'font-normal'
                                  }`}
                                >
                                  {isVago ? 'VAGO' : slot.doctorName}
                                </div>
                                {!isVago && slot.timeRange ? (
                                  <div className="text-[10px] text-slate-600 font-normal mt-0.5">
                                    {slot.timeRange}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Sub-row 2: Tarde */}
                    <tr className="bg-white border-b border-gray-200">
                      {/* Período Name */}
                      <td className="py-3 px-2 font-normal text-gray-500 border-r border-gray-200 bg-gray-50/30">
                        Tarde
                      </td>

                      {/* Days Slots for Tarde */}
                      {daysOfWeek.map((day) => {
                        const slot = cons.schedule[day]?.tarde || {
                          doctorName: '',
                          timeRange: '14:00 - 18:00',
                        };
                        const isVago = !slot.doctorName || slot.doctorName.trim() === '' || slot.doctorName.trim().toUpperCase() === 'VAGO';
                        const key = `${week.id}_${cons.id}_${day}_tarde`;
                        const isEditing = editingSlotKey === key;

                        return (
                          <td key={day} className="p-2 border-r border-gray-200 last:border-r-0">
                            {isEditing ? (
                              <div className="p-1.5 bg-amber-50 rounded-md border border-amber-300 space-y-1">
                                <input
                                  type="text"
                                  value={editDoctorName}
                                  onChange={(e) => setEditDoctorName(e.target.value)}
                                  placeholder="NOME MÉDICO"
                                  className="w-full bg-white border border-amber-300 rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-gray-800 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={editTimeRange}
                                  onChange={(e) => setEditTimeRange(e.target.value)}
                                  placeholder="14:00 - 18:00"
                                  className="w-full bg-white border border-amber-300 rounded-sm px-1.5 py-0.5 text-[10px] text-gray-600 focus:outline-none"
                                />
                                <div className="flex items-center justify-center gap-2 pt-1">
                                  <button
                                    onClick={() =>
                                      handleSaveSlot(week.id, cons.id, day, 'tarde')
                                    }
                                    className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSlotKey(null)}
                                    className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  handleStartEditSlot(
                                    week.id,
                                    cons.id,
                                    day,
                                    'tarde',
                                    slot
                                  )
                                }
                                className={`rounded-xl py-2.5 px-3 cursor-pointer transition-all shadow-2xs text-center flex flex-col justify-center min-h-[52px] ${
                                  !isVago
                                    ? 'bg-[#FFD8A8] text-[#1E293B] border border-[#FDBA74]/40 hover:bg-[#FCCB92]'
                                    : 'bg-slate-100 text-slate-800 font-medium border border-dashed border-slate-400 hover:bg-slate-200/80'
                                }`}
                              >
                                <div
                                  className={`text-[11px] uppercase tracking-wide leading-tight line-clamp-1 ${
                                    isVago ? 'font-semibold text-slate-800' : 'font-normal'
                                  }`}
                                >
                                  {isVago ? 'VAGO' : slot.doctorName}
                                </div>
                                {!isVago && slot.timeRange ? (
                                  <div className="text-[10px] text-slate-600 font-normal mt-0.5">
                                    {slot.timeRange}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Add Consultório Modal */}
      {activeWeekForAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900">Novo Consultório</h3>
              <button
                onClick={() => setActiveWeekForAdd(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddConsultorio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nome do Consultório
                </label>
                <input
                  type="text"
                  required
                  value={newConsultorioName}
                  onChange={(e) => setNewConsultorioName(e.target.value)}
                  placeholder="Ex: CONS. 5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveWeekForAdd(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0F294A] hover:bg-[#1e3a66] text-white cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CONSULTÓRIO MODAL */}
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
                Deseja realmente remover <strong className="font-semibold text-slate-900">{deletingConsultorioInfo.name}</strong> da escala de recesso?
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
                  const { weekId, consultorioId } = deletingConsultorioInfo;
                  setRecessoData((prev) =>
                    prev.map((week) => {
                      if (week.id !== weekId) return week;
                      return {
                        ...week,
                        consultorios: week.consultorios.filter((c) => c.id !== consultorioId),
                      };
                    })
                  );
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

      {/* CONFIRM DELETE WEEK MODAL */}
      {deletingWeekInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-xs font-normal uppercase tracking-wide">
                Excluir Semana de Recesso
              </h3>
              <button
                onClick={() => setDeletingWeekInfo(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 font-normal">
                Deseja realmente excluir a <strong className="font-semibold text-slate-900">{deletingWeekInfo.title}</strong>?
              </p>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingWeekInfo(null)}
                className="px-4 py-2 text-xs font-normal text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const weekId = deletingWeekInfo.id;
                  setRecessoData((prev) => prev.filter((w) => w.id !== weekId));
                  setDeletingWeekInfo(null);
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
