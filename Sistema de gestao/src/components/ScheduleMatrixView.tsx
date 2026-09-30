import React, { useState, useRef } from 'react';
import { DoctorColumn, ScheduleGridData, ScheduleSlot, DayOfWeek } from '../types';
import { Plus, Minus, Check, X, Edit2, Save, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { saveScheduleColumns, saveScheduleGrid } from '../lib/supabaseService';

interface ScheduleMatrixViewProps {
  title: 'Consultas' | 'Exames';
  columns: DoctorColumn[];
  setColumns: React.Dispatch<React.SetStateAction<DoctorColumn[]>>;
  gridData: ScheduleGridData;
  setGridData: React.Dispatch<React.SetStateAction<ScheduleGridData>>;
  canEdit?: boolean;
}

const daysOfWeek: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const ScheduleMatrixView: React.FC<ScheduleMatrixViewProps> = ({
  title,
  columns,
  setColumns,
  gridData,
  setGridData,
  canEdit = true,
}) => {
  // Editing state for specific cell key e.g. `${columnId}_${day}_${slotIndex}`
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [editDoctorName, setEditDoctorName] = useState('ROBERTO LIMA');
  const [editTimeRange, setEditTimeRange] = useState('14:00 - 18:00');
  const [editColor, setEditColor] = useState<'orange' | 'blue' | 'gray'>('orange');

  // Inline header column editing
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');

  // Column management modals
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const [isRenameColumnOpen, setIsRenameColumnOpen] = useState(false);
  const [selectedColumnToRename, setSelectedColumnToRename] = useState('');
  const [renameInputName, setRenameInputName] = useState('');

  const [isDeleteColumnOpen, setIsDeleteColumnOpen] = useState(false);
  const [selectedColumnToDelete, setSelectedColumnToDelete] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Table horizontal scroll reference
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const scrollHorizontally = (offset: number) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleStartEdit = (key: string, currentSlot?: ScheduleSlot) => {
    setEditingCellKey(key);
    if (currentSlot) {
      setEditDoctorName(currentSlot.doctorName);
      setEditTimeRange(currentSlot.timeRange);
      setEditColor(currentSlot.color);
    } else {
      setEditDoctorName('');
      setEditTimeRange('08:00 - 12:00');
      setEditColor('blue');
    }
  };

  const handleSaveCell = (key: string) => {
    const trimmed = editDoctorName.trim().toUpperCase();
    if (!trimmed || trimmed === 'VAGO') {
      // Remove slot if empty or VAGO
      const updated = { ...gridData };
      delete updated[key];
      setGridData(updated);
      showToast('Horário definido como vago.');
    } else {
      const newSlot: ScheduleSlot = {
        id: key,
        doctorName: trimmed,
        timeRange: editTimeRange,
        color: editColor,
      };
      setGridData((prev) => ({
        ...prev,
        [key]: newSlot,
      }));
      showToast('Horário atualizado com sucesso!');
    }
    setEditingCellKey(null);
  };

  const handleCancelCell = () => {
    setEditingCellKey(null);
  };

  // Inline column editing
  const handleStartEditColumn = (col: DoctorColumn) => {
    setEditingColumnId(col.id);
    setEditingColumnName(col.name);
  };

  const handleSaveColumnName = (colId: string) => {
    const trimmed = editingColumnName.trim().toUpperCase();
    if (trimmed) {
      setColumns((prev) =>
        prev.map((c) => (c.id === colId ? { ...c, name: trimmed } : c))
      );
      showToast(`Coluna atualizada para "${trimmed}"`);
    }
    setEditingColumnId(null);
  };

  // Modal column rename
  const handleOpenRenameModal = () => {
    if (columns.length > 0) {
      setSelectedColumnToRename(columns[0].id);
      setRenameInputName(columns[0].name);
    }
    setIsRenameColumnOpen(true);
  };

  const handleSelectColumnToRename = (colId: string) => {
    setSelectedColumnToRename(colId);
    const col = columns.find((c) => c.id === colId);
    if (col) setRenameInputName(col.name);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = renameInputName.trim().toUpperCase();
    if (!trimmed || !selectedColumnToRename) return;
    setColumns((prev) =>
      prev.map((c) => (c.id === selectedColumnToRename ? { ...c, name: trimmed } : c))
    );
    setIsRenameColumnOpen(false);
    showToast(`Coluna renomeada para "${trimmed}"`);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    const newId = `${title.toLowerCase().charAt(0)}_doc_${Date.now()}`;
    const newCol: DoctorColumn = {
      id: newId,
      name: newColumnName.toUpperCase().trim(),
    };
    setColumns((prev) => [...prev, newCol]);
    setNewColumnName('');
    setIsAddColumnOpen(false);
    showToast(`Coluna "${newCol.name}" incluída com sucesso!`);
  };

  const handleDeleteColumn = () => {
    if (!selectedColumnToDelete) return;
    const col = columns.find((c) => c.id === selectedColumnToDelete);
    setColumns((prev) => prev.filter((c) => c.id !== selectedColumnToDelete));
    setIsDeleteColumnOpen(false);
    setSelectedColumnToDelete('');
    showToast(`Coluna "${col?.name || ''}" removida com sucesso!`);
  };

  const handleSaveAll = async () => {
    try {
      const type = title.toLowerCase() as 'consultas' | 'exames';
      await Promise.all([
        saveScheduleColumns(type, columns),
        saveScheduleGrid(type, gridData),
      ]);
      showToast(`Tabela de ${title} salva com sucesso no banco de dados!`);
    } catch {
      showToast(`Erro ao salvar dados de ${title}.`);
    }
  };

  const getSlotColorClasses = (color: 'orange' | 'blue' | 'gray') => {
    switch (color) {
      case 'orange':
        return 'bg-[#FFD8A8] text-[#1E293B] border border-[#FDBA74]/40 hover:bg-[#FCCB92] shadow-2xs';
      case 'blue':
        return 'bg-[#BCE3FE] text-[#1E293B] border border-[#93C5FD]/40 hover:bg-[#A6D8FC] shadow-2xs';
      case 'gray':
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 shadow-2xs';
    }
  };

  const isCompactExameColumn = (colName: string) => {
    if (title !== 'Exames') return false;
    const name = colName.trim().toUpperCase();
    return ['DAYANA', 'ISIS', 'YASMIN', 'MARCIA'].includes(name);
  };

  const getColumnWidthClass = (colName: string) => {
    if (title === 'Exames') {
      return isCompactExameColumn(colName)
        ? 'min-w-[92px] w-[92px]'
        : 'min-w-[110px] w-[110px]';
    }
    return 'min-w-[175px]';
  };

  const minTableWidth = columns.reduce((acc, col) => {
    if (title === 'Exames') {
      return acc + (isCompactExameColumn(col.name) ? 92 : 110);
    }
    return acc + 175;
  }, 64);

  return (
    <div className="space-y-5 pb-12">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Bar with Manage Columns buttons */}
      {canEdit ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Gerenciar Colunas:
            </span>
            <button
              onClick={() => setIsAddColumnOpen(true)}
              className="flex items-center gap-1.5 bg-[#0F3763] hover:bg-[#0C2A4C] active:bg-[#09203B] text-white font-medium text-xs px-3 py-2 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Incluir</span>
            </button>
            <button
              onClick={handleOpenRenameModal}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white font-medium text-xs px-3 py-2 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Nome</span>
            </button>
            <button
              onClick={() => setIsDeleteColumnOpen(true)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium text-xs px-3 py-2 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 bg-[#2366F6] hover:bg-[#1D53C9] active:bg-[#1848B2] text-white font-medium text-xs px-4 py-2 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar {title}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Modo Visualização da Grade de {title}</span>
          <span className="font-medium text-slate-500">Alterações restritas ao Administrador</span>
        </div>
      )}

      {/* Main Grid Card with Prominent Horizontal Scrollbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Lighter Blue Header Banner */}
        <div className="bg-[#0F2942] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold tracking-tight text-white">
              Grade de {title}
            </h2>
            <span className="text-[11px] font-normal text-sky-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 shadow-2xs">
              (12 Colunas)
            </span>
          </div>
          <span className="text-xs text-sky-200">
            Clique no nome de qualquer coluna abaixo para editar
          </span>
        </div>

        {/* Scrollable Container with Custom Horizontal Scrollbar */}
        <div
          ref={tableScrollRef}
          className="overflow-x-auto overflow-y-hidden custom-horizontal-scrollbar bg-white"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#475569 #E2E8F0',
          }}
        >
          <table
            className="border-collapse text-center"
            style={{ minWidth: `${minTableWidth}px`, width: '100%' }}
          >
            {/* Header Doctor Columns */}
            <thead>
              <tr className="bg-[#0A2B4E] text-white border-b border-[#1C426E]">
                <th className={`${title === 'Exames' ? 'py-4' : 'py-3.5'} px-3 w-16 border-r border-[#1C426E] text-xs font-semibold uppercase tracking-wider text-slate-200 bg-[#071E36]`}>
                  DIA
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={`${title === 'Exames' ? 'py-3.5 px-1' : 'py-2.5 px-2'} font-semibold text-xs text-white tracking-wider uppercase border-r border-[#1C426E] last:border-r-0 ${getColumnWidthClass(col.name)}`}
                  >
                    {editingColumnId === col.id ? (
                      <div className="flex items-center justify-center gap-1 py-0.5">
                        <input
                          type="text"
                          autoFocus
                          value={editingColumnName}
                          onChange={(e) => setEditingColumnName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveColumnName(col.id);
                            if (e.key === 'Escape') setEditingColumnId(null);
                          }}
                          className={`bg-white text-slate-900 px-1 py-1 text-xs font-semibold rounded border border-blue-400 focus:outline-none ${title === 'Exames' ? 'w-16' : 'w-20'} text-center uppercase`}
                        />
                        <button
                          onClick={() => handleSaveColumnName(col.id)}
                          className="p-1 hover:bg-white/20 rounded text-emerald-300 hover:text-emerald-200 cursor-pointer"
                          title="Salvar nome"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingColumnId(null)}
                          className="p-1 hover:bg-white/20 rounded text-rose-300 hover:text-rose-200 cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => canEdit && handleStartEditColumn(col)}
                        className={`group flex items-center justify-center gap-1 ${canEdit ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'} py-1 px-1 rounded-lg transition-colors`}
                        title={canEdit ? "Clique para editar o nome da coluna" : undefined}
                      >
                        <span className="font-semibold text-xs tracking-wider uppercase truncate">
                          {col.name}
                        </span>
                        {canEdit && <Edit2 className="w-2.5 h-2.5 text-white/50 group-hover:text-white transition-opacity shrink-0" />}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Days of Week Rows */}
            <tbody className="divide-y divide-slate-200 text-xs">
              {daysOfWeek.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                  {/* Row Header: Day Name */}
                  <td className={`${title === 'Exames' ? 'py-7' : 'py-6'} px-3 font-semibold text-xs text-slate-700 uppercase border-r border-slate-200 bg-slate-50 text-center`}>
                    {day}
                  </td>

                  {/* Columns for Doctors */}
                  {columns.map((col) => {
                    const key0 = `${col.id}_${day}_0`;
                    const key1 = `${col.id}_${day}_1`;

                    const slot0 = gridData[key0];
                    const slot1 = gridData[key1];

                    return (
                      <td
                        key={col.id}
                        className={`${title === 'Exames' ? 'py-2 px-1' : 'p-2'} border-r border-slate-200 last:border-r-0 align-top text-left ${getColumnWidthClass(col.name)}`}
                      >
                        <div className={`${title === 'Exames' ? 'space-y-2' : 'space-y-1.5'}`}>
                          {/* Slot 0 */}
                          {editingCellKey === key0 ? (
                            <div className="p-2 bg-amber-50 rounded-xl border border-amber-300 shadow-sm space-y-1.5 animate-in fade-in duration-150">
                              <input
                                type="text"
                                value={editDoctorName}
                                onChange={(e) => setEditDoctorName(e.target.value)}
                                placeholder="NOME DO MÉDICO"
                                className="w-full bg-white border border-amber-300 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={editTimeRange}
                                onChange={(e) => setEditTimeRange(e.target.value)}
                                placeholder="08:00 - 12:00"
                                className="w-full bg-white border border-amber-300 rounded-lg px-1.5 py-1 text-[10px] text-slate-700 focus:outline-none"
                              />
                              {/* Color Selector */}
                              <div className="flex items-center justify-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditColor('orange')}
                                  className={`w-4 h-4 rounded-full bg-amber-300 border ${
                                    editColor === 'orange' ? 'ring-2 ring-amber-600' : ''
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditColor('blue')}
                                  className={`w-4 h-4 rounded-full bg-sky-300 border ${
                                    editColor === 'blue' ? 'ring-2 ring-sky-600' : ''
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditColor('gray')}
                                  className={`w-4 h-4 rounded-full bg-gray-300 border ${
                                    editColor === 'gray' ? 'ring-2 ring-gray-600' : ''
                                  }`}
                                />
                              </div>
                              <div className="flex items-center justify-center gap-3 pt-1 border-t border-amber-200">
                                <button
                                  onClick={() => handleSaveCell(key0)}
                                  className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
                                  title="Salvar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelCell}
                                  className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : slot0 ? (
                            <div
                              onClick={() => canEdit && handleStartEdit(key0, slot0)}
                              className={`${
                                title === 'Exames'
                                  ? 'py-2.5 px-1 rounded-lg min-h-[52px] flex flex-col justify-center'
                                  : 'py-1.5 px-2 rounded-xl min-h-[48px] h-[48px] flex flex-col justify-center'
                              } border text-center transition-all ${canEdit ? 'cursor-pointer' : 'cursor-default'} shadow-2xs group relative ${getSlotColorClasses(
                                slot0.color
                              )}`}
                            >
                              <div className={`font-semibold ${title === 'Exames' ? 'text-[10px] leading-snug break-words' : 'text-[11px] leading-tight truncate'} tracking-tight uppercase`}>
                                {slot0.doctorName}
                              </div>
                              <div className={`${title === 'Exames' ? 'text-[9px]' : 'text-[10px]'} font-medium opacity-90 mt-0.5 whitespace-nowrap`}>
                                {slot0.timeRange}
                              </div>
                            </div>
                          ) : (
                            <button
                              disabled={!canEdit}
                              onClick={() => canEdit && handleStartEdit(key0)}
                              className={`w-full ${
                                title === 'Exames'
                                  ? 'py-3 min-h-[52px] text-[10px] rounded-lg flex items-center justify-center'
                                  : 'min-h-[48px] h-[48px] text-xs rounded-xl flex items-center justify-center'
                              } border border-dashed border-slate-300 ${
                                canEdit ? 'hover:border-[#245688] text-slate-400 hover:text-[#245688] cursor-pointer' : 'text-slate-300 cursor-default'
                              } transition-colors`}
                            >
                              {canEdit ? '+ Vago' : 'Vago'}
                            </button>
                          )}

                          {/* Slot 1 */}
                          {editingCellKey === key1 ? (
                            <div className="p-2 bg-sky-50 rounded-xl border border-sky-300 shadow-sm space-y-1.5 animate-in fade-in duration-150">
                              <input
                                type="text"
                                value={editDoctorName}
                                onChange={(e) => setEditDoctorName(e.target.value)}
                                placeholder="NOME DO MÉDICO"
                                className="w-full bg-white border border-sky-300 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={editTimeRange}
                                onChange={(e) => setEditTimeRange(e.target.value)}
                                placeholder="14:00 - 18:00"
                                className="w-full bg-white border border-sky-300 rounded-lg px-1.5 py-1 text-[10px] text-slate-700 focus:outline-none"
                              />
                              <div className="flex items-center justify-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditColor('orange')}
                                  className={`w-4 h-4 rounded-full bg-amber-300 border ${
                                    editColor === 'orange' ? 'ring-2 ring-amber-600' : ''
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditColor('blue')}
                                  className={`w-4 h-4 rounded-full bg-sky-300 border ${
                                    editColor === 'blue' ? 'ring-2 ring-sky-600' : ''
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditColor('gray')}
                                  className={`w-4 h-4 rounded-full bg-gray-300 border ${
                                    editColor === 'gray' ? 'ring-2 ring-gray-600' : ''
                                  }`}
                                />
                              </div>
                              <div className="flex items-center justify-center gap-3 pt-1 border-t border-sky-200">
                                <button
                                  onClick={() => handleSaveCell(key1)}
                                  className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
                                  title="Salvar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelCell}
                                  className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : slot1 ? (
                            <div
                              onClick={() => canEdit && handleStartEdit(key1, slot1)}
                              className={`${
                                title === 'Exames'
                                  ? 'py-2.5 px-1 rounded-lg min-h-[52px] flex flex-col justify-center'
                                  : 'py-1.5 px-2 rounded-xl min-h-[48px] h-[48px] flex flex-col justify-center'
                              } border text-center transition-all ${canEdit ? 'cursor-pointer' : 'cursor-default'} shadow-2xs group relative ${getSlotColorClasses(
                                slot1.color
                              )}`}
                            >
                              <div className={`font-semibold ${title === 'Exames' ? 'text-[10px] leading-snug break-words' : 'text-[11px] leading-tight truncate'} tracking-tight uppercase`}>
                                {slot1.doctorName}
                              </div>
                              <div className={`${title === 'Exames' ? 'text-[9px]' : 'text-[10px]'} font-medium opacity-90 mt-0.5 whitespace-nowrap`}>
                                {slot1.timeRange}
                              </div>
                            </div>
                          ) : (
                            <button
                              disabled={!canEdit}
                              onClick={() => canEdit && handleStartEdit(key1)}
                              className={`w-full ${
                                title === 'Exames'
                                  ? 'py-3 min-h-[52px] text-[10px] rounded-lg flex items-center justify-center'
                                  : 'min-h-[48px] h-[48px] text-xs rounded-xl flex items-center justify-center'
                              } border border-dashed border-slate-300 ${
                                canEdit ? 'hover:border-[#245688] text-slate-400 hover:text-[#245688] cursor-pointer' : 'text-slate-300 cursor-default'
                              } transition-colors`}
                            >
                              {canEdit ? '+ Vago' : 'Vago'}
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Horizontal Scroll Navigation Helper */}
        {title !== 'Exames' && (
          <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <button
              onClick={() => scrollHorizontally(-350)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs font-medium cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
              <span>Rolar para esquerda</span>
            </button>
            <span className="font-medium text-slate-700 hidden sm:inline">
              Navegação horizontal ({columns.length} colunas disponíveis)
            </span>
            <button
              onClick={() => scrollHorizontally(350)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs font-medium cursor-pointer"
            >
              <span>Rolar para direita</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            </button>
          </div>
        )}
      </div>

      {/* Add Column Modal */}
      {isAddColumnOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0A2B4E] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wide">Incluir Nova Coluna</h3>
              <button
                onClick={() => setIsAddColumnOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddColumn} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Profissional / Coluna
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Ex: GABRIELA"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 uppercase focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                />
              </div>
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 -mx-5 -mb-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddColumnOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-[#0F3763] hover:bg-[#0C2A4C] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir Coluna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Column Modal */}
      {isRenameColumnOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0A2B4E] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wide">Editar Nome da Coluna</h3>
              <button
                onClick={() => setIsRenameColumnOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmRename} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Selecione a Coluna
                </label>
                <select
                  value={selectedColumnToRename}
                  onChange={(e) => handleSelectColumnToRename(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Novo Nome
                </label>
                <input
                  type="text"
                  required
                  value={renameInputName}
                  onChange={(e) => setRenameInputName(e.target.value)}
                  placeholder="Nome do profissional"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 uppercase focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                />
              </div>
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 -mx-5 -mb-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRenameColumnOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-[#0F3763] hover:bg-[#0C2A4C] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alteração</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Column Modal */}
      {isDeleteColumnOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wide">Excluir Coluna</h3>
              <button
                onClick={() => setIsDeleteColumnOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Selecione a Coluna para Remover
                </label>
                <select
                  value={selectedColumnToDelete}
                  onChange={(e) => setSelectedColumnToDelete(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 -mx-5 -mb-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteColumnOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteColumn}
                  disabled={!selectedColumnToDelete}
                  className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
