import { supabase, isSupabaseConfigured } from './supabase';
import {
  RemarcaoItem,
  DoctorColumn,
  ScheduleGridData,
  IntranetCategory,
  IntranetArticle,
  RecessoWeekData,
  OperacionalData,
  DoctorTeamItem,
  AppUser,
  TabType,
} from '../types';

// Generic helper to fetch from a Supabase table with fallback
export async function fetchFromSupabase<T>(tableName: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured || !supabase) return fallback;
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error || !data || data.length === 0) {
      console.warn(`[Supabase] Table ${tableName} query notice:`, error?.message || 'No rows found');
      return fallback;
    }
    return data as unknown as T;
  } catch (err) {
    console.error(`[Supabase] Error fetching ${tableName}:`, err);
    return fallback;
  }
}

// REMARCAÇÕES
export async function loadRemarcacoes(fallback: RemarcaoItem[]): Promise<RemarcaoItem[]> {
  let cached: RemarcaoItem[] | null = null;
  try {
    const raw = localStorage.getItem('remarcacoes_items');
    if (raw) cached = JSON.parse(raw);
  } catch (e) {
    console.error('[localStorage] loadRemarcacoes error:', e);
  }

  if (!isSupabaseConfigured || !supabase) return cached || fallback;

  try {
    const { data, error } = await supabase.from('remarcacoes').select('*');
    if (error || !data || data.length === 0) return cached || fallback;
    const items = data.map((item: any) => ({
      id: String(item.id),
      medico: item.medico || '',
      dataRemarcacao: item.data_remarcacao || item.dataRemarcacao || '',
      dias: Number(item.dias) || 0,
      qtPacientes: Number(item.qt_pacientes) || Number(item.qtPacientes) || 0,
      horaCall: item.hora_call || item.horaCall || '',
      contato: item.contato || 'Email',
      data: item.data || '',
      prazo: item.prazo || 'Dentro',
    }));
    try { localStorage.setItem('remarcacoes_items', JSON.stringify(items)); } catch (_) {}
    return items;
  } catch (err) {
    console.error('[Supabase] loadRemarcacoes error:', err);
    return cached || fallback;
  }
}

export async function saveRemarcacoes(items: RemarcaoItem[]): Promise<boolean> {
  try {
    localStorage.setItem('remarcacoes_items', JSON.stringify(items));
  } catch (e) {
    console.error('[localStorage] saveRemarcacoes error:', e);
  }

  if (!isSupabaseConfigured || !supabase) return true;
  try {
    const dbPayload = items.map((i) => ({
      id: String(i.id),
      medico: i.medico,
      data_remarcacao: i.dataRemarcacao,
      dias: i.dias,
      qt_pacientes: i.qtPacientes,
      hora_call: i.horaCall,
      contato: i.contato,
      data: i.data,
      prazo: i.prazo,
    }));

    if (dbPayload.length > 0) {
      const { error: upsertErr } = await supabase.from('remarcacoes').upsert(dbPayload);
      if (upsertErr) {
        console.warn('[Supabase] upsert remarcacoes warning:', upsertErr.message);
      }

      // Synchronize deletions in Supabase
      const currentIds = items.map((i) => String(i.id));
      const { data: remoteRows, error: fetchErr } = await supabase.from('remarcacoes').select('id');
      if (!fetchErr && remoteRows && remoteRows.length > 0) {
        const toDeleteIds = remoteRows
          .map((r: any) => String(r.id))
          .filter((id: string) => !currentIds.includes(id));
        if (toDeleteIds.length > 0) {
          await supabase.from('remarcacoes').delete().in('id', toDeleteIds);
        }
      }
    } else {
      await supabase.from('remarcacoes').delete().neq('id', '');
    }
    return true;
  } catch (err) {
    console.error('[Supabase] saveRemarcacoes error:', err);
    return false;
  }
}

export async function deleteRemarcacaoFromSupabase(id: string) {
  try {
    const raw = localStorage.getItem('remarcacoes_items');
    if (raw) {
      const items: RemarcaoItem[] = JSON.parse(raw);
      const filtered = items.filter((i) => String(i.id) !== String(id));
      localStorage.setItem('remarcacoes_items', JSON.stringify(filtered));
    }
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('remarcacoes').delete().eq('id', id);
  } catch (err) {
    console.error('[Supabase] deleteRemarcacaoFromSupabase error:', err);
  }
}

// INTRANET CATEGORIES
export async function loadIntranetCategories(fallback: IntranetCategory[]): Promise<IntranetCategory[]> {
  let cached: IntranetCategory[] | null = null;
  try {
    const raw = localStorage.getItem('intranet_categories');
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return cached || fallback;

  try {
    const { data, error } = await supabase.from('intranet_categories').select('*');
    if (!error && data && data.length > 0) {
      const items = data.map((item: any) => ({
        id: String(item.id),
        name: item.name || '',
        icon: item.icon || 'Folder',
        hasSubCategories: item.has_sub_categories ?? item.hasSubCategories ?? false,
        subCategories: Array.isArray(item.sub_categories) ? item.sub_categories : Array.isArray(item.subCategories) ? item.subCategories : [],
      }));
      try { localStorage.setItem('intranet_categories', JSON.stringify(items)); } catch (_) {}
      return items;
    }
  } catch (err) {
    console.warn('[Supabase] loadIntranetCategories fallback to cache/default:', err);
  }

  return cached || fallback;
}

export async function saveIntranetCategories(categories: IntranetCategory[]) {
  try {
    localStorage.setItem('intranet_categories', JSON.stringify(categories));
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    const payload = categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      has_sub_categories: c.hasSubCategories || false,
      sub_categories: c.subCategories || [],
    }));
    await supabase.from('intranet_categories').upsert(payload);
  } catch (err) {
    console.error('[Supabase] saveIntranetCategories error:', err);
  }
}

// INTRANET ARTICLES
export async function loadIntranetArticles(fallback: IntranetArticle[]): Promise<IntranetArticle[]> {
  let cached: IntranetArticle[] | null = null;
  try {
    const raw = localStorage.getItem('intranet_articles');
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return cached || fallback;

  try {
    const { data, error } = await supabase.from('intranet_articles').select('*');
    if (error || !data || data.length === 0) return cached || fallback;
    const items = data.map((item: any) => {
      let parsedBlocks = undefined;
      let cleanContent = item.content || '';
      
      if (item.blocks) {
        try {
          parsedBlocks = typeof item.blocks === 'string' ? JSON.parse(item.blocks) : item.blocks;
        } catch (_) {}
      } else if (typeof cleanContent === 'string' && cleanContent.startsWith('{"_has_blocks":true')) {
        try {
          const parsed = JSON.parse(cleanContent);
          parsedBlocks = parsed.blocks;
          cleanContent = parsed.summary || '';
        } catch (_) {}
      }

      return {
        id: String(item.id),
        categoryId: item.category_id || item.categoryId || '',
        subCategory: item.sub_category || item.subCategory || undefined,
        title: item.title || '',
        content: cleanContent,
        steps: Array.isArray(item.steps) ? item.steps : item.steps ? JSON.parse(item.steps) : [],
        blocks: parsedBlocks,
        updatedAt: item.updated_at || item.updatedAt || undefined,
      };
    });
    try { localStorage.setItem('intranet_articles', JSON.stringify(items)); } catch (_) {}
    return items;
  } catch (err) {
    console.error('[Supabase] loadIntranetArticles error:', err);
    return cached || fallback;
  }
}

export async function saveIntranetArticles(articles: IntranetArticle[]) {
  try {
    localStorage.setItem('intranet_articles', JSON.stringify(articles));
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbPayloadWithBlocks = articles.map((a) => ({
      id: a.id,
      category_id: a.categoryId,
      sub_category: a.subCategory,
      title: a.title,
      content: a.content || '',
      steps: a.steps || [],
      blocks: a.blocks ? JSON.stringify(a.blocks) : null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('intranet_articles').upsert(dbPayloadWithBlocks);
    if (!error) {
      console.log(`[Supabase] saveIntranetArticles: ${articles.length} artigos salvos com sucesso.`);
      return;
    }

    console.warn('[Supabase] saveIntranetArticles falhou com payload completo, aplicando fallback seguro:', error.message);
    // Fallback: embed blocks in content so rich formatting is 100% preserved even without 'blocks' column
    const safePayload = articles.map((a) => {
      let contentToSave = a.content || '';
      if (a.blocks && a.blocks.length > 0) {
        contentToSave = JSON.stringify({
          _has_blocks: true,
          summary: a.content || '',
          blocks: a.blocks,
        });
      }
      return {
        id: a.id,
        category_id: a.categoryId,
        sub_category: a.subCategory,
        title: a.title,
        content: contentToSave,
        steps: a.steps || [],
      };
    });
    const { error: fallbackError } = await supabase.from('intranet_articles').upsert(safePayload);
    if (fallbackError) {
      console.error('[Supabase] saveIntranetArticles fallback error:', fallbackError);
    } else {
      console.log(`[Supabase] saveIntranetArticles: ${articles.length} artigos salvos com sucesso no modo compatibilidade.`);
    }
  } catch (err) {
    console.error('[Supabase] saveIntranetArticles error:', err);
  }
}

export async function deleteIntranetArticle(id: string) {
  try {
    const raw = localStorage.getItem('intranet_articles');
    if (raw) {
      const items: IntranetArticle[] = JSON.parse(raw);
      localStorage.setItem('intranet_articles', JSON.stringify(items.filter((a) => a.id !== id)));
    }
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('intranet_articles').delete().eq('id', id);
    if (error) {
      console.error('[Supabase] deleteIntranetArticle error:', error);
    } else {
      console.log(`[Supabase] deleteIntranetArticle: artigo ${id} excluído com sucesso do banco de dados.`);
    }
  } catch (err) {
    console.error('[Supabase] deleteIntranetArticle error:', err);
  }
}

// RECESSO DATA
export async function loadRecessoData(fallback: RecessoWeekData[]): Promise<RecessoWeekData[]> {
  let cached: RecessoWeekData[] | null = null;
  try {
    const raw = localStorage.getItem('recesso_data');
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return cached || fallback;

  try {
    const { data, error } = await supabase.from('recesso_data').select('*');
    if (error || !data || data.length === 0) return cached || fallback;
    const items = data.map((row: any) => ({
      id: String(row.id),
      title: row.title || row.week_label || row.weekLabel || '',
      consultorios: typeof row.consultorios === 'string' ? JSON.parse(row.consultorios) : row.consultorios || [],
    }));
    try { localStorage.setItem('recesso_data', JSON.stringify(items)); } catch (_) {}
    return items;
  } catch (err) {
    console.error('[Supabase] loadRecessoData error:', err);
    return cached || fallback;
  }
}

export async function saveRecessoData(recessoWeeks: RecessoWeekData[]) {
  try {
    localStorage.setItem('recesso_data', JSON.stringify(recessoWeeks));
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbPayload = recessoWeeks.map((w) => ({
      id: w.id,
      title: w.title,
      consultorios: w.consultorios,
    }));
    await supabase.from('recesso_data').upsert(dbPayload);
  } catch (err) {
    console.error('[Supabase] saveRecessoData error:', err);
  }
}

// SCHEDULE MATRIX (CONSULTAS & EXAMES)
export async function loadScheduleColumns(type: 'consultas' | 'exames', fallback: DoctorColumn[]): Promise<DoctorColumn[]> {
  let cached: DoctorColumn[] | null = null;
  try {
    const raw = localStorage.getItem(`schedule_columns_${type}`);
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) {
    return cached ? JSON.parse(JSON.stringify(cached)) : JSON.parse(JSON.stringify(fallback));
  }

  try {
    const { data, error } = await supabase.from(`${type}_columns`).select('*');
    if (error || !data || data.length === 0) {
      return cached ? JSON.parse(JSON.stringify(cached)) : JSON.parse(JSON.stringify(fallback));
    }
    const cols = data.map((col: any) => ({
      id: String(col.id),
      name: col.name || '',
    }));
    try { localStorage.setItem(`schedule_columns_${type}`, JSON.stringify(cols)); } catch (_) {}
    return cols;
  } catch (err) {
    console.error(`[Supabase] loadScheduleColumns (${type}) error:`, err);
    return cached ? JSON.parse(JSON.stringify(cached)) : JSON.parse(JSON.stringify(fallback));
  }
}

export async function saveScheduleColumns(type: 'consultas' | 'exames', columns: DoctorColumn[]): Promise<boolean> {
  try {
    localStorage.setItem(`schedule_columns_${type}`, JSON.stringify(columns));
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return true;
  try {
    const dbPayload = columns.map((c) => ({
      id: String(c.id),
      name: c.name,
    }));
    if (dbPayload.length > 0) {
      await supabase.from(`${type}_columns`).upsert(dbPayload);
      // Clean up remote columns not in current list
      const currentIds = columns.map((c) => String(c.id));
      const { data: remoteRows } = await supabase.from(`${type}_columns`).select('id');
      if (remoteRows && remoteRows.length > 0) {
        const toDeleteIds = remoteRows
          .map((r: any) => String(r.id))
          .filter((id: string) => !currentIds.includes(id));
        if (toDeleteIds.length > 0) {
          await supabase.from(`${type}_columns`).delete().in('id', toDeleteIds);
        }
      }
    } else {
      await supabase.from(`${type}_columns`).delete().neq('id', '');
    }
    return true;
  } catch (err) {
    console.error(`[Supabase] saveScheduleColumns (${type}) error:`, err);
    return false;
  }
}

export async function loadScheduleGrid(type: 'consultas' | 'exames', fallback: ScheduleGridData): Promise<ScheduleGridData> {
  let cached: ScheduleGridData | null = null;
  try {
    const raw = localStorage.getItem(`schedule_grid_${type}`);
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) {
    return cached ? JSON.parse(JSON.stringify(cached)) : JSON.parse(JSON.stringify(fallback));
  }

  try {
    const { data, error } = await supabase.from(`${type}_grid`).select('*');
    if (error || !data || data.length === 0) {
      return cached ? JSON.parse(JSON.stringify(cached)) : JSON.parse(JSON.stringify(fallback));
    }
    const grid: ScheduleGridData = {};
    data.forEach((row: any) => {
      grid[row.id] = {
        id: String(row.id),
        doctorName: row.doctor_name || row.doctorName || '',
        timeRange: row.time_range || row.timeRange || '',
        color: row.color || 'blue',
      };
    });
    try { localStorage.setItem(`schedule_grid_${type}`, JSON.stringify(grid)); } catch (_) {}
    return grid;
  } catch (err) {
    console.error(`[Supabase] loadScheduleGrid (${type}) error:`, err);
    return cached ? JSON.parse(JSON.stringify(cached)) : JSON.parse(JSON.stringify(fallback));
  }
}

export async function saveScheduleGrid(type: 'consultas' | 'exames', grid: ScheduleGridData): Promise<boolean> {
  try {
    localStorage.setItem(`schedule_grid_${type}`, JSON.stringify(grid));
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return true;
  try {
    const dbPayload = Object.values(grid).map((slot) => ({
      id: String(slot.id),
      slot_key: String(slot.id),
      doctor_name: slot.doctorName,
      time_range: slot.timeRange,
      color: slot.color,
    }));
    if (dbPayload.length > 0) {
      await supabase.from(`${type}_grid`).upsert(dbPayload);
      // Clean up remote slots not in current grid
      const currentIds = Object.keys(grid);
      const { data: remoteRows } = await supabase.from(`${type}_grid`).select('id');
      if (remoteRows && remoteRows.length > 0) {
        const toDeleteIds = remoteRows
          .map((r: any) => String(r.id))
          .filter((id: string) => !currentIds.includes(id));
        if (toDeleteIds.length > 0) {
          await supabase.from(`${type}_grid`).delete().in('id', toDeleteIds);
        }
      }
    } else {
      await supabase.from(`${type}_grid`).delete().neq('id', '');
    }
    return true;
  } catch (err) {
    console.error(`[Supabase] saveScheduleGrid (${type}) error:`, err);
    return false;
  }
}

// OPERACIONAL DATA (INDEPENDENT PER UNIT & MODULE)
export function getOperacionalKey(module: 'consultas' | 'exames', unit: string): string {
  const m = module.toLowerCase().trim();
  const u = unit
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
  return `op_${m}_${u}`;
}

export async function loadAllOperacionalData(): Promise<Record<string, OperacionalData>> {
  const result: Record<string, OperacionalData> = {};
  const units = ['Fonseca', 'Centro', 'São Gonçalo', 'Icaraí'];
  const modules: Array<'consultas' | 'exames'> = ['consultas', 'exames'];

  // 1. Read local storage cache first for fast initial display
  for (const mod of modules) {
    for (const unit of units) {
      const cleanKey = getOperacionalKey(mod, unit);
      const rawKey = `op_${mod}_${unit}`;
      try {
        const stored = localStorage.getItem(`operacional_data_${cleanKey}`) || localStorage.getItem(`operacional_data_${rawKey}`);
        if (stored) {
          result[cleanKey] = JSON.parse(stored);
        }
      } catch (_) {}
    }
  }

  // 2. Fetch all records from Supabase table 'operacional_data'
  if (!isSupabaseConfigured || !supabase) return result;

  try {
    const { data, error } = await supabase.from('operacional_data').select('*');
    if (!error && data && Array.isArray(data)) {
      data.forEach((row: any) => {
        if (!row.id) return;
        const consultorios = typeof row.consultorios === 'string'
          ? JSON.parse(row.consultorios)
          : row.consultorios;
        if (Array.isArray(consultorios)) {
          const item: OperacionalData = {
            unit: row.unit || '',
            consultorios,
          };
          result[row.id] = item;
          try {
            localStorage.setItem(`operacional_data_${row.id}`, JSON.stringify(item));
          } catch (_) {}
        }
      });
    }
  } catch (err) {
    console.error('[Supabase] loadAllOperacionalData error:', err);
  }

  return result;
}

export async function loadOperacionalData(fallback: OperacionalData, id = 'main_operacional'): Promise<OperacionalData> {
  const cleanId = id
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

  let cached: OperacionalData | null = null;
  try {
    const raw = localStorage.getItem(`operacional_data_${cleanId}`) || localStorage.getItem(`operacional_data_${id}`);
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return cached || fallback;

  try {
    let response = await supabase.from('operacional_data').select('*').eq('id', cleanId).single();
    if (response.error || !response.data) {
      if (id !== cleanId) {
        response = await supabase.from('operacional_data').select('*').eq('id', id).single();
      }
    }

    const data = response.data;
    if (!data) return cached || fallback;

    const result: OperacionalData = {
      unit: data.unit || cached?.unit || fallback.unit,
      consultorios: typeof data.consultorios === 'string'
        ? JSON.parse(data.consultorios)
        : data.consultorios || cached?.consultorios || fallback.consultorios,
    };
    try {
      localStorage.setItem(`operacional_data_${cleanId}`, JSON.stringify(result));
      localStorage.setItem(`operacional_data_${id}`, JSON.stringify(result));
    } catch (_) {}
    return result;
  } catch (err) {
    console.error(`[Supabase] loadOperacionalData (${id}) error:`, err);
    return cached || fallback;
  }
}

export async function saveOperacionalData(opData: OperacionalData, id = 'main_operacional') {
  const cleanId = id
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

  try {
    localStorage.setItem(`operacional_data_${cleanId}`, JSON.stringify(opData));
    localStorage.setItem(`operacional_data_${id}`, JSON.stringify(opData));
  } catch (e) {
    console.error(`[localStorage] saveOperacionalData (${id}) error:`, e);
  }

  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('operacional_data').upsert([
      {
        id: cleanId,
        unit: opData.unit,
        consultorios: opData.consultorios,
      },
    ]);
  } catch (err) {
    console.error(`[Supabase] saveOperacionalData (${id}) error:`, err);
  }
}

// EQUIPE MÉDICA DATA
export async function loadEquipeMedica(fallback: DoctorTeamItem[]): Promise<DoctorTeamItem[]> {
  let cached: DoctorTeamItem[] | null = null;
  try {
    const raw = localStorage.getItem('equipe_medica');
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return cached || fallback;

  try {
    const { data, error } = await supabase.from('equipe_medica').select('*');
    if (error || !data || data.length === 0) return cached || fallback;
    const docs = data.map((item: any) => ({
      id: String(item.id),
      name: item.name || item.nome || '',
      specialty: item.specialty || item.especialidade || '',
      crm: item.crm || '',
      rqe: item.rqe || '',
      celular: item.celular || item.phone || '',
      fazExames: item.faz_exames ?? item.fazExames ?? true,
      photoUrl: item.photo_url || item.photoUrl || item.foto_url || '',
    }));
    try { localStorage.setItem('equipe_medica', JSON.stringify(docs)); } catch (_) {}
    return docs;
  } catch (err) {
    console.error('[Supabase] loadEquipeMedica error:', err);
    return cached || fallback;
  }
}

export async function saveEquipeMedica(doctors: DoctorTeamItem[]) {
  try {
    localStorage.setItem('equipe_medica', JSON.stringify(doctors));
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbPayload = doctors.map((doc) => ({
      id: doc.id,
      name: doc.name,
      specialty: doc.specialty,
      crm: doc.crm,
      rqe: doc.rqe || '',
      celular: doc.celular || '',
      faz_exames: doc.fazExames,
      photo_url: doc.photoUrl || '',
    }));
    await supabase.from('equipe_medica').upsert(dbPayload);
  } catch (err) {
    console.error('[Supabase] saveEquipeMedica error:', err);
  }
}

export async function deleteDoctorFromEquipeMedica(id: string) {
  try {
    const raw = localStorage.getItem('equipe_medica');
    if (raw) {
      const docs: DoctorTeamItem[] = JSON.parse(raw);
      const filtered = docs.filter(d => d.id !== id);
      localStorage.setItem('equipe_medica', JSON.stringify(filtered));
    }
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('equipe_medica').delete().eq('id', id);
  } catch (err) {
    console.error('[Supabase] deleteDoctorFromEquipeMedica error:', err);
  }
}

// ==========================================
// USUÁRIOS E PERMISSÕES (APP USERS)
// ==========================================

export const INITIAL_APP_USERS: AppUser[] = [
  {
    id: 'user-admin-default',
    username: 'admin',
    password: 'admin123',
    name: 'Administrador Geral',
    role: 'admin',
    permissions: ['dashboard', 'operacional', 'remarcacoes', 'equipe_medica', 'consultas', 'exames', 'intranet'],
    canEdit: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-atendimento-default',
    username: 'atendimento',
    password: 'user123',
    name: 'Operador de Atendimento',
    role: 'user',
    permissions: ['consultas', 'exames', 'intranet'],
    canEdit: false,
    createdAt: new Date().toISOString(),
  },
];

export async function loadAppUsers(): Promise<AppUser[]> {
  let cached: AppUser[] | null = null;
  try {
    const raw = localStorage.getItem('app_users');
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) {
    if (!cached || cached.length === 0) {
      try { localStorage.setItem('app_users', JSON.stringify(INITIAL_APP_USERS)); } catch (_) {}
      return INITIAL_APP_USERS;
    }
    return cached;
  }

  try {
    const { data, error } = await supabase.from('app_users').select('*');
    if (error || !data || data.length === 0) {
      // Tenta inicializar com os usuários padrão se o banco estiver vazio
      try {
        const payload = INITIAL_APP_USERS.map((u) => ({
          id: u.id,
          username: u.username,
          password: u.password,
          name: u.name,
          role: u.role,
          permissions: u.permissions,
          can_edit: u.role === 'admin' ? true : u.canEdit,
        }));
        await supabase.from('app_users').upsert(payload);
      } catch (_) {}
      return cached || INITIAL_APP_USERS;
    }

    const users: AppUser[] = data.map((item: any) => ({
      id: String(item.id),
      username: item.username || '',
      password: item.password || '',
      name: item.name || '',
      role: (item.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
      permissions: Array.isArray(item.permissions) ? (item.permissions as TabType[]) : [],
      canEdit: item.role === 'admin' ? true : Boolean(item.can_edit ?? item.canEdit ?? false),
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));

    try { localStorage.setItem('app_users', JSON.stringify(users)); } catch (_) {}
    return users;
  } catch (err) {
    console.error('[Supabase] loadAppUsers error:', err);
    return cached || INITIAL_APP_USERS;
  }
}

export async function saveAppUser(user: AppUser): Promise<void> {
  try {
    const raw = localStorage.getItem('app_users');
    let list: AppUser[] = raw ? JSON.parse(raw) : [...INITIAL_APP_USERS];
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push(user);
    }
    localStorage.setItem('app_users', JSON.stringify(list));
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('app_users').upsert([
      {
        id: user.id,
        username: user.username,
        password: user.password,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        can_edit: user.role === 'admin' ? true : false,
      },
    ]);
  } catch (err) {
    console.error('[Supabase] saveAppUser error:', err);
  }
}

export async function deleteAppUser(id: string): Promise<void> {
  try {
    const raw = localStorage.getItem('app_users');
    if (raw) {
      const list: AppUser[] = JSON.parse(raw);
      const filtered = list.filter((u) => u.id !== id);
      localStorage.setItem('app_users', JSON.stringify(filtered));
    }
  } catch (e) {}

  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('app_users').delete().eq('id', id);
  } catch (err) {
    console.error('[Supabase] deleteAppUser error:', err);
  }
}

