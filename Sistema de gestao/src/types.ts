export type TabType = 'remarcacoes' | 'dashboard' | 'consultas' | 'exames' | 'intranet' | 'recesso' | 'operacional' | 'equipe_medica';

// Auth & Permissions Types
export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  permissions: TabType[];
  canEdit: boolean;
  createdAt?: string;
}

// 0. Equipe Médica Types
export interface DoctorTeamItem {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  rqe?: string;
  celular?: string;
  fazExames: boolean;
  photoUrl?: string;
}

// 1. Remarcações Types
export interface RemarcaoItem {
  id: string;
  medico: string;
  dataRemarcacao: string; // DD/MM/AAAA
  dias: number;
  qtPacientes: number;
  horaCall: string; // HH:MM
  contato: 'Email' | 'Whatsapp' | 'Ligação';
  data: string; // DD/MM/AAAA
  prazo: 'Dentro' | 'Fora';
}

export interface RemarcaoFilter {
  medico: string;
  dataInicio: string;
  dataFim: string;
  dataRemarcacao?: string;
  contato: string;
  prazo: string;
}

// 2. Dashboard KPI and Chart Types
export interface StatCardData {
  title: string;
  value: number;
  subtext: string;
}

export interface MetricRemarcacaoData {
  name: string;
  value: number;
}

export interface MeioContatoData {
  name: string;
  value: number;
  color: string;
  percentage: string;
}

export interface PrazoRemarcacaoData {
  name: string;
  value: number;
  color: string;
  percentage: string;
}

export interface AgendaUnidadeData {
  unidade: string;
  consultas: number;
  exames: number;
}

export interface MedicoPrazoData {
  medico: string;
  status: 'Dentro do Prazo' | 'Fora do Prazo';
  value: number;
  color: string;
}

export interface AtividadeSemanalData {
  dia: string;
  agendas: number;
}

// 3. Consultas & Exames Types
export interface ScheduleSlot {
  id: string;
  doctorName: string;
  timeRange: string; // e.g. "14:00 - 18:00"
  color: 'orange' | 'blue' | 'gray';
}

export type DayOfWeek = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SÁB';

export interface DoctorColumn {
  id: string;
  name: string;
}

// Map key: `${doctorId}_${day}_${slotIndex}`
export type ScheduleGridData = Record<string, ScheduleSlot>;

// 4. Intranet Types
export type IntranetBlockType = 'text' | 'callout' | 'steps' | 'image' | 'script';

export interface IntranetBlock {
  id: string;
  type: IntranetBlockType;
  title?: string;
  content?: string;
  steps?: string[];
  imageUrl?: string;
  imageCaption?: string;
  imageWidth?: 'small' | 'medium' | 'full';
  // Styling properties:
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  fontSize?: string; // '12px' | '14px' | '16px' | '18px' | '22px'
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  calloutVariant?: 'info' | 'warning' | 'success' | 'danger';
}

export interface IntranetArticle {
  id: string;
  categoryId: string;
  subCategory?: string;
  title: string;
  content: string;
  steps?: string[];
  blocks?: IntranetBlock[];
  updatedAt?: string;
}

export interface IntranetCategory {
  id: string;
  name: string;
  icon: string;
  hasSubCategories?: boolean;
  subCategories?: string[];
}

// 5. Recesso Types
export interface RecessoSlot {
  doctorName: string;
  timeRange: string;
}

export interface RecessoConsultorio {
  id: string;
  name: string; // e.g. "CONS. 1"
  schedule: {
    [day in DayOfWeek]: {
      manha: RecessoSlot;
      tarde: RecessoSlot;
    };
  };
}

export interface RecessoWeekData {
  id: string;
  title: string; // e.g. "ATENDIMENTO RECESSO FIM DE ANO – 1ª SEMANA"
  consultorios: RecessoConsultorio[];
}

// 6. Operacional Types
export interface OperacionalSlot {
  doctorName: string;
  timeRange: string;
  isDesmontado?: boolean;
}

export interface OperacionalConsultorio {
  id: string;
  name: string; // e.g. "CONS. 1"
  schedule: {
    [day in DayOfWeek]: {
      manha: OperacionalSlot;
      tarde: OperacionalSlot;
    };
  };
}

export interface OperacionalData {
  unit: string; // e.g. "Centro"
  consultorios: OperacionalConsultorio[];
}
