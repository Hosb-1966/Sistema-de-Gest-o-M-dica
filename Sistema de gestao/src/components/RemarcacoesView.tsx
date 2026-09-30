import React, { useState, useMemo } from 'react';
import { RemarcaoItem, RemarcaoFilter } from '../types';
import { Calendar, Plus, Download, Edit3, Trash2, Filter, RotateCcw, CheckCircle2, X } from 'lucide-react';
import { saveRemarcacoes, deleteRemarcacaoFromSupabase } from '../lib/supabaseService';

interface RemarcacoesViewProps {
  items: RemarcaoItem[];
  setItems: React.Dispatch<React.SetStateAction<RemarcaoItem[]>>;
  canEdit?: boolean;
}

const parseDate = (dStr: string): Date | null => {
  if (!dStr) return null;
  const clean = dStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('/').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  const timestamp = Date.parse(clean);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
};

export const RemarcacoesView: React.FC<RemarcacoesViewProps> = ({ items, setItems, canEdit = true }) => {
  // Filter state
  const [filter, setFilter] = useState<RemarcaoFilter>({
    medico: '',
    dataInicio: '',
    dataFim: '',
    contato: 'Todos',
    prazo: 'Todos',
  });

  const [activeFilter, setActiveFilter] = useState<RemarcaoFilter>({
    medico: '',
    dataInicio: '',
    dataFim: '',
    contato: 'Todos',
    prazo: 'Todos',
  });

  // Modal / Toast state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RemarcaoItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<RemarcaoItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<RemarcaoItem, 'id'>>({
    medico: '',
    dataRemarcacao: '',
    dias: 1,
    qtPacientes: 10,
    horaCall: '01:00',
    contato: 'Whatsapp',
    data: '',
    prazo: 'Dentro',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilter(filter);
  };

  const handleClearFilter = () => {
    const emptyFilter: RemarcaoFilter = {
      medico: '',
      dataInicio: '',
      dataFim: '',
      contato: 'Todos',
      prazo: 'Todos',
    };
    setFilter(emptyFilter);
    setActiveFilter(emptyFilter);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        activeFilter.medico &&
        !item.medico.toLowerCase().includes(activeFilter.medico.toLowerCase())
      ) {
        return false;
      }

      const itemDate = parseDate(item.dataRemarcacao) || parseDate(item.data);

      if (activeFilter.dataInicio) {
        const startDate = parseDate(activeFilter.dataInicio);
        if (startDate && itemDate && itemDate < startDate) {
          return false;
        }
      }

      if (activeFilter.dataFim) {
        const endDate = parseDate(activeFilter.dataFim);
        if (endDate && itemDate && itemDate > endDate) {
          return false;
        }
      }

      if (activeFilter.contato !== 'Todos' && item.contato !== activeFilter.contato) {
        return false;
      }
      if (activeFilter.prazo !== 'Todos' && item.prazo !== activeFilter.prazo) {
        return false;
      }
      return true;
    });
  }, [items, activeFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    const today = new Date().toLocaleDateString('pt-BR');
    setFormData({
      medico: '',
      dataRemarcacao: today,
      dias: 2,
      qtPacientes: 10,
      horaCall: '01:00',
      contato: 'Whatsapp',
      data: today,
      prazo: 'Dentro',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: RemarcaoItem) => {
    setEditingItem(item);
    setFormData({
      medico: item.medico,
      dataRemarcacao: item.dataRemarcacao,
      dias: item.dias,
      qtPacientes: item.qtPacientes,
      horaCall: item.horaCall,
      contato: item.contato,
      data: item.data,
      prazo: item.prazo,
    });
    setIsModalOpen(true);
  };

  const handleRequestDelete = (item: RemarcaoItem) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const idToDelete = deletingItem.id;
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== idToDelete);
      saveRemarcacoes(next);
      return next;
    });
    await deleteRemarcacaoFromSupabase(idToDelete);
    setDeletingItem(null);
    showToast('Linha removida com sucesso!');
  };

  const handleDelete = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      setDeletingItem(item);
    } else {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        saveRemarcacoes(next);
        return next;
      });
      deleteRemarcacaoFromSupabase(id);
      showToast('Linha removida com sucesso!');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setItems((prev) => {
        const next = prev.map((item) => (item.id === editingItem.id ? { ...editingItem, ...formData } : item));
        saveRemarcacoes(next);
        return next;
      });
      showToast('Linha atualizada com sucesso!');
    } else {
      const newItem: RemarcaoItem = {
        id: String(Date.now()),
        ...formData,
      };
      setItems((prev) => {
        const next = [...prev, newItem];
        saveRemarcacoes(next);
        return next;
      });
      showToast('Nova linha de remarcação adicionada!');
    }
    setIsModalOpen(false);
  };

  const handleSaveAll = async () => {
    try {
      await saveRemarcacoes(items);
      showToast('Alterações salvas no banco de dados com sucesso!');
    } catch {
      showToast('Erro ao salvar no banco de dados.');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main card container using color palette */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Lighter Blue Header Banner */}
        <div className="bg-[#0F2942] px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-sky-300" />
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">Remarcações</h2>
          </div>
          <div className="flex items-center gap-2.5">
            {canEdit ? (
              <>
                <button
                  onClick={openAddModal}
                  className="bg-[#0F3763] hover:bg-[#0C2A4C] active:bg-[#09203B] text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Linha</span>
                </button>
                <button
                  onClick={handleSaveAll}
                  className="bg-[#2366F6] hover:bg-[#1D53C9] active:bg-[#1848B2] text-white font-medium text-xs px-4 py-2 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </>
            ) : (
              <span className="text-xs bg-white/10 text-sky-200 px-3 py-1.5 rounded-lg border border-white/20">
                Visualização (Edição restrita ao Administrador)
              </span>
            )}
          </div>
        </div>

        {/* Filters bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Médico</label>
              <input
                type="text"
                value={filter.medico}
                onChange={(e) => setFilter({ ...filter, medico: e.target.value })}
                placeholder="Nome do médico"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filter.dataInicio}
                onChange={(e) => setFilter({ ...filter, dataInicio: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filter.dataFim}
                onChange={(e) => setFilter({ ...filter, dataFim: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contato</label>
              <select
                value={filter.contato}
                onChange={(e) => setFilter({ ...filter, contato: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6]"
              >
                <option value="Todos">Todos</option>
                <option value="Email">Email</option>
                <option value="Whatsapp">Whatsapp</option>
                <option value="Ligação">Ligação</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Prazo</label>
              <select
                value={filter.prazo}
                onChange={(e) => setFilter({ ...filter, prazo: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6]"
              >
                <option value="Todos">Todos</option>
                <option value="Dentro">Dentro</option>
                <option value="Fora">Fora</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-[#0F3763] hover:bg-[#0C2A4C] text-white font-medium text-xs py-2 px-3.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar</span>
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={handleClearFilter}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-2 px-3.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            </div>
          </form>
        </div>

        {/* Data Table with Operacional Grade and Font Standard */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center min-w-[900px]">
            <thead>
              <tr className="bg-[#0A2B4E] text-white text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 border-r border-[#1C426E] text-center">MÉDICO</th>
                <th className="py-3 px-3.5 border-r border-[#1C426E] text-center">DATA REMARCAÇÃO</th>
                <th className="py-3 px-3 border-r border-[#1C426E] text-center">DIAS</th>
                <th className="py-3 px-3 border-r border-[#1C426E] text-center">QT PACIENTES</th>
                <th className="py-3 px-3 border-r border-[#1C426E] text-center">HORA CALL</th>
                <th className="py-3 px-3.5 border-r border-[#1C426E] text-center">CONTATO</th>
                <th className="py-3 px-3.5 border-r border-[#1C426E] text-center">DATA</th>
                <th className="py-3 px-3.5 border-r border-[#1C426E] text-center">PRAZO</th>
                <th className="py-3 px-3.5 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 font-medium text-xs">
                    Nenhum registro de remarcação encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 border-r border-slate-200 text-center font-semibold text-xs text-slate-900">
                      {item.medico}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 text-center font-medium text-xs text-slate-800">
                      {item.dataRemarcacao}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-medium text-xs text-slate-800">
                      {item.dias}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-medium text-xs text-slate-800">
                      {item.qtPacientes}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-medium text-xs text-slate-800">
                      {item.horaCall}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 text-center font-medium text-xs text-slate-800">
                      {item.contato}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 text-center font-medium text-xs text-slate-800">
                      {item.data}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-200 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[76px] px-3 py-1 rounded-md text-xs font-semibold shadow-2xs ${
                          item.prazo === 'Dentro'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {item.prazo}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {canEdit ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Editar"
                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRequestDelete(item)}
                            title="Excluir"
                            className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Visualização</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL (Matches Operacional Pattern) */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-xs font-normal uppercase tracking-wide">
                Confirmar Exclusão
              </h3>
              <button
                onClick={() => setDeletingItem(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 font-normal">
                Deseja realmente remover o registro de remarcação de{' '}
                <strong className="font-semibold text-slate-900">
                  {deletingItem.medico || 'Médico'}
                </strong>{' '}
                ({deletingItem.dataRemarcacao})?
              </p>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-normal text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-normal text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0A2B4E] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-normal text-xs uppercase tracking-wide">
                {editingItem ? 'Editar Remarcação' : 'Adicionar Linha de Remarcação'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">Médico</label>
                  <input
                    type="text"
                    required
                    value={formData.medico}
                    onChange={(e) => setFormData({ ...formData, medico: e.target.value })}
                    placeholder="Nome do Médico"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">
                    Data Remarcação
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dataRemarcacao}
                    onChange={(e) => setFormData({ ...formData, dataRemarcacao: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">Dias</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.dias}
                    onChange={(e) => setFormData({ ...formData, dias: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">
                    Qt Pacientes
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.qtPacientes}
                    onChange={(e) =>
                      setFormData({ ...formData, qtPacientes: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">Hora Call</label>
                  <input
                    type="text"
                    required
                    value={formData.horaCall}
                    onChange={(e) => setFormData({ ...formData, horaCall: e.target.value })}
                    placeholder="00:30"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">Contato</label>
                  <select
                    value={formData.contato}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contato: e.target.value as 'Email' | 'Whatsapp' | 'Ligação',
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                  >
                    <option value="Email">Email</option>
                    <option value="Whatsapp">Whatsapp</option>
                    <option value="Ligação">Ligação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">Data</label>
                  <input
                    type="text"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">Prazo</label>
                  <select
                    value={formData.prazo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prazo: e.target.value as 'Dentro' | 'Fora',
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#2366F6] focus:border-[#2366F6] focus:outline-none"
                  >
                    <option value="Dentro">Dentro</option>
                    <option value="Fora">Fora</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 -mx-5 -mb-5 mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-normal text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-normal text-white bg-[#0F3763] hover:bg-[#0C2A4C] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  {editingItem ? 'Salvar Alterações' : 'Adicionar Linha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
