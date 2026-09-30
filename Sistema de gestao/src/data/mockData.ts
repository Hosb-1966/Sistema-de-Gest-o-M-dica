import {
  RemarcaoItem,
  DoctorColumn,
  ScheduleGridData,
  IntranetCategory,
  IntranetArticle,
  RecessoWeekData,
  OperacionalData,
  DayOfWeek,
  DoctorTeamItem,
} from '../types';

export const initialRemarcacoes: RemarcaoItem[] = [
  {
    id: '1',
    medico: 'Fabricio',
    dataRemarcacao: '10/07/2025',
    dias: 2,
    qtPacientes: 10,
    horaCall: '00:30',
    contato: 'Email',
    data: '10/07/2025',
    prazo: 'Fora',
  },
  {
    id: '2',
    medico: 'Carolina',
    dataRemarcacao: '11/07/2025',
    dias: 3,
    qtPacientes: 10,
    horaCall: '01:30',
    contato: 'Whatsapp',
    data: '11/07/2025',
    prazo: 'Dentro',
  },
  {
    id: '3',
    medico: 'Hugo',
    dataRemarcacao: '12/07/2025',
    dias: 4,
    qtPacientes: 10,
    horaCall: '02:20',
    contato: 'Ligação',
    data: '12/07/2025',
    prazo: 'Fora',
  },
  {
    id: '4',
    medico: '-',
    dataRemarcacao: '13/07/2025',
    dias: 10,
    qtPacientes: 10,
    horaCall: '03:00',
    contato: 'Ligação',
    data: '13/07/2025',
    prazo: 'Dentro',
  },
];

export const initialConsultaDoctors: DoctorColumn[] = [
  { id: 'c_doc1', name: 'MARCEL' },
  { id: 'c_doc2', name: 'DAYANA' },
  { id: 'c_doc3', name: 'ALINE' },
  { id: 'c_doc4', name: 'FLAVIA' },
  { id: 'c_doc5', name: 'ISIS' },
  { id: 'c_doc6', name: 'YASMIN' },
  { id: 'c_doc7', name: 'EVELYN' },
  { id: 'c_doc8', name: 'MARCIA' },
];

export const initialExameDoctors: DoctorColumn[] = [
  { id: 'e_doc1', name: 'MARCEL' },
  { id: 'e_doc2', name: 'DAYANA' },
  { id: 'e_doc3', name: 'ALINE' },
  { id: 'e_doc4', name: 'FLAVIA' },
  { id: 'e_doc5', name: 'ISIS' },
  { id: 'e_doc6', name: 'YASMIN' },
  { id: 'e_doc7', name: 'EVELYN' },
  { id: 'e_doc8', name: 'MARCIA' },
];

export const initialDoctors: DoctorColumn[] = initialConsultaDoctors;

const days: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function generateInitialSchedule(isExam: boolean = false): ScheduleGridData {
  const grid: ScheduleGridData = {};
  const docList = isExam ? initialExameDoctors : initialConsultaDoctors;
  docList.forEach((doc, docIdx) => {
    days.forEach((day) => {
      // Slot 0
      grid[`${doc.id}_${day}_0`] = {
        id: `${doc.id}_${day}_0`,
        doctorName: isExam ? 'MARCELO SILVA' : 'ANA COSTA',
        timeRange: `08:00 - 12:0${docIdx}`,
        color: 'blue',
      };
      // Slot 1
      grid[`${doc.id}_${day}_1`] = {
        id: `${doc.id}_${day}_1`,
        doctorName: isExam ? 'PAULA SANTOS' : 'ROBERTO LIMA',
        timeRange: '14:00 - 18:00',
        color: 'orange',
      };
    });
  });
  return grid;
}

export const initialIntranetCategories: IntranetCategory[] = [
  { id: 'agendamentos', name: 'Agendamentos', icon: 'Calendar' },
  { id: 'convenios', name: 'Convênios', icon: 'FileText' },
  {
    id: 'procedimentos',
    name: 'Procedimentos Internos',
    icon: 'BookOpen',
    hasSubCategories: true,
    subCategories: ['Guias Gerais', 'Scripts de Atendimento'],
  },
  {
    id: 'glossario',
    name: 'Glossário',
    icon: 'BookOpen',
    hasSubCategories: true,
    subCategories: ['Termos e Siglas'],
  },
  { id: 'faq', name: 'Perguntas Frequentes', icon: 'HelpCircle' },
];

export const initialIntranetArticles: IntranetArticle[] = [
  {
    id: 'art1',
    categoryId: 'agendamentos',
    title: 'Como agendar uma consulta',
    content: 'Guia de passo a passo para a marcação de consultas para novos pacientes e retornos no sistema principal.',
    steps: [
      'Passo 1: Verificar dados do paciente.',
      'Passo 2: Consultar agenda do médico.',
      'Passo 3: Confirmar e enviar lembrete.',
    ],
  },
  {
    id: 'art2',
    categoryId: 'agendamentos',
    title: 'Remarcação de consulta',
    content: 'Procedimento para alteração de datas e horários de consultas previamente agendadas.',
    steps: [
      'Passo 1: Localizar a consulta original no sistema de remarcações.',
      'Passo 2: Verificar a nova disponibilidade do médico solicitada pelo paciente.',
      'Passo 3: Registrar o motivo do reagendamento e notificar via canal preferencial.',
    ],
  },
  {
    id: 'art3',
    categoryId: 'agendamentos',
    title: 'Cancelamento de exame',
    content: 'Política e regras para cancelamentos de exames laboratoriais e de imagem.',
    steps: [
      'Passo 1: Validar antecedência mínima de 24 horas.',
      'Passo 2: Liberar o horário na grade do consultório/equipamento.',
      'Passo 3: Registrar o status e informar o setor de recepção.',
    ],
  },
  {
    id: 'art4',
    categoryId: 'convenios',
    title: 'Planos e Coberturas Aceitas',
    content: 'Relação completa de convênios médicos credenciados e especificações por unidade.',
    steps: [
      'Passo 1: Solicitar carteira virtual ou física do convênio.',
      'Passo 2: Verificar vigência e carência no portal do prestador.',
      'Passo 3: Anexar token ou autorização prévia no prontuário.',
    ],
  },
  {
    id: 'art5',
    categoryId: 'procedimentos',
    subCategory: 'Guias Gerais',
    title: 'Atendimento na Recepção',
    content: 'Manual de boas práticas para recepção e triagem inicial dos pacientes.',
    steps: [
      'Passo 1: Recepção cortês e verificação de documento com foto.',
      'Passo 2: Confirmação do cadastro e dados de contato.',
      'Passo 3: Encaminhamento à sala de espera com emissão de senha.',
    ],
  },
  {
    id: 'art6',
    categoryId: 'procedimentos',
    subCategory: 'Scripts de Atendimento',
    title: 'Script de Confirmação Via WhatsApp',
    content: 'Modelo padronizado de mensagem para envio de lembrete de agendamento.',
    steps: [
      'Passo 1: "Olá [Nome], confirmamos sua consulta com Dr(a). [Médico] amanhã às [Horário] na unidade [Unidade]?"',
      'Passo 2: Respostas com SIM: confirmar no sistema.',
      'Passo 3: Respostas com NÃO/REMARCAR: iniciar fluxo de remarcação.',
    ],
  },
  {
    id: 'art7',
    categoryId: 'glossario',
    subCategory: 'Termos e Siglas',
    title: 'Principais Siglas Médicas do Sistema',
    content: 'Tabela explicativa de siglas utilizadas nas agendas e nos relatórios de faturamento.',
    steps: [
      'SG: São Gonçalo',
      'IC: Icaraí',
      'RM: Ressonância Magnética',
      'TC: Tomografia Computadorizada',
    ],
  },
  {
    id: 'art8',
    categoryId: 'faq',
    title: 'O que fazer em caso de indisponibilidade do sistema?',
    content: 'Orientações de contingência técnica durante manutenção de servidores.',
    steps: [
      'Passo 1: Utilizar a planilha local offline de emergência.',
      'Passo 2: Comunicar o TI via canal interno de emergência.',
      'Passo 3: Sincronizar os dados assim que o sistema reestabelecer conexões.',
    ],
  },
];

export const initialRecessoData: RecessoWeekData[] = [
  {
    id: 'sem1',
    title: 'ATENDIMENTO RECESSO FIM DE ANO – 1ª SEMANA',
    consultorios: [
      {
        id: 'c1',
        name: 'CONS. 1',
        schedule: {
          SEG: { manha: { doctorName: 'DR. CARLOS SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. ROBERTO LIMA', timeRange: '14:00 - 18:00' } },
          TER: { manha: { doctorName: 'DRA. ANA COSTA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. FERNANDA SOUZA', timeRange: '14:00 - 18:00' } },
          QUA: { manha: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. CAMILA FERREIRA', timeRange: '14:00 - 18:00' } },
          QUI: { manha: { doctorName: 'DR. FELIPE BARROS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
          SEX: { manha: { doctorName: 'DR. RODRIGO MARTINS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
          SÁB: { manha: { doctorName: 'DR. THIAGO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
        },
      },
      {
        id: 'c2',
        name: 'CONS. 2',
        schedule: {
          SEG: { manha: { doctorName: 'DRA. CAMILA FERREIRA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '14:00 - 18:00' } },
          TER: { manha: { doctorName: 'DR. FELIPE BARROS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
          QUA: { manha: { doctorName: 'DR. RODRIGO MARTINS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
          QUI: { manha: { doctorName: 'DR. THIAGO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
          SEX: { manha: { doctorName: 'DR. PEDRO HENRIQUE', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. MARIANA SILVA', timeRange: '14:00 - 18:00' } },
          SÁB: { manha: { doctorName: 'DR. LUCAS OLIVEIRA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. PATRICIA SANTOS', timeRange: '14:00 - 18:00' } },
        },
      },
      {
        id: 'c3',
        name: 'CONS. 3',
        schedule: {
          SEG: { manha: { doctorName: 'DR. RODRIGO MARTINS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
          TER: { manha: { doctorName: 'DR. FELIPE BARROS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
          QUA: { manha: { doctorName: 'DR. THIAGO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
          QUI: { manha: { doctorName: 'DR. PEDRO HENRIQUE', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. MARIANA SILVA', timeRange: '14:00 - 18:00' } },
          SEX: { manha: { doctorName: 'DR. LUCAS OLIVEIRA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. PATRICIA SANTOS', timeRange: '14:00 - 18:00' } },
          SÁB: { manha: { doctorName: 'DR. CARLOS SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. ROBERTO LIMA', timeRange: '14:00 - 18:00' } },
        },
      },
      {
        id: 'c4',
        name: 'CONS. 4',
        schedule: {
          SEG: { manha: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '14:00 - 18:00' } },
          TER: { manha: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
          QUA: { manha: { doctorName: 'DRA. MARIANA SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
          QUI: { manha: { doctorName: 'DRA. PATRICIA SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
          SEX: { manha: { doctorName: 'DR. ROBERTO LIMA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. MARIANA SILVA', timeRange: '14:00 - 18:00' } },
          SÁB: { manha: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. PATRICIA SANTOS', timeRange: '14:00 - 18:00' } },
        },
      },
    ],
  },
  {
    id: 'sem2',
    title: 'ATENDIMENTO RECESSO FIM DE ANO – 2ª SEMANA',
    consultorios: [
      {
        id: 'c1_2',
        name: 'CONS. 1',
        schedule: {
          SEG: { manha: { doctorName: 'DR. CARLOS SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. ROBERTO LIMA', timeRange: '14:00 - 18:00' } },
          TER: { manha: { doctorName: 'DRA. ANA COSTA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. FERNANDA SOUZA', timeRange: '14:00 - 18:00' } },
          QUA: { manha: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. CAMILA FERREIRA', timeRange: '14:00 - 18:00' } },
          QUI: { manha: { doctorName: 'DR. FELIPE BARROS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
          SEX: { manha: { doctorName: 'DR. RODRIGO MARTINS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
          SÁB: { manha: { doctorName: 'DR. THIAGO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
        },
      },
      {
        id: 'c2_2',
        name: 'CONS. 2',
        schedule: {
          SEG: { manha: { doctorName: 'DRA. CAMILA FERREIRA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '14:00 - 18:00' } },
          TER: { manha: { doctorName: 'DR. FELIPE BARROS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
          QUA: { manha: { doctorName: 'DR. RODRIGO MARTINS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
          QUI: { manha: { doctorName: 'DR. THIAGO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
          SEX: { manha: { doctorName: 'DR. PEDRO HENRIQUE', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. MARIANA SILVA', timeRange: '14:00 - 18:00' } },
          SÁB: { manha: { doctorName: 'DR. LUCAS OLIVEIRA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. PATRICIA SANTOS', timeRange: '14:00 - 18:00' } },
        },
      },
    ],
  },
];

export const initialOperacionalData: OperacionalData = {
  unit: 'Centro',
  consultorios: [
    {
      id: 'op_c1',
      name: 'CONS. 1',
      schedule: {
        SEG: { manha: { doctorName: 'DR. CARLOS SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. ROBERTO LIMA', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: 'DRA. ANA COSTA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. FERNANDA SOUZA', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. CAMILA FERREIRA', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: 'DR. FELIPE BARROS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: 'DR. RODRIGO MARTINS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: 'DR. THIAGO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
      },
    },
    {
      id: 'op_c2',
      name: 'CONS. 2',
      schedule: {
        SEG: { manha: { doctorName: 'DRA. CAMILA FERREIRA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: 'DR. FELIPE BARROS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: 'DR. RODRIGO MARTINS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: 'DR. THIAGO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: 'DR. PEDRO HENRIQUE', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. MARIANA SILVA', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: 'DR. LUCAS OLIVEIRA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. PATRICIA SANTOS', timeRange: '14:00 - 18:00' } },
      },
    },
    {
      id: 'op_c3',
      name: 'CONS. 3',
      schedule: {
        SEG: { manha: { doctorName: 'DR. RODRIGO MARTINS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. BEATRIZ COSTA', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: 'DR. FELIPE BARROS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: 'DR. THIAGO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: 'DR. PEDRO HENRIQUE', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. MARIANA SILVA', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: 'DR. LUCAS OLIVEIRA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. PATRICIA SANTOS', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: 'DR. CARLOS SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. ROBERTO LIMA', timeRange: '14:00 - 18:00' } },
      },
    },
    {
      id: 'op_c4',
      name: 'CONS. 4',
      schedule: {
        SEG: { manha: { doctorName: 'DRA. JULIANA PACHECO', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. THIAGO SANTOS', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: 'DRA. RAQUEL SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. PEDRO HENRIQUE', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: 'DRA. MARIANA SILVA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. LUCAS OLIVEIRA', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: 'DRA. PATRICIA SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DR. CARLOS SILVA', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: 'DR. ROBERTO LIMA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. ANA COSTA', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: 'DR. GUSTAVO SANTOS', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. FERNANDA SOUZA', timeRange: '14:00 - 18:00' } },
      },
    },
    {
      id: 'op_c5',
      name: 'CONS. 5',
      schedule: {
        SEG: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
      },
    },
    {
      id: 'op_c6',
      name: 'CONS. 6',
      schedule: {
        SEG: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: '', timeRange: '08:00 - 12:00' }, tarde: { doctorName: '', timeRange: '14:00 - 18:00' } },
      },
    },
  ],
};

export const initialOperacionalExamesData: OperacionalData = {
  unit: 'Fonseca',
  consultorios: [
    {
      id: 'op_e1',
      name: 'EXAME 1',
      schedule: {
        SEG: { manha: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: 'ECOCARDIOGRAMA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ECOCARDIOGRAMA', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'DRA. CAMILA FERREIRA', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: 'HOLTER / MAPA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'HOLTER / MAPA', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: 'ECOCARDIOGRAMA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ECOCARDIOGRAMA', timeRange: '14:00 - 18:00' } },
      },
    },
    {
      id: 'op_e2',
      name: 'EXAME 2',
      schedule: {
        SEG: { manha: { doctorName: 'RAIO-X DIGITAL', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'RAIO-X DIGITAL', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: 'RAIO-X DIGITAL', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'RAIO-X DIGITAL', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: 'MAMOGRAFIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'MAMOGRAFIA', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: 'RAIO-X DIGITAL', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'RAIO-X DIGITAL', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: 'MAMOGRAFIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'MAMOGRAFIA', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: 'RAIO-X DIGITAL', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'RAIO-X DIGITAL', timeRange: '14:00 - 18:00' } },
      },
    },
    {
      id: 'op_e3',
      name: 'EXAME 3',
      schedule: {
        SEG: { manha: { doctorName: 'ELETROCARDIOGRAMA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ELETROENCEFALOGRAMA', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: 'ELETROCARDIOGRAMA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ELETROCARDIOGRAMA', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: 'TESTE ERGOMÉTRICO', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'TESTE ERGOMÉTRICO', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: 'ELETROCARDIOGRAMA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ELETROCARDIOGRAMA', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: 'TESTE ERGOMÉTRICO', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ELETROCARDIOGRAMA', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: 'ELETROCARDIOGRAMA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ELETROCARDIOGRAMA', timeRange: '14:00 - 18:00' } },
      },
    },
    {
      id: 'op_e4',
      name: 'EXAME 4',
      schedule: {
        SEG: { manha: { doctorName: 'ENDOSCOPIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'COLONOSCOPIA', timeRange: '14:00 - 18:00' } },
        TER: { manha: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '14:00 - 18:00' } },
        QUA: { manha: { doctorName: 'ENDOSCOPIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ENDOSCOPIA', timeRange: '14:00 - 18:00' } },
        QUI: { manha: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '14:00 - 18:00' } },
        SEX: { manha: { doctorName: 'COLONOSCOPIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ENDOSCOPIA', timeRange: '14:00 - 18:00' } },
        SÁB: { manha: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '08:00 - 12:00' }, tarde: { doctorName: 'ULTRASSONOGRAFIA', timeRange: '14:00 - 18:00' } },
      },
    },
  ],
};

// Generates an independent, isolated dataset for any unit and module
export function createInitialOperacionalUnitData(
  module: 'consultas' | 'exames',
  unitName: string
): OperacionalData {
  const base = module === 'exames' ? initialOperacionalExamesData : initialOperacionalData;
  const unitSlug = unitName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

  return {
    unit: unitName,
    consultorios: base.consultorios.map((c, idx) => ({
      id: `cons_${module}_${unitSlug}_${idx + 1}`,
      name: c.name,
      schedule: JSON.parse(JSON.stringify(c.schedule)),
    })),
  };
}

export const initialEquipeMedica: DoctorTeamItem[] = [
  {
    id: 'doc_team_1',
    name: 'DRA. ALICE GOMES DE ALMEIDA',
    specialty: 'Oftalmologia Geral',
    crm: '521129929',
    rqe: '34567',
    celular: '(21) 99999-1234',
    fazExames: true,
    photoUrl: '',
  },
  {
    id: 'doc_team_2',
    name: 'DRA. ANA PAULA DE ALMEIDA AVILA',
    specialty: 'Catarata',
    crm: '52790818',
    rqe: '34568',
    celular: '(21) 99999-5678',
    fazExames: true,
    photoUrl: '',
  },
  {
    id: 'doc_team_3',
    name: 'DR. ARMANDO MAGALHAES NETO',
    specialty: 'Retina',
    crm: '52518824',
    rqe: '34569',
    celular: '(21) 96888-1122',
    fazExames: true,
    photoUrl: '',
  },
  {
    id: 'doc_team_4',
    name: 'DR. ARTUR ELIAS MARSKI FILHO',
    specialty: 'Glaucoma',
    crm: '52775118',
    rqe: '34570',
    celular: '(21) 96888-3344',
    fazExames: true,
    photoUrl: '',
  },
  {
    id: 'doc_team_5',
    name: 'DR. BERNARDO SIQUEIRA ROCHA',
    specialty: 'Córnea | Catarata',
    crm: '52838780',
    rqe: '34571',
    celular: '(21) 97777-5566',
    fazExames: true,
    photoUrl: '',
  },
  {
    id: 'doc_team_6',
    name: 'DR. BLANCO PINHEIRO BLANCO',
    specialty: 'Catarata',
    crm: '52780499',
    rqe: '34572',
    celular: '(21) 97777-7788',
    fazExames: true,
    photoUrl: '',
  },
];
