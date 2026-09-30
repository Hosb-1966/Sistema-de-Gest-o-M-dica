import React, { useState, useMemo, useRef } from 'react';
import { IntranetCategory, IntranetArticle, IntranetBlock, IntranetBlockType } from '../types';
import { deleteIntranetArticle, saveIntranetCategories } from '../lib/supabaseService';
import {
  Search,
  Calendar,
  FileText,
  BookOpen,
  HelpCircle,
  Folder,
  FolderPlus,
  Shield,
  Stethoscope,
  Heart,
  Briefcase,
  Tag,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Upload,
  Palette,
  Type,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Eye,
  Save,
  RotateCcw,
  ZoomIn,
  Link as LinkIcon,
} from 'lucide-react';

interface IntranetViewProps {
  categories: IntranetCategory[];
  setCategories?: React.Dispatch<React.SetStateAction<IntranetCategory[]>>;
  articles: IntranetArticle[];
  setArticles: React.Dispatch<React.SetStateAction<IntranetArticle[]>>;
  canEdit?: boolean;
}

const AVAILABLE_CATEGORY_ICONS = [
  { name: 'Folder', label: 'Pasta Geral', icon: Folder },
  { name: 'BookOpen', label: 'Manual / Livro', icon: BookOpen },
  { name: 'FileText', label: 'Documento / Guia', icon: FileText },
  { name: 'Calendar', label: 'Agendas / Prazos', icon: Calendar },
  { name: 'HelpCircle', label: 'Dúvidas / FAQ', icon: HelpCircle },
  { name: 'Shield', label: 'Regras / Validações', icon: Shield },
  { name: 'Stethoscope', label: 'Clínico / Médico', icon: Stethoscope },
  { name: 'Heart', label: 'Cardio / Especialidades', icon: Heart },
  { name: 'Briefcase', label: 'Administrativo', icon: Briefcase },
  { name: 'Tag', label: 'Convênios / Preços', icon: Tag },
  { name: 'Bookmark', label: 'Destaques / Favoritos', icon: Bookmark },
  { name: 'Layers', label: 'Processos / Etapas', icon: Layers },
];

// Preset color palettes
const FONT_COLORS = [
  { name: 'Padrão / Escuro', color: '#0f172a' },
  { name: 'Azul Corporativo', color: '#0f3763' },
  { name: 'Azul Destaque', color: '#2563eb' },
  { name: 'Vermelho Alerta', color: '#dc2626' },
  { name: 'Verde Sucesso', color: '#16a34a' },
  { name: 'Laranja Atenção', color: '#ea580c' },
  { name: 'Roxo Destaque', color: '#9333ea' },
  { name: 'Cinza Médio', color: '#64748b' },
];

const BG_COLORS = [
  { name: 'Branco', color: '#ffffff', border: '#e2e8f0' },
  { name: 'Cinza Suave', color: '#f8fafc', border: '#e2e8f0' },
  { name: 'Azul Informativo (Instruções gerais)', color: '#f4f9ff', border: '#dbeafe' },
  { name: 'Amarelo Atenção', color: '#fefce8', border: '#fef08a' },
  { name: 'Verde Sucesso', color: '#f0fdf4', border: '#bbf7d0' },
  { name: 'Vermelho Regra', color: '#fef2f2', border: '#fecaca' },
  { name: 'Laranja Alerta', color: '#fff7ed', border: '#fed7aa' },
];

const FONT_SIZES = [
  { label: 'Pequeno (12px)', value: '12px' },
  { label: 'Padrão (14px)', value: '14px' },
  { label: 'Destaque (16px)', value: '16px' },
  { label: 'Subtítulo (18px)', value: '18px' },
  { label: 'Título de Bloco (22px)', value: '22px' },
  { label: 'Título Grande (26px)', value: '26px' },
];

// Helper to convert existing article content/steps into structured blocks if empty
const ensureArticleBlocks = (art: IntranetArticle): IntranetBlock[] => {
  if (art.blocks && art.blocks.length > 0) {
    return art.blocks;
  }
  const initialBlocks: IntranetBlock[] = [];

  if (art.content && art.content.trim()) {
    initialBlocks.push({
      id: `blk_intro_${art.id}`,
      type: 'text',
      title: 'Visão Geral do Procedimento',
      content: art.content,
      fontSize: '14px',
      textColor: '#0f172a',
      bgColor: '#ffffff',
      textAlign: 'left',
    });
  }

  if (art.steps && art.steps.length > 0) {
    initialBlocks.push({
      id: `blk_steps_${art.id}`,
      type: 'steps',
      title: 'Passo a Passo de Atendimento',
      steps: [...art.steps],
      fontSize: '14px',
      textColor: '#0f172a',
      bgColor: '#f8fafc',
      textAlign: 'left',
    });
  }

  if (initialBlocks.length === 0) {
    initialBlocks.push({
      id: `blk_init_${Date.now()}`,
      type: 'text',
      title: 'Instruções de Atendimento',
      content: 'Descreva aqui as instruções detalhadas deste procedimento de atendimento.',
      fontSize: '14px',
      textColor: '#0f172a',
      bgColor: '#ffffff',
      textAlign: 'left',
    });
  }

  return initialBlocks;
};

export const IntranetView: React.FC<IntranetViewProps> = ({
  categories,
  setCategories,
  articles,
  setArticles,
  canEdit = true,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('agendamentos');
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('art1');
  const [searchQuery, setSearchQuery] = useState('');

  // Subcategory collapse state
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    procedimentos: true,
    glossario: true,
  });

  // Category creation modal state
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Folder');
  const [newCatSubCategories, setNewCatSubCategories] = useState('');

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftBlocks, setDraftBlocks] = useState<IntranetBlock[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Modal for creating a new article
  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('agendamentos');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newInitialContent, setNewInitialContent] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Image Lightbox / Zoom modal
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomImageCaption, setZoomImageCaption] = useState<string | null>(null);

  // Hidden file input ref for local image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageBlockId, setPendingImageBlockId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar':
        return <Calendar className="w-4 h-4" />;
      case 'FileText':
        return <FileText className="w-4 h-4" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      case 'Folder':
      case 'FolderPlus':
        return <Folder className="w-4 h-4" />;
      case 'Shield':
        return <Shield className="w-4 h-4" />;
      case 'Stethoscope':
        return <Stethoscope className="w-4 h-4" />;
      case 'Heart':
        return <Heart className="w-4 h-4" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'Tag':
        return <Tag className="w-4 h-4" />;
      case 'Bookmark':
        return <Bookmark className="w-4 h-4" />;
      case 'Layers':
        return <Layers className="w-4 h-4" />;
      case 'HelpCircle':
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const trimmedName = newCatName.trim();
    const cleanId = `cat_${Date.now()}`;
    const subCategoriesList = newCatSubCategories
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newCategoryItem: IntranetCategory = {
      id: cleanId,
      name: trimmedName,
      icon: newCatIcon,
      hasSubCategories: subCategoriesList.length > 0,
      subCategories: subCategoriesList.length > 0 ? subCategoriesList : undefined,
    };

    if (setCategories) {
      setCategories((prev) => [...prev, newCategoryItem]);
    }
    saveIntranetCategories([...categories, newCategoryItem]);

    setSelectedCatId(cleanId);
    setSelectedSubCat(null);
    setIsNewCategoryModalOpen(false);
    setNewCatName('');
    setNewCatIcon('Folder');
    setNewCatSubCategories('');
    showToast(`Categoria "${trimmedName}" cadastrada com sucesso!`);
  };

  const toggleCatExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Filter articles based on Category, Subcategory or Search Query
  const categoryArticles = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return articles.filter((a) => {
        const titleMatch = a.title.toLowerCase().includes(query);
        const contentMatch = a.content?.toLowerCase().includes(query);
        const stepsMatch = a.steps?.some((s) => s.toLowerCase().includes(query));
        const blocksMatch = a.blocks?.some((b) =>
          (b.title && b.title.toLowerCase().includes(query)) ||
          (b.content && b.content.toLowerCase().includes(query)) ||
          (b.steps && b.steps.some((s) => s.toLowerCase().includes(query)))
        );
        return titleMatch || contentMatch || stepsMatch || blocksMatch;
      });
    }

    return articles.filter((a) => {
      if (a.categoryId !== selectedCatId) return false;
      if (selectedSubCat && a.subCategory !== selectedSubCat) return false;
      return true;
    });
  }, [articles, selectedCatId, selectedSubCat, searchQuery]);

  // Active selected article object
  const activeArticle = useMemo(() => {
    const found = articles.find((a) => a.id === selectedArticleId);
    if (found) return found;
    return categoryArticles[0] || null;
  }, [articles, selectedArticleId, categoryArticles]);

  // When opening edit mode or changing active article in edit mode
  const handleStartEdit = () => {
    if (!activeArticle) return;
    setDraftTitle(activeArticle.title);
    const blks = ensureArticleBlocks(activeArticle);
    setDraftBlocks(JSON.parse(JSON.stringify(blks)));
    setActiveBlockId(blks[0]?.id || null);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setActiveBlockId(null);
  };

  const handleSaveEdit = () => {
    if (!activeArticle) return;
    if (!draftTitle.trim()) {
      showToast('O título do procedimento não pode ficar vazio.');
      return;
    }

    // Extract quick content and steps from blocks for backwards compatibility
    const firstTextBlock = draftBlocks.find((b) => b.type === 'text' || b.type === 'script');
    const firstStepsBlock = draftBlocks.find((b) => b.type === 'steps');

    const updatedArticle: IntranetArticle = {
      ...activeArticle,
      title: draftTitle,
      content: firstTextBlock?.content || activeArticle.content,
      steps: firstStepsBlock?.steps || activeArticle.steps,
      blocks: draftBlocks,
      updatedAt: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setArticles((prev) =>
      prev.map((a) => (a.id === updatedArticle.id ? updatedArticle : a))
    );
    setIsEditMode(false);
    setActiveBlockId(null);
    showToast('Procedimento salvo com sucesso no banco de dados!');
  };

  // Block management functions
  const handleUpdateBlock = (blockId: string, updates: Partial<IntranetBlock>) => {
    setDraftBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );
  };

  const handleAddBlock = (type: IntranetBlockType, targetIndex?: number) => {
    const newBlockId = `blk_${Date.now()}`;
    let newBlock: IntranetBlock;

    switch (type) {
      case 'callout':
        newBlock = {
          id: newBlockId,
          type: 'callout',
          title: 'Atenção / Ponto Crítico',
          content: 'Importante: certifique-se de validar as exigências antes de prosseguir.',
          calloutVariant: 'warning',
          fontSize: '14px',
          textColor: '#854d0e',
          bgColor: '#fefce8',
          borderColor: '#facc15',
          textAlign: 'left',
          isBold: false,
        };
        break;
      case 'steps':
        newBlock = {
          id: newBlockId,
          type: 'steps',
          title: 'Etapas do Procedimento',
          steps: [
            'Passo 1: Identificar a solicitação do paciente.',
            'Passo 2: Acessar a tela correspondente no sistema.',
            'Passo 3: Finalizar e confirmar dados com o paciente.',
          ],
          fontSize: '14px',
          textColor: '#0f172a',
          bgColor: '#f8fafc',
          textAlign: 'left',
        };
        break;
      case 'image':
        newBlock = {
          id: newBlockId,
          type: 'image',
          title: 'Fluxograma / Imagem de Apoio',
          imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
          imageCaption: 'Exemplo de tela ou fluxo de atendimento',
          imageWidth: 'medium',
          fontSize: '12px',
          textColor: '#64748b',
          bgColor: '#ffffff',
          textAlign: 'center',
        };
        break;
      case 'script':
        newBlock = {
          id: newBlockId,
          type: 'script',
          title: 'Script de Atendimento Padronizado',
          content: '"Olá, bom dia! Meu nome é [Seu Nome], como posso ajudar na sua consulta de hoje?"',
          fontSize: '14px',
          textColor: '#0f3763',
          bgColor: '#f4f9ff',
          borderColor: '#dbeafe',
          textAlign: 'left',
          isItalic: true,
        };
        break;
      case 'text':
      default:
        newBlock = {
          id: newBlockId,
          type: 'text',
          title: 'Instruções e Observações',
          content: 'Digite aqui os procedimentos, regras ou detalhes desta etapa de atendimento.',
          fontSize: '14px',
          textColor: '#0f172a',
          bgColor: '#ffffff',
          textAlign: 'left',
        };
        break;
    }

    setDraftBlocks((prev) => {
      const list = [...prev];
      if (typeof targetIndex === 'number' && targetIndex >= 0) {
        list.splice(targetIndex + 1, 0, newBlock);
      } else {
        list.push(newBlock);
      }
      return list;
    });
    setActiveBlockId(newBlockId);
    showToast(`Novo bloco de ${type.toUpperCase()} adicionado.`);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    setDraftBlocks((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleDuplicateBlock = (block: IntranetBlock, index: number) => {
    const duplicated: IntranetBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: `blk_${Date.now()}`,
      title: block.title ? `${block.title} (Cópia)` : undefined,
    };
    setDraftBlocks((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
    setActiveBlockId(duplicated.id);
    showToast('Bloco duplicado.');
  };

  const handleDeleteBlock = (blockId: string) => {
    if (draftBlocks.length <= 1) {
      showToast('O procedimento precisa manter pelo menos um bloco.');
      return;
    }
    setDraftBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (activeBlockId === blockId) {
      setActiveBlockId(null);
    }
    showToast('Bloco removido.');
  };

  // Image upload handling
  const triggerImageUpload = (blockId: string) => {
    setPendingImageBlockId(blockId);
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingImageBlockId) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      handleUpdateBlock(pendingImageBlockId, { imageUrl: base64Url });
      showToast('Imagem carregada com sucesso no bloco!');
      setPendingImageBlockId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Copy full article or script
  const handleCopyText = (text: string, label = 'Procedimento') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado para a área de transferência!`);
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este procedimento da intranet?')) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      deleteIntranetArticle(id);
      if (selectedArticleId === id) {
        const remaining = articles.filter((a) => a.id !== id);
        if (remaining.length > 0) {
          setSelectedArticleId(remaining[0].id);
        }
      }
      showToast('Procedimento excluído com sucesso.');
    }
  };

  const handleCreateNewArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newArtId = `art_${Date.now()}`;
    const initialBlocks: IntranetBlock[] = [
      {
        id: `blk_${Date.now()}_1`,
        type: 'text',
        title: 'Visão Geral',
        content: newInitialContent || 'Descreva as instruções principais deste procedimento de atendimento.',
        fontSize: '14px',
        textColor: '#0f172a',
        bgColor: '#ffffff',
        textAlign: 'left',
      },
      {
        id: `blk_${Date.now()}_2`,
        type: 'steps',
        title: 'Passo a Passo de Atendimento',
        steps: [
          'Passo 1: Recepcionar o contato e identificar a demanda.',
          'Passo 2: Realizar a checagem no sistema.',
          'Passo 3: Finalizar orientando o paciente.',
        ],
        fontSize: '14px',
        textColor: '#0f172a',
        bgColor: '#f8fafc',
        textAlign: 'left',
      },
    ];

    const newArt: IntranetArticle = {
      id: newArtId,
      categoryId: newCategory,
      subCategory: newSubCategory.trim() ? newSubCategory.trim() : undefined,
      title: newTitle.trim(),
      content: newInitialContent.trim() || 'Procedimento cadastrado na intranet.',
      steps: initialBlocks[1].steps,
      blocks: initialBlocks,
      updatedAt: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setArticles((prev) => [...prev, newArt]);
    setSelectedCatId(newCategory);
    setSelectedSubCat(newSubCategory.trim() ? newSubCategory.trim() : null);
    setSelectedArticleId(newArt.id);
    setIsNewArticleModalOpen(false);
    setNewTitle('');
    setNewInitialContent('');
    setNewSubCategory('');
    showToast('Novo procedimento criado com sucesso!');
  };

  // Read-only blocks to render when viewing
  const viewBlocks = useMemo(() => {
    if (!activeArticle) return [];
    return ensureArticleBlocks(activeArticle);
  }, [activeArticle]);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-[#0F3763] text-white px-4 py-3 rounded-xl shadow-2xl animate-fade-in border border-sky-400/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Banner: Central de Procedimentos */}
      <div className="bg-gradient-to-r from-[#20558A] via-[#2D6CA8] to-[#3D82C4] text-white p-6 rounded-2xl shadow-sm border border-[#3D82C4]/50">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-100 text-xs font-medium backdrop-blur-xs border border-white/20">
            <BookOpen className="w-3.5 h-3.5 text-sky-200" />
            <span>Base Oficial de Procedimentos & Atendimento</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Central do Conhecimento & Procedimentos
          </h2>
          <p className="text-xs text-sky-50/90 max-w-xl mx-auto">
            Consulte instantaneamente scripts de atendimento, regras de convênios, preparo de exames e fluxos operacionais da clínica.
          </p>

          {/* Quick Search Bar */}
          <div className="relative max-w-xl mx-auto pt-3">
            <Search className="w-4 h-4 absolute left-3.5 top-6 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por procedimento, convênio, preparo ou script..."
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs shadow-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-6 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Panel Main Layout Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden min-h-[600px] grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        
        {/* Left Column: Categories Navigation */}
        <div className="md:col-span-3 p-4 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Categorias
              </span>
              <span className="text-[10px] font-medium text-slate-400 ml-1.5">
                ({categories.length})
              </span>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsNewCategoryModalOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0F3763] hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg border border-sky-200 transition-all cursor-pointer shadow-2xs"
                title="Cadastrar nova categoria de atendimento"
              >
                <FolderPlus className="w-3.5 h-3.5 text-sky-600" />
                <span>+ Nova</span>
              </button>
            )}
          </div>

          <div className="space-y-1">
            {categories.map((cat) => {
              const isCatActive = selectedCatId === cat.id && !selectedSubCat;
              const isExpanded = !!expandedCats[cat.id];

              return (
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCatId(cat.id);
                      setSelectedSubCat(null);
                      setSearchQuery('');
                      if (cat.hasSubCategories) {
                        toggleCatExpand(cat.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isCatActive
                        ? 'bg-[#0F3763] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isCatActive ? 'text-sky-300' : 'text-slate-500'}>
                        {getCategoryIcon(cat.icon)}
                      </span>
                      <span>{cat.name}</span>
                    </div>
                    {cat.hasSubCategories && (
                      <span className={isCatActive ? 'text-white/80' : 'text-slate-400'}>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </button>

                  {/* Subcategories */}
                  {cat.hasSubCategories && isExpanded && cat.subCategories && (
                    <div className="pl-6 space-y-1">
                      {cat.subCategories.map((sub) => {
                        const isSubActive = selectedCatId === cat.id && selectedSubCat === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => {
                              setSelectedCatId(cat.id);
                              setSelectedSubCat(sub);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              isSubActive
                                ? 'bg-sky-100 text-[#0F3763] font-semibold border-l-3 border-[#0F3763]'
                                : 'text-slate-600 hover:bg-slate-200/50'
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Articles List */}
        <div className="md:col-span-3 p-4 bg-white border-r border-slate-200 flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                  {searchQuery
                    ? 'Resultados da Busca'
                    : selectedSubCat
                    ? selectedSubCat
                    : categories.find((c) => c.id === selectedCatId)?.name}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {categoryArticles.length} procedimento(s)
                </span>
              </div>
              {canEdit && (
                <button
                  onClick={() => setIsNewArticleModalOpen(true)}
                  title="Novo Procedimento"
                  className="flex items-center gap-1 bg-[#0F3763] hover:bg-[#0C2A4C] active:bg-[#09203B] text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {categoryArticles.length === 0 ? (
                <div className="text-center py-12 px-2 text-xs text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p>Nenhum procedimento encontrado.</p>
                </div>
              ) : (
                categoryArticles.map((art) => {
                  const isSelected = activeArticle?.id === art.id;
                  return (
                    <button
                      key={art.id}
                      onClick={() => {
                        setSelectedArticleId(art.id);
                        if (isEditMode) {
                          setIsEditMode(false);
                          setActiveBlockId(null);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#0F3763] bg-sky-50/70 text-[#0F3763] shadow-xs font-semibold ring-1 ring-[#0F3763]'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="leading-snug">{art.title}</span>
                        {art.subCategory && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm shrink-0">
                            {art.subCategory}
                          </span>
                        )}
                      </div>
                      {art.content && (
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-1">
                          {art.content}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Procedure Viewer & Block Editor */}
        <div className="md:col-span-6 p-6 lg:p-8 bg-white flex flex-col justify-between space-y-6">
          {activeArticle ? (
            <div className="space-y-6">
              {/* Top Bar of the Procedure: Title & Action Modes */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1 max-w-xl">
                  {isEditMode ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Título do Procedimento:
                      </label>
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="Nome do procedimento..."
                        className="w-full text-xl font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                        {activeArticle.title}
                      </h1>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="bg-sky-100 text-[#0F3763] font-semibold px-2 py-0.5 rounded-md">
                          {categories.find((c) => c.id === activeArticle.categoryId)?.name || 'Geral'}
                        </span>
                        {activeArticle.subCategory && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {activeArticle.subCategory}
                          </span>
                        )}
                        {activeArticle.updatedAt && (
                          <span>Atualizado em: {activeArticle.updatedAt}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mode Controls */}
                <div className="flex items-center gap-2">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                        title="Cancelar alterações"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cancelar</span>
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg shadow-sm transition-all cursor-pointer"
                        title="Salvar alterações no banco"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Procedimento</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          const fullText = `${activeArticle.title}\n\n${activeArticle.content || ''}\n\n${
                            activeArticle.steps ? activeArticle.steps.join('\n') : ''
                          }`;
                          handleCopyText(fullText, 'Procedimento completo');
                        }}
                        className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        title="Copiar texto do procedimento para o WhatsApp ou chat"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Copiar</span>
                      </button>
                      {canEdit && (
                        <button
                          onClick={handleStartEdit}
                          className="flex items-center gap-1.5 bg-[#0F3763] hover:bg-[#0C2A4C] active:bg-[#09203B] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
                          title="Editar blocos, textos, fontes, cores e imagens"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Procedimento</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ================= EDIT MODE: VISUAL BLOCK & TEXT EDITOR ================= */}
              {isEditMode ? (
                <div className="space-y-6">
                  {/* Floating / Top Editor Toolbar */}
                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1 text-slate-300 font-medium">
                      <Palette className="w-4 h-4 text-sky-400" />
                      <span>Ferramentas de Edição do Procedimento</span>
                    </div>

                    {/* Quick Add Block Types Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider pr-1">
                        + Inserir Bloco:
                      </span>
                      <button
                        onClick={() => handleAddBlock('text')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer border border-slate-600"
                      >
                        <Type className="w-3 h-3 text-sky-400" />
                        <span>Texto</span>
                      </button>
                      <button
                        onClick={() => handleAddBlock('callout')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer border border-slate-600"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Aviso / Alerta</span>
                      </button>
                      <button
                        onClick={() => handleAddBlock('steps')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer border border-slate-600"
                      >
                        <Layers className="w-3 h-3 text-emerald-400" />
                        <span>Passo a Passo</span>
                      </button>
                      <button
                        onClick={() => handleAddBlock('image')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer border border-slate-600"
                      >
                        <ImageIcon className="w-3 h-3 text-purple-400" />
                        <span>Imagem / Print</span>
                      </button>
                      <button
                        onClick={() => handleAddBlock('script')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer border border-slate-600"
                      >
                        <MessageSquare className="w-3 h-3 text-blue-400" />
                        <span>Script</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Editable Blocks */}
                  <div className="space-y-5">
                    {draftBlocks.map((block, idx) => {
                      const isActive = activeBlockId === block.id;

                      return (
                        <div
                          key={block.id}
                          onClick={() => setActiveBlockId(block.id)}
                          className={`rounded-2xl transition-all border p-5 relative group ${
                            isActive
                              ? 'ring-2 ring-[#0F3763] border-[#0F3763] shadow-md'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          style={{
                            backgroundColor: block.bgColor || '#ffffff',
                            color: block.textColor || '#0f172a',
                            borderColor: block.borderColor || (isActive ? '#0F3763' : '#e2e8f0'),
                          }}
                        >
                          {/* Block Header & Format Controls */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 mb-4 bg-white/70 backdrop-blur-xs p-2.5 rounded-xl">
                            {/* Left: Block Title Input & Type Badge */}
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 shrink-0">
                                {block.type === 'callout'
                                  ? 'Aviso'
                                  : block.type === 'steps'
                                  ? 'Passos'
                                  : block.type === 'image'
                                  ? 'Imagem'
                                  : block.type === 'script'
                                  ? 'Script'
                                  : 'Texto'}
                              </span>
                              <input
                                type="text"
                                value={block.title || ''}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { title: e.target.value })
                                }
                                placeholder="Título do Bloco (opcional)..."
                                className="text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0F3763] focus:outline-none w-full"
                              />
                            </div>

                            {/* Center: Formatting Toolbar for this Block */}
                            <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
                              {/* Bold */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateBlock(block.id, { isBold: !block.isBold });
                                }}
                                className={`p-1.5 rounded cursor-pointer ${
                                  block.isBold
                                    ? 'bg-[#0F3763] text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                title="Negrito"
                              >
                                <Bold className="w-3.5 h-3.5" />
                              </button>

                              {/* Italic */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateBlock(block.id, { isItalic: !block.isItalic });
                                }}
                                className={`p-1.5 rounded cursor-pointer ${
                                  block.isItalic
                                    ? 'bg-[#0F3763] text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                title="Itálico"
                              >
                                <Italic className="w-3.5 h-3.5" />
                              </button>

                              {/* Underline */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateBlock(block.id, { isUnderline: !block.isUnderline });
                                }}
                                className={`p-1.5 rounded cursor-pointer ${
                                  block.isUnderline
                                    ? 'bg-[#0F3763] text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                title="Sublinhado"
                              >
                                <Underline className="w-3.5 h-3.5" />
                              </button>

                              <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

                              {/* Font Size Selector */}
                              <select
                                value={block.fontSize || '14px'}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateBlock(block.id, { fontSize: e.target.value });
                                }}
                                className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 cursor-pointer focus:outline-none"
                                title="Tamanho da Fonte"
                              >
                                {FONT_SIZES.map((sz) => (
                                  <option key={sz.value} value={sz.value}>
                                    {sz.label}
                                  </option>
                                ))}
                              </select>

                              <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

                              {/* Font Color Picker Dropdown / Palette */}
                              <div className="relative flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 pl-1">Cor:</span>
                                <div className="flex items-center gap-0.5">
                                  {FONT_COLORS.map((fc) => (
                                    <button
                                      key={fc.color}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateBlock(block.id, { textColor: fc.color });
                                      }}
                                      className={`w-4 h-4 rounded-full border border-slate-300 cursor-pointer ${
                                        block.textColor === fc.color ? 'ring-2 ring-sky-500 scale-110' : ''
                                      }`}
                                      style={{ backgroundColor: fc.color }}
                                      title={`Cor da fonte: ${fc.name}`}
                                    />
                                  ))}
                                  {/* Custom color input */}
                                  <input
                                    type="color"
                                    value={block.textColor || '#0f172a'}
                                    onChange={(e) =>
                                      handleUpdateBlock(block.id, { textColor: e.target.value })
                                    }
                                    className="w-5 h-5 rounded cursor-pointer border border-slate-300 ml-1 p-0 bg-transparent"
                                    title="Cor personalizada de texto"
                                  />
                                </div>
                              </div>

                              <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

                              {/* Background Color Picker */}
                              <div className="relative flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 pl-1">Fundo:</span>
                                <div className="flex items-center gap-0.5">
                                  {BG_COLORS.map((bg) => (
                                    <button
                                      key={bg.color}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateBlock(block.id, {
                                          bgColor: bg.color,
                                          borderColor: bg.border,
                                        });
                                      }}
                                      className={`w-4 h-4 rounded border border-slate-300 cursor-pointer ${
                                        block.bgColor === bg.color ? 'ring-2 ring-sky-500 scale-110' : ''
                                      }`}
                                      style={{ backgroundColor: bg.color }}
                                      title={`Cor de fundo: ${bg.name}`}
                                    />
                                  ))}
                                  {/* Custom BG color input */}
                                  <input
                                    type="color"
                                    value={block.bgColor || '#ffffff'}
                                    onChange={(e) =>
                                      handleUpdateBlock(block.id, { bgColor: e.target.value })
                                    }
                                    className="w-5 h-5 rounded cursor-pointer border border-slate-300 ml-1 p-0 bg-transparent"
                                    title="Cor personalizada de fundo"
                                  />
                                </div>
                              </div>

                              <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

                              {/* Alignment */}
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateBlock(block.id, { textAlign: 'left' });
                                  }}
                                  className={`p-1 rounded cursor-pointer ${
                                    (block.textAlign || 'left') === 'left'
                                      ? 'bg-slate-200 text-[#0F3763]'
                                      : 'text-slate-500 hover:bg-slate-100'
                                  }`}
                                  title="Alinhar à esquerda"
                                >
                                  <AlignLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateBlock(block.id, { textAlign: 'center' });
                                  }}
                                  className={`p-1 rounded cursor-pointer ${
                                    block.textAlign === 'center'
                                      ? 'bg-slate-200 text-[#0F3763]'
                                      : 'text-slate-500 hover:bg-slate-100'
                                  }`}
                                  title="Centralizar"
                                >
                                  <AlignCenter className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateBlock(block.id, { textAlign: 'right' });
                                  }}
                                  className={`p-1 rounded cursor-pointer ${
                                    block.textAlign === 'right'
                                      ? 'bg-slate-200 text-[#0F3763]'
                                      : 'text-slate-500 hover:bg-slate-100'
                                  }`}
                                  title="Alinhar à direita"
                                >
                                  <AlignRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateBlock(block.id, { textAlign: 'justify' });
                                  }}
                                  className={`p-1 rounded cursor-pointer ${
                                    block.textAlign === 'justify'
                                      ? 'bg-slate-200 text-[#0F3763]'
                                      : 'text-slate-500 hover:bg-slate-100'
                                  }`}
                                  title="Justificar"
                                >
                                  <AlignJustify className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Right: Block Order and Delete Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveBlock(idx, 'up');
                                }}
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30 cursor-pointer"
                                title="Mover bloco para cima"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === draftBlocks.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveBlock(idx, 'down');
                                }}
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30 cursor-pointer"
                                title="Mover bloco para baixo"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateBlock(block, idx);
                                }}
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                                title="Duplicar este bloco"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBlock(block.id);
                                }}
                                className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                                title="Excluir este bloco"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Block Body Based on Type */}
                          {block.type === 'callout' ? (
                            <div className="space-y-3">
                              {/* Callout Variant selector */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-600">
                                  Tipo de Alerta:
                                </span>
                                {(['warning', 'info', 'success', 'danger'] as const).map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={() => {
                                      let bg = '#fefce8';
                                      let border = '#fef08a';
                                      let text = '#854d0e';
                                      if (v === 'info') {
                                        bg = '#f4f9ff';
                                        border = '#dbeafe';
                                        text = '#0369a1';
                                      } else if (v === 'success') {
                                        bg = '#f0fdf4';
                                        border = '#bbf7d0';
                                        text = '#166534';
                                      } else if (v === 'danger') {
                                        bg = '#fef2f2';
                                        border = '#fecaca';
                                        text = '#991b1b';
                                      }
                                      handleUpdateBlock(block.id, {
                                        calloutVariant: v,
                                        bgColor: bg,
                                        borderColor: border,
                                        textColor: text,
                                      });
                                    }}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize cursor-pointer border ${
                                      block.calloutVariant === v
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {v === 'warning'
                                      ? 'Atenção'
                                      : v === 'info'
                                      ? 'Informativo'
                                      : v === 'success'
                                      ? 'Correto / Sucesso'
                                      : 'Regra Rígida'}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {block.calloutVariant === 'info' ? (
                                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                                  ) : block.calloutVariant === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                  ) : block.calloutVariant === 'danger' ? (
                                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                  )}
                                </div>
                                <textarea
                                  rows={3}
                                  value={block.content || ''}
                                  onChange={(e) =>
                                    handleUpdateBlock(block.id, { content: e.target.value })
                                  }
                                  placeholder="Digite o texto de alerta ou observação crítica..."
                                  className="w-full bg-white/80 border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                                  style={{
                                    fontSize: block.fontSize || '14px',
                                    fontWeight: block.isBold ? 'bold' : 'normal',
                                    fontStyle: block.isItalic ? 'italic' : 'normal',
                                    textDecoration: block.isUnderline ? 'underline' : 'none',
                                    textAlign: block.textAlign || 'left',
                                  }}
                                />
                              </div>
                            </div>
                          ) : block.type === 'steps' ? (
                            <div className="space-y-3">
                              <span className="text-[11px] font-semibold text-slate-600 block">
                                Passos Numerados de Atendimento:
                              </span>
                              <div className="space-y-2">
                                {(block.steps || []).map((step, sIdx) => (
                                  <div key={sIdx} className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#0F3763] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                      {sIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={step}
                                      onChange={(e) => {
                                        const newSteps = [...(block.steps || [])];
                                        newSteps[sIdx] = e.target.value;
                                        handleUpdateBlock(block.id, { steps: newSteps });
                                      }}
                                      placeholder={`Instrução do passo ${sIdx + 1}...`}
                                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                                      style={{
                                        fontSize: block.fontSize || '14px',
                                        fontWeight: block.isBold ? 'bold' : 'normal',
                                        fontStyle: block.isItalic ? 'italic' : 'normal',
                                        textAlign: block.textAlign || 'left',
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const filtered = (block.steps || []).filter(
                                          (_, i) => i !== sIdx
                                        );
                                        handleUpdateBlock(block.id, { steps: filtered });
                                      }}
                                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                      title="Remover passo"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const current = block.steps || [];
                                  handleUpdateBlock(block.id, {
                                    steps: [
                                      ...current,
                                      `Passo ${current.length + 1}: `,
                                    ],
                                  });
                                }}
                                className="flex items-center gap-1.5 text-xs font-semibold text-[#0F3763] hover:text-[#0A2B4E] cursor-pointer pt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar Próximo Passo</span>
                              </button>
                            </div>
                          ) : block.type === 'image' ? (
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => triggerImageUpload(block.id)}
                                    className="flex items-center gap-1.5 bg-[#0F3763] hover:bg-[#0C2A4C] text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Fazer Upload do Computador</span>
                                  </button>
                                  <span className="text-[11px] text-slate-400">ou cole uma URL:</span>
                                </div>

                                <div className="flex items-center gap-2 flex-1 max-w-sm">
                                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    value={block.imageUrl || ''}
                                    onChange={(e) =>
                                      handleUpdateBlock(block.id, { imageUrl: e.target.value })
                                    }
                                    placeholder="https://exemplo.com/imagem.png"
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                                  />
                                </div>

                                {/* Width selector */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500">Largura:</span>
                                  {(['small', 'medium', 'full'] as const).map((w) => (
                                    <button
                                      key={w}
                                      type="button"
                                      onClick={() => handleUpdateBlock(block.id, { imageWidth: w })}
                                      className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize cursor-pointer border ${
                                        (block.imageWidth || 'medium') === w
                                          ? 'bg-[#0F3763] text-white border-[#0F3763]'
                                          : 'bg-white text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {w === 'small' ? 'Pequena' : w === 'medium' ? 'Média' : 'Total'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Image Preview */}
                              {block.imageUrl ? (
                                <div
                                  className={`mx-auto space-y-2 ${
                                    block.imageWidth === 'small'
                                      ? 'max-w-[320px]'
                                      : block.imageWidth === 'full'
                                      ? 'w-full'
                                      : 'max-w-[550px]'
                                  }`}
                                >
                                  <div className="relative group/img overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-100">
                                    <img
                                      src={block.imageUrl}
                                      alt={block.imageCaption || 'Imagem do procedimento'}
                                      className="w-full object-cover rounded-xl max-h-[420px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setZoomImageUrl(block.imageUrl || '');
                                        setZoomImageCaption(block.imageCaption || null);
                                      }}
                                      className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                                      title="Ampliar imagem"
                                    >
                                      <ZoomIn className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={block.imageCaption || ''}
                                    onChange={(e) =>
                                      handleUpdateBlock(block.id, { imageCaption: e.target.value })
                                    }
                                    placeholder="Legenda da imagem (ex: Tela de confirmação no prontuário)..."
                                    className="w-full text-center text-xs text-slate-500 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-[#0F3763]"
                                  />
                                </div>
                              ) : (
                                <div
                                  onClick={() => triggerImageUpload(block.id)}
                                  className="border-2 border-dashed border-slate-300 hover:border-[#0F3763] rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-2 bg-slate-50/50"
                                >
                                  <Upload className="w-8 h-8 mx-auto text-slate-400 stroke-1" />
                                  <p className="text-xs font-medium text-slate-600">
                                    Clique para selecionar uma imagem do computador ou cole uma URL acima
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : block.type === 'script' ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F3763]">
                                <MessageSquare className="w-4 h-4 text-sky-600" />
                                <span>Texto do Script de Voz / WhatsApp:</span>
                              </div>
                              <textarea
                                rows={3}
                                value={block.content || ''}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { content: e.target.value })
                                }
                                placeholder="Digite a mensagem padrão que o operador deve ler ou enviar..."
                                className="w-full bg-white/90 border border-sky-200 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                                style={{
                                  fontSize: block.fontSize || '14px',
                                  fontWeight: block.isBold ? 'bold' : 'normal',
                                  fontStyle: block.isItalic ? 'italic' : 'normal',
                                  textDecoration: block.isUnderline ? 'underline' : 'none',
                                  textAlign: block.textAlign || 'left',
                                }}
                              />
                            </div>
                          ) : (
                            /* Standard Text Block */
                            <div className="space-y-2">
                              <textarea
                                rows={4}
                                value={block.content || ''}
                                onChange={(e) =>
                                  handleUpdateBlock(block.id, { content: e.target.value })
                                }
                                placeholder="Escreva o conteúdo ou procedimento detalhado..."
                                className="w-full bg-white/90 border border-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                                style={{
                                  fontSize: block.fontSize || '14px',
                                  fontWeight: block.isBold ? 'bold' : 'normal',
                                  fontStyle: block.isItalic ? 'italic' : 'normal',
                                  textDecoration: block.isUnderline ? 'underline' : 'none',
                                  textAlign: block.textAlign || 'left',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Block at the Bottom */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-xs font-medium text-slate-500 mr-2">
                      Adicionar novo bloco ao final:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('text')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                    >
                      <Type className="w-3.5 h-3.5 text-sky-600" />
                      <span>+ Texto Formatado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('callout')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-amber-200"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>+ Alerta / Atenção</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('steps')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Passo a Passo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('image')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-purple-200"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                      <span>+ Imagem / Print</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('script')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-sky-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                      <span>+ Script</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= VIEW / CONSULTATION MODE ================= */
                <div className="space-y-6">
                  {viewBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="rounded-2xl p-5 border transition-all"
                      style={{
                        backgroundColor: block.bgColor || '#ffffff',
                        color: block.textColor || '#0f172a',
                        borderColor: block.borderColor || '#e2e8f0',
                      }}
                    >
                      {/* Block Title if present */}
                      {block.title && (
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            {block.type === 'callout' && (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            {block.type === 'script' && (
                              <MessageSquare className="w-4 h-4 text-sky-600 shrink-0" />
                            )}
                            {block.type === 'image' && (
                              <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
                            )}
                            <span>{block.title}</span>
                          </h4>
                          {block.type === 'script' && block.content && (
                            <button
                              onClick={() => handleCopyText(block.content || '', 'Script')}
                              className="flex items-center gap-1 text-[11px] font-semibold text-[#0F3763] hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-sky-200"
                              title="Copiar script"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copiar Script</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Callout Variant Rendering */}
                      {block.type === 'callout' ? (
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {block.calloutVariant === 'info' ? (
                              <Info className="w-5 h-5 text-blue-600 shrink-0" />
                            ) : block.calloutVariant === 'success' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : block.calloutVariant === 'danger' ? (
                              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            )}
                          </div>
                          <div
                            className="leading-relaxed whitespace-pre-wrap"
                            style={{
                              fontSize: block.fontSize || '14px',
                              fontWeight: block.isBold ? 'bold' : 'normal',
                              fontStyle: block.isItalic ? 'italic' : 'normal',
                              textDecoration: block.isUnderline ? 'underline' : 'none',
                              textAlign: block.textAlign || 'left',
                            }}
                          >
                            {block.content}
                          </div>
                        </div>
                      ) : block.type === 'steps' ? (
                        <div className="space-y-2.5">
                          {(block.steps || []).map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-[#0F3763] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <div
                                className="leading-relaxed text-slate-800"
                                style={{
                                  fontSize: block.fontSize || '14px',
                                  fontWeight: block.isBold ? 'bold' : 'normal',
                                  fontStyle: block.isItalic ? 'italic' : 'normal',
                                  textAlign: block.textAlign || 'left',
                                }}
                              >
                                {step}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : block.type === 'image' && block.imageUrl ? (
                        <div
                          className={`mx-auto space-y-2 ${
                            block.imageWidth === 'small'
                              ? 'max-w-[320px]'
                              : block.imageWidth === 'full'
                              ? 'w-full'
                              : 'max-w-[550px]'
                          }`}
                        >
                          <div
                            onClick={() => {
                              setZoomImageUrl(block.imageUrl || '');
                              setZoomImageCaption(block.imageCaption || null);
                            }}
                            className="relative group overflow-hidden rounded-xl border border-slate-200 shadow-xs cursor-pointer bg-slate-50"
                          >
                            <img
                              src={block.imageUrl}
                              alt={block.imageCaption || 'Imagem do procedimento'}
                              className="w-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                              <ZoomIn className="w-4 h-4" />
                              <span>Clique para ampliar</span>
                            </div>
                          </div>
                          {block.imageCaption && (
                            <p className="text-center text-xs text-slate-500 italic">
                              {block.imageCaption}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div
                          className="leading-relaxed whitespace-pre-wrap"
                          style={{
                            fontSize: block.fontSize || '14px',
                            fontWeight: block.isBold ? 'bold' : 'normal',
                            fontStyle: block.isItalic ? 'italic' : 'normal',
                            textDecoration: block.isUnderline ? 'underline' : 'none',
                            textAlign: block.textAlign || 'left',
                          }}
                        >
                          {block.content}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Bottom Action: Edit Shortcut & Delete */}
                  <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={handleStartEdit}
                      className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Editar Textos e Blocos</span>
                    </button>

                    <button
                      onClick={() => handleDeleteArticle(activeArticle.id)}
                      className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Procedimento</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 stroke-1 text-slate-300" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-600">
                  Nenhum procedimento selecionado
                </h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Selecione um item na lista ao lado ou clique em "+ Novo" para cadastrar um novo procedimento de atendimento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Zoom Image Modal */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-150"
          >
            <div className="bg-[#0A2B4E] px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-300" />
                <span className="font-semibold text-xs tracking-wide">
                  {zoomImageCaption || 'Visualização Ampliada da Imagem'}
                </span>
              </div>
              <button
                onClick={() => setZoomImageUrl(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-auto flex items-center justify-center bg-slate-900/5">
              <img
                src={zoomImageUrl}
                alt="Imagem ampliada"
                className="max-h-[72vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            {zoomImageCaption && (
              <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-600">
                {zoomImageCaption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add New Procedure Article */}
      {isNewArticleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0A2B4E] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-300" />
                <h3 className="font-semibold text-xs uppercase tracking-wide">
                  Novo Procedimento de Atendimento
                </h3>
              </div>
              <button
                onClick={() => setIsNewArticleModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewArticle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Procedimento *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Como agendar consulta com retorno"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-[#0F3763] focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subcategoria (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value)}
                    placeholder="Ex: Scripts de Atendimento"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Inicial / Resumo
                </label>
                <textarea
                  rows={3}
                  value={newInitialContent}
                  onChange={(e) => setNewInitialContent(e.target.value)}
                  placeholder="Visão geral e orientações básicas do procedimento..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#0F3763] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-[11px] text-sky-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Após criar, você poderá adicionar blocos com imagens, passos numerados, cores e caixas de alerta.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewArticleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F3763] hover:bg-[#0C2A4C] active:bg-[#09203B] text-white cursor-pointer shadow-sm transition-all"
                >
                  Criar Procedimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Category */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0A2B4E] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-sky-300" />
                <h3 className="font-semibold text-xs uppercase tracking-wide">
                  Cadastrar Nova Categoria
                </h3>
              </div>
              <button
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Exames Cardiológicos, Recepção..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ícone Representativo
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {AVAILABLE_CATEGORY_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = newCatIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setNewCatIcon(item.name)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#0F3763] text-white border-[#0F3763] shadow-xs font-semibold'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                        title={item.label}
                      >
                        <IconComp className={`w-4 h-4 mb-1 ${isSelected ? 'text-sky-300' : 'text-slate-600'}`} />
                        <span className="truncate w-full text-center">{item.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subcategorias (Opcional)
                </label>
                <input
                  type="text"
                  value={newCatSubCategories}
                  onChange={(e) => setNewCatSubCategories(e.target.value)}
                  placeholder="Separe por vírgulas: Orientações, Laudos, Dúvidas"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#0F3763] focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Dica: Você poderá cadastrar procedimentos dentro dessas subcategorias.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F3763] hover:bg-[#0C2A4C] active:bg-[#09203B] text-white cursor-pointer shadow-sm transition-all"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
