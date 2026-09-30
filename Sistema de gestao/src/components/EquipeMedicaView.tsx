import React, { useState } from 'react';
import { DoctorTeamItem } from '../types';
import {
  Plus,
  Save,
  Pencil,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  Camera,
  User,
  Image as ImageIcon,
} from 'lucide-react';

interface EquipeMedicaViewProps {
  doctors: DoctorTeamItem[];
  setDoctors: React.Dispatch<React.SetStateAction<DoctorTeamItem[]>>;
  onSaveToSupabase?: () => void;
  canEdit?: boolean;
}

export const EquipeMedicaView: React.FC<EquipeMedicaViewProps> = ({
  doctors,
  setDoctors,
  onSaveToSupabase,
  canEdit = true,
}) => {
  // Toast feedback state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorTeamItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    specialty: string;
    crm: string;
    rqe: string;
    celular: string;
    fazExames: boolean;
    photoUrl: string;
  }>({
    id: '',
    name: '',
    specialty: '',
    crm: '',
    rqe: '',
    celular: '',
    fazExames: true,
    photoUrl: '',
  });

  // Delete modal state
  const [deletingDoctor, setDeletingDoctor] = useState<DoctorTeamItem | null>(null);

  // Trigger Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingDoctor(null);
    setFormData({
      id: `doc_team_${Date.now()}`,
      name: 'Novo(a) Médico(a)',
      specialty: 'Especialidade',
      crm: '000000',
      rqe: '',
      celular: '',
      fazExames: true,
      photoUrl: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (doc: DoctorTeamItem) => {
    setEditingDoctor(doc);
    setFormData({
      id: doc.id,
      name: doc.name,
      specialty: doc.specialty,
      crm: doc.crm,
      rqe: doc.rqe || '',
      celular: doc.celular || '',
      fazExames: doc.fazExames,
      photoUrl: doc.photoUrl || '',
    });
    setIsModalOpen(true);
  };

  // Handle File Upload for Doctor Photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Form (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newDoc: DoctorTeamItem = {
      id: formData.id || `doc_team_${Date.now()}`,
      name: formData.name.trim().toUpperCase(),
      specialty: formData.specialty.trim() || 'Geral',
      crm: formData.crm.trim(),
      rqe: formData.rqe.trim(),
      celular: formData.celular.trim(),
      fazExames: formData.fazExames,
      photoUrl: formData.photoUrl.trim(),
    };

    if (editingDoctor) {
      setDoctors((prev) => prev.map((d) => (d.id === editingDoctor.id ? newDoc : d)));
      triggerToast('Médico atualizado com sucesso!');
    } else {
      setDoctors((prev) => [...prev, newDoc]);
      triggerToast('Novo médico adicionado!');
    }

    setIsModalOpen(false);
    if (onSaveToSupabase) onSaveToSupabase();
  };

  // Toggle "Faz exames" directly from card
  const handleToggleExames = (id: string, currentVal: boolean) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, fazExames: !currentVal } : d))
    );
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingDoctor) return;
    setDoctors((prev) => prev.filter((d) => d.id !== deletingDoctor.id));
    setDeletingDoctor(null);
    triggerToast('Médico removido da equipe.');
    if (onSaveToSupabase) onSaveToSupabase();
  };

  // Save changes button action
  const handleSaveAll = () => {
    if (onSaveToSupabase) {
      onSaveToSupabase();
    }
    triggerToast('Alterações salvas no Supabase!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-normal">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#0F2942] tracking-tight">
            Nossa Equipe Médica
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Conheça os especialistas dedicados ao cuidado de nossos pacientes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {canEdit ? (
            <>
              <button
                onClick={handleSaveAll}
                className="bg-[#2366F6] hover:bg-[#1C54CB] text-white text-xs font-normal px-3.5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="bg-[#0F2942] hover:bg-[#0A1D30] text-white text-xs font-normal px-3.5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Médico</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Modo Visualização (Alterações restritas ao Administrador)
            </span>
          )}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
          >
            {/* Quick Action Overlay (Edit & Delete) */}
            {canEdit && (
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onClick={() => handleOpenEditModal(doctor)}
                  title="Editar Médico"
                  className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingDoctor(doctor)}
                  title="Remover Médico"
                  className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Top Card Section: Circular Photo + Name + Specialty */}
            <div className="p-4 sm:p-5 text-center flex flex-col items-center flex-1">
              {/* Circular Photo Frame with Thick Navy Ring */}
              <div
                onClick={() => handleOpenEditModal(doctor)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[3px] border-[#0F2942] flex items-center justify-center bg-white relative overflow-hidden shadow-xs cursor-pointer group/circle transition-transform hover:scale-105 flex-shrink-0"
                title="Clique para alterar foto ou dados"
              >
                {doctor.photoUrl ? (
                  <img
                    src={doctor.photoUrl}
                    alt={doctor.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full border border-[#0F2942]/20 flex flex-col items-center justify-center p-2 text-center bg-slate-50">
                    <span className="text-[10px] font-semibold text-[#0F2942] uppercase tracking-wider leading-tight">
                      Foto de
                    </span>
                    <span className="text-[9px] font-semibold text-[#0F2942] uppercase leading-tight line-clamp-2 px-1 mt-0.5">
                      {doctor.name}
                    </span>
                  </div>
                )}

                {/* Hover overlay on photo */}
                <div className="absolute inset-0 bg-[#0F2942]/60 flex items-center justify-center opacity-0 group-hover/circle:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Doctor Name */}
              <h3 className="font-bold text-xs sm:text-sm text-[#0F2942] uppercase tracking-tight text-center mt-3 leading-snug line-clamp-2">
                {doctor.name}
              </h3>

              {/* Specialty */}
              <p className="text-xs text-slate-500 font-normal text-center mt-0.5">
                {doctor.specialty}
              </p>
            </div>

            {/* Bottom Card Section: CRM, RQE, Celular, Faz Exames */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-3 space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-[11px] uppercase">
                  CRM: <span className="font-normal text-slate-600">{doctor.crm || '000000'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-[11px] uppercase">
                  RQE: <span className="font-normal text-slate-600">{doctor.rqe || '—'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-[11px]">
                  Celular: <span className="font-normal text-slate-600">{doctor.celular || '—'}</span>
                </span>
              </div>

              {/* Faz exames toggle */}
              <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <span className="font-normal text-slate-600 text-[11px]">Faz exames:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleExames(doctor.id, doctor.fazExames)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      doctor.fazExames
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleExames(doctor.id, doctor.fazExames)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      !doctor.fazExames
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD / EDIT DOCTOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-normal tracking-wide">
                {editingDoctor ? 'Editar Médico' : 'Adicionar Novo Médico'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Photo Preview & Upload */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="text-xs font-medium text-slate-700">Foto do Médico:</label>
                
                {/* Circular Photo Ring Preview */}
                <div className="w-28 h-28 rounded-full border-[4px] border-[#0F2942] flex items-center justify-center bg-white relative overflow-hidden shadow-inner">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex flex-col items-center justify-center p-2 text-center bg-slate-100 text-slate-500">
                      <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] uppercase font-semibold text-[#0F2942]">
                        Foto de
                      </span>
                      <span className="text-[9px] uppercase text-slate-600 truncate max-w-[80px]">
                        {formData.name || 'Médico'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload or URL Inputs */}
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-700 text-xs font-normal px-3 py-1.5 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload de Imagem</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem (http/https)..."
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="w-full text-xs text-slate-800 bg-white rounded-lg p-2 border border-slate-300 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo (com título, ex: DRA. ALICE GOMES DE ALMEIDA):
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: DRA. ALICE GOMES DE ALMEIDA"
                  className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-lg p-2.5 border border-slate-300 focus:border-blue-500 focus:outline-none uppercase font-semibold"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Especialidade:
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Oftalmologia Geral, Catarata, Retina, Glaucoma"
                  className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-lg p-2.5 border border-slate-300 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* CRM & RQE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CRM:</label>
                  <input
                    type="text"
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    placeholder="Ex: 521129929"
                    className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-lg p-2.5 border border-slate-300 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">RQE:</label>
                  <input
                    type="text"
                    value={formData.rqe}
                    onChange={(e) => setFormData({ ...formData, rqe: e.target.value })}
                    placeholder="Ex: 34567"
                    className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-lg p-2.5 border border-slate-300 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Celular / Contato */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Celular / Contato:
                </label>
                <input
                  type="text"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  placeholder="Ex: (21) 99999-1234"
                  className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-lg p-2.5 border border-slate-300 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Faz Exames Toggle */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Faz exames?
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fazExames: true })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      formData.fazExames
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fazExames: false })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !formData.fazExames
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-normal text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-normal text-white bg-[#2366F6] hover:bg-[#1C54CB] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Médico</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-xs font-normal uppercase tracking-wide">
                Excluir Médico
              </h3>
              <button
                onClick={() => setDeletingDoctor(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 font-normal">
                Deseja realmente remover <strong className="font-semibold text-slate-900">{deletingDoctor.name}</strong> da equipe médica?
              </p>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingDoctor(null)}
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
    </div>
  );
};
