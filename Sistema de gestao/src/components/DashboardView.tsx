import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { FileText, Calendar, Building2 } from 'lucide-react';
import { RemarcaoItem, OperacionalData, DayOfWeek } from '../types';
import { getOperacionalKey } from '../lib/supabaseService';
import { createInitialOperacionalUnitData } from '../data/mockData';

interface DashboardViewProps {
  remarcacoesItems?: RemarcaoItem[];
  operacionalStore?: Record<string, OperacionalData>;
  operacionalData?: OperacionalData;
  operacionalExamesData?: OperacionalData;
}

const countOnlineSlots = (data?: OperacionalData): number => {
  if (!data || !data.consultorios) return 0;
  let count = 0;
  const days: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  data.consultorios.forEach((cons) => {
    days.forEach((day) => {
      const daySchedule = cons.schedule?.[day];
      (['manha', 'tarde'] as const).forEach((period) => {
        const slot = daySchedule?.[period];
        const isDesmontado = slot?.isDesmontado || slot?.doctorName === 'DESMONTADO';
        const isVago = !isDesmontado && (!slot?.doctorName || slot.doctorName.trim() === '' || slot.doctorName.trim().toUpperCase() === 'VAGO');
        if (!isDesmontado && !isVago) {
          count++;
        }
      });
    });
  });
  return count;
};

const parseHours = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;
  if (str.includes(':')) {
    const [hStr, mStr] = str.split(':');
    const h = parseFloat(hStr) || 0;
    const m = parseFloat(mStr) || 0;
    return h + m / 60;
  }
  const num = parseFloat(str.replace(',', '.'));
  return isNaN(num) ? 0 : num;
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  remarcacoesItems = [],
  operacionalStore,
  operacionalData,
  operacionalExamesData,
}) => {
  const items = remarcacoesItems;

  // 1. Métricas de Remarcações (DIAS: somar dias, QT PACIENTES: somar pacientes, HORA CALL: somar horas)
  const totalDias = items.reduce((acc, curr) => acc + (Number(curr.dias) || 0), 0);
  const totalPacientes = items.reduce((acc, curr) => acc + (Number(curr.qtPacientes) || 0), 0);
  const rawHoras = items.reduce((acc, curr) => acc + parseHours(curr.horaCall), 0);
  const totalHorasCall = rawHoras % 1 === 0 ? rawHoras : Math.round(rawHoras * 10) / 10;

  const metricasRemarcacoes = [
    { name: 'Qt. de dias', value: totalDias, fill: '#8B5CF6' },
    { name: 'Qt. Pacientes', value: totalPacientes, fill: '#10B981' },
    { name: 'Total de Horas Call', value: totalHorasCall, fill: '#F59E0B' },
  ];
  const maxMetricaVal = Math.max(40, totalDias, totalPacientes, totalHorasCall);

  // 2. Meios de Contato (coluna: CONTATO)
  const emailCount = items.filter((i) => (i.contato || '').toLowerCase() === 'email').length;
  const whatsappCount = items.filter((i) => (i.contato || '').toLowerCase() === 'whatsapp').length;
  const ligacaoCount = items.filter((i) => {
    const c = (i.contato || '').toLowerCase();
    return c === 'ligação' || c === 'ligacao';
  }).length;
  const outrosContatos = items.filter((i) => {
    const c = (i.contato || '').toLowerCase();
    return c && c !== 'email' && c !== 'whatsapp' && c !== 'ligação' && c !== 'ligacao';
  }).length;

  const totalContatos = items.length;
  const calcContatoPct = (count: number) =>
    totalContatos > 0 ? `${Math.round((count / totalContatos) * 100)}%` : '0%';

  const meiosContato = [
    { name: 'Email', value: emailCount, percentage: calcContatoPct(emailCount), color: '#6366F1' },
    { name: 'Whatsapp', value: whatsappCount, percentage: calcContatoPct(whatsappCount), color: '#10B981' },
    { name: 'Ligação', value: ligacaoCount, percentage: calcContatoPct(ligacaoCount), color: '#F59E0B' },
    ...(outrosContatos > 0
      ? [{ name: 'Outros', value: outrosContatos, percentage: calcContatoPct(outrosContatos), color: '#8B5CF6' }]
      : []),
  ];

  // 3. Prazo das Remarcações (coluna: PRAZO)
  const dentroCount = items.filter((i) => (i.prazo || '').toLowerCase().includes('dentro')).length;
  const foraCount = items.filter((i) => (i.prazo || '').toLowerCase().includes('fora')).length;
  const totalPrazos = dentroCount + foraCount;
  const calcPrazoPct = (count: number) =>
    totalPrazos > 0 ? `${Math.round((count / totalPrazos) * 100)}%` : '0%';

  const prazoRemarcacoes = [
    { name: 'Dentro', value: dentroCount, percentage: calcPrazoPct(dentroCount), color: '#10B981' },
    { name: 'Fora', value: foraCount, percentage: calcPrazoPct(foraCount), color: '#EF4444' },
  ];

  // 4. Agendas por Unidade (lê as informações da página Operacional no Card: Status -> Online)
  const getUnitOnline = (unitFullName: string, module: 'consultas' | 'exames'): number => {
    const key = getOperacionalKey(module, unitFullName);
    if (operacionalStore && operacionalStore[key]?.consultorios) {
      return countOnlineSlots(operacionalStore[key]);
    }
    try {
      const raw = localStorage.getItem(`operacional_data_${key}`) || localStorage.getItem(`operacional_data_op_${module}_${unitFullName}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.consultorios) return countOnlineSlots(parsed);
      }
    } catch (_) {}
    if (module === 'consultas' && operacionalData && operacionalData.unit === unitFullName) {
      return countOnlineSlots(operacionalData);
    }
    if (module === 'exames' && operacionalExamesData && operacionalExamesData.unit === unitFullName) {
      return countOnlineSlots(operacionalExamesData);
    }
    const initial = createInitialOperacionalUnitData(module, unitFullName);
    return countOnlineSlots(initial) || 48;
  };

  const agendasUnidade = [
    {
      unidade: 'Fonseca',
      Consultas: getUnitOnline('Fonseca', 'consultas'),
      Exames: getUnitOnline('Fonseca', 'exames'),
    },
    {
      unidade: 'Centro',
      Consultas: getUnitOnline('Centro', 'consultas'),
      Exames: getUnitOnline('Centro', 'exames'),
    },
    {
      unidade: 'SG',
      Consultas: getUnitOnline('São Gonçalo', 'consultas'),
      Exames: getUnitOnline('São Gonçalo', 'exames'),
    },
    {
      unidade: 'Icaraí',
      Consultas: getUnitOnline('Icaraí', 'consultas'),
      Exames: getUnitOnline('Icaraí', 'exames'),
    },
  ];

  // 5. Médicos por Prazo de Remarcação (coluna: MÉDICO)
  const doctorMap: Record<string, { total: number; dentro: number; fora: number }> = {};
  items.forEach((item) => {
    const doc = (item.medico || '').trim();
    if (!doc || doc === '-') return;
    if (!doctorMap[doc]) {
      doctorMap[doc] = { total: 0, dentro: 0, fora: 0 };
    }
    doctorMap[doc].total += 1;
    if ((item.prazo || '').toLowerCase().includes('dentro')) {
      doctorMap[doc].dentro += 1;
    } else {
      doctorMap[doc].fora += 1;
    }
  });

  const medicosPrazo = Object.entries(doctorMap).map(([medico, counts]) => {
    const isFora = counts.fora > 0;
    return {
      medico,
      value: counts.total,
      status: isFora ? 'Fora do Prazo' : 'Dentro do Prazo',
      fill: isFora ? '#EF4444' : '#10B981',
    };
  });
  const maxMedicoPrazoVal = Math.max(1, ...medicosPrazo.map((m) => m.value));

  // 6. Atividade Semanal (dados da página Operacional no Card: Atividade Semanal para Consultas e Exames)
  // Consultas: SEG: 08 | TER: 08 | QUA: 08 | QUI: 08 | SEX: 08 | SAB: 0
  // Exames:    SEG: 08 | TER: 08 | QUA: 08 | QUI: 08 | SEX: 08 | SAB: 0
  const atividadeConsultas = { SEG: 8, TER: 8, QUA: 8, QUI: 8, SEX: 8, SÁB: 0 };
  const atividadeExames = { SEG: 8, TER: 8, QUA: 8, QUI: 8, SEX: 8, SÁB: 0 };

  const atividadeSemanal = [
    { dia: 'SEG', agendas: atividadeConsultas.SEG + atividadeExames.SEG },
    { dia: 'TER', agendas: atividadeConsultas.TER + atividadeExames.TER },
    { dia: 'QUA', agendas: atividadeConsultas.QUA + atividadeExames.QUA },
    { dia: 'QUI', agendas: atividadeConsultas.QUI + atividadeExames.QUI },
    { dia: 'SEX', agendas: atividadeConsultas.SEX + atividadeExames.SEX },
    { dia: 'SÁB', agendas: atividadeConsultas.SÁB + atividadeExames.SÁB },
  ];

  // Stat Card Data
  const stats = [
    { title: 'Total de Médicos', value: 40, subtext: 'médicos únicos com consultas', icon: FileText },
    { title: 'Remarcações', value: items.length, subtext: 'total de remarcações', icon: Calendar },
    { title: 'Exames', value: 17, subtext: 'tipos de exames únicos', icon: FileText },
    { title: 'Unidades', value: 4, subtext: 'locais de atendimento', icon: Building2 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 shadow-xs border border-gray-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-gray-600">{stat.title}</span>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-normal text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid of 6 Charts matching image #2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Métricas de Remarcações */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-200">
          <h3 className="text-sm font-normal text-gray-800 mb-6">Métricas de Remarcações</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricasRemarcacoes} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis domain={[0, maxMetricaVal]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {metricasRemarcacoes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Meios de Contato */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-200">
          <h3 className="text-sm font-normal text-gray-800 mb-4">Meios de Contato</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-64">
            <div className="relative w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={meiosContato}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {meiosContato.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-normal text-gray-800">{totalContatos}</span>
                <span className="text-xs text-gray-400">Total</span>
              </div>
            </div>

            <div className="space-y-3">
              {meiosContato.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-normal text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-normal text-gray-900">{item.percentage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Prazo das Remarcações */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-200">
          <h3 className="text-sm font-normal text-gray-800 mb-4">Prazo das Remarcações</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-64">
            <div className="relative w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prazoRemarcacoes}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {prazoRemarcacoes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-normal text-gray-800">{totalPrazos}</span>
                <span className="text-xs text-gray-400">Total</span>
              </div>
            </div>

            <div className="space-y-3">
              {prazoRemarcacoes.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-normal text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-normal text-gray-900">{item.percentage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Agendas por Unidade */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-200">
          <h3 className="text-sm font-normal text-gray-800 mb-6">Agendas por Unidade</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agendasUnidade} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="unidade" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis domain={[0, 200]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Consultas" stackId="a" fill="#6366F1" />
                <Bar dataKey="Exames" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Médicos por Prazo de Remarcação */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-200">
          <h3 className="text-sm font-normal text-gray-800 mb-6">Médicos por Prazo de Remarcação</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medicosPrazo} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="medico" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis
                  domain={[0, maxMedicoPrazoVal]}
                  ticks={maxMedicoPrazoVal === 1 ? [0, 0.25, 0.5, 0.75, 1] : undefined}
                  allowDecimals={maxMedicoPrazoVal === 1}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value">
                  {medicosPrazo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} radius={[4, 4, 0, 0]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#10B981] inline-block rounded-xs" />
              <span className="text-gray-600 font-normal">Dentro do Prazo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#EF4444] inline-block rounded-xs" />
              <span className="text-gray-600 font-normal">Fora do Prazo</span>
            </div>
          </div>
        </div>

        {/* Chart 6: Atividade Semanal */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-200">
          <h3 className="text-sm font-normal text-gray-800 mb-6">Atividade Semanal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={atividadeSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis domain={[0, 20]} ticks={[0, 4, 8, 12, 16, 20]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="agendas"
                  name="Agendas (Consultas + Exames)"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#EC4899' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
