'use client';

import React from 'react';
import { useData } from '../../context/DataContext';
import { 
  BsPlusCircleFill, 
  BsFunnel, 
  BsArrowUp, 
  BsArrowDown, 
  BsChevronDown, 
  BsChevronRight, 
  BsGraphUp, 
  BsTable, 
  BsLightningCharge,
  BsCalendar3
} from 'react-icons/bs';
import ChartComponents from '../../components/ChartComponents';
import StudyRegisterModal from '../../components/StudyRegisterModal';
import FilterModal from '../../components/FilterModal';
import StopwatchModal from '../../components/StopwatchModal';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  TimeScale, 
  BarElement, 
  RadialLinearScale 
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import CategoryHoursChart from '../../components/CategoryHoursChart';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker-custom.css';

import { HierarchicalPerformanceNode, StudyRecord } from '../../context/DataContext';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  TimeScale, 
  BarElement, 
  RadialLinearScale
);

// Formata "YYYY-MM-DD" como "DD/MM/AAAA" (parse manual, sem passar por new Date/UTC)
const formatDateBR = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const periodPresetLabels: Record<'7d' | '30d' | '90d' | '365d', string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  '365d': 'Último ano',
};

export default function Estatisticas() {
  const [isMounted, setIsMounted] = React.useState(false);
  const { 
    stats, 
    addStudyRecord, 
    updateStudyRecord, 
    applyFilters, 
    availableSubjects, 
    availableCategories,
    studyDays
  } = useData();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  const [chartJsLoaded, setChartJsLoaded] = React.useState(false);
  const [editingRecord, setEditingRecord] = React.useState<StudyRecord | null>(null);
  const [showStopwatchModal, setShowStopwatchModal] = React.useState(false);
  const [allTopicsExpanded, setAllTopicsExpanded] = React.useState(true);
  const [subjectSortOrder, setSubjectSortOrder] = React.useState('desc');
  const [activeTab, setActiveTab] = React.useState<'geral' | 'desempenho' | 'evolucao'>('geral');
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [evolutionPreset, setEvolutionPreset] = React.useState<'7d' | '30d' | '90d' | '365d' | 'custom'>('7d');
  const [evolutionCustomStart, setEvolutionCustomStart] = React.useState<Date | null>(null);
  const [evolutionCustomEnd, setEvolutionCustomEnd] = React.useState<Date | null>(null);
  const [isPeriodPresetOpen, setIsPeriodPresetOpen] = React.useState(false);
  const periodPresetRef = React.useRef<HTMLDivElement>(null);

  const daysUntilExam = React.useMemo(() => {
    const dataProva = stats.planMetadata?.data_prova;
    if (!dataProva) return null;
    // Parseia "YYYY-MM-DD" como data local (evita bug de fuso horário do new Date(string))
    const [y, m, d] = dataProva.split('-').map(Number);
    const examDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [stats.planMetadata?.data_prova]);
  
const sortedDailyStudy = React.useMemo(() => {
  const data = stats.dailyStudyTime ?? {};
  if (Object.keys(data).length === 0) return [];

  // Converte chaves para datas locais e ordena
  const dates = Object.keys(data).map(d => new Date(d.replace(/-/g, '/')));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date();

  const result = [];
  let curr = new Date(minDate);

  while (curr <= maxDate) {
    // FUNÇÃO QUE EVITA O ERRO DE FUSO:
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`; // Formato YYYY-MM-DD fixo
    
    // Busca os dados usando a mesma chave formatada
    const ms = data[dateStr] || 0;
    
    result.push({
      date: dateStr,
      hours: ms / 3600000
    });
    
    // Adiciona 1 dia
    curr.setDate(curr.getDate() + 1);
  }
  
  return result;
}, [stats.dailyStudyTime]);
  const totalDays = sortedDailyStudy.length;
  const initialMin = Math.max(0, totalDays - 7)

  React.useEffect(() => {
    setIsMounted(true);
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    import('chartjs-plugin-zoom').then((mod) => {
      ChartJS.register(mod.default);
      setChartJsLoaded(true);
    });
    
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodPresetRef.current && !periodPresetRef.current.contains(event.target as Node)) {
        setIsPeriodPresetOpen(false);
      }
    };
    if (isPeriodPresetOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPeriodPresetOpen]);

  const chartTextColor = isDarkMode ? '#9ca3af' : '#4B5563';

  

  const sortedSubjectHours = React.useMemo(() => {
    const entries = Object.entries(stats.subjectStudyHours ?? {});
    if (subjectSortOrder === 'desc') {
      entries.sort(([, a], [, b]) => b - a);
    } else if (subjectSortOrder === 'asc') {
      entries.sort(([, a], [, b]) => a - b);
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }
    return entries;
  }, [stats.subjectStudyHours, subjectSortOrder]);

  // Intervalo de datas selecionado nos filtros da aba Evolução (padrão: últimos 7 dias).
  const evolutionDateRange = React.useMemo(() => {
    const startOfDay = (d: Date) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };
    const endOfDay = (d: Date) => { const c = new Date(d); c.setHours(23, 59, 59, 999); return c; };

    if (evolutionPreset === 'custom') {
      if (!evolutionCustomStart || !evolutionCustomEnd) return null;
      return { start: startOfDay(evolutionCustomStart), end: endOfDay(evolutionCustomEnd) };
    }

    const days = evolutionPreset === '7d' ? 7 : evolutionPreset === '30d' ? 30 : evolutionPreset === '90d' ? 90 : 365;
    const end = endOfDay(new Date());
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - (days - 1));
    return { start, end };
  }, [evolutionPreset, evolutionCustomStart, evolutionCustomEnd]);

  // Datas de dailyQuestionStats dentro do período selecionado, já ordenadas.
  // Parse manual (substitui "-" por "/") para evitar o bug de fuso horário do new Date(string).
  const filteredQuestionDates = React.useMemo(() => {
    const allDates = Object.keys(stats.dailyQuestionStats ?? {});
    const inRange = evolutionDateRange
      ? allDates.filter(date => {
          const d = new Date(date.replace(/-/g, '/'));
          return d >= evolutionDateRange.start && d <= evolutionDateRange.end;
        })
      : allDates;
    return inRange.sort((a, b) => new Date(a.replace(/-/g, '/')).getTime() - new Date(b.replace(/-/g, '/')).getTime());
  }, [stats.dailyQuestionStats, evolutionDateRange]);

  // Totais do período selecionado: Total de Resoluções, Certas, Erradas e Taxa de Acerto.
  const evolutionQuestionSummary = React.useMemo(() => {
    const data = stats.dailyQuestionStats ?? {};
    let totalCorrect = 0, totalIncorrect = 0, totalResolutions = 0;
    filteredQuestionDates.forEach(date => {
      totalCorrect += data[date]?.correct || 0;
      totalIncorrect += data[date]?.incorrect || 0;
      totalResolutions += data[date]?.total || 0;
    });
    const accuracyRate = totalResolutions > 0 ? (totalCorrect / totalResolutions) * 100 : 0;
    return { totalCorrect, totalIncorrect, totalResolutions, accuracyRate };
  }, [stats.dailyQuestionStats, filteredQuestionDates]);

  const questionChartData = {
    labels: filteredQuestionDates,
    datasets: [
      {
        label: 'Acertos',
        data: filteredQuestionDates.map(date => (stats.dailyQuestionStats ?? {})[date].correct),
        backgroundColor: '#60a5fa',
        borderRadius: 0,
        stack: 'questoes',
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Erros',
        data: filteredQuestionDates.map(date => (stats.dailyQuestionStats ?? {})[date].incorrect),
        backgroundColor: '#ef4444',
        borderRadius: 4,
        stack: 'questoes',
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };

  const questionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: chartTextColor, boxWidth: 12, usePointStyle: true, pointStyle: 'rect' as const }
      },
      zoom: {
        pan: { enabled: true, mode: 'x' as const },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x' as const,
        }
      },
      datalabels: {
        display: (context: any) => (context.dataset.data[context.dataIndex] ?? 0) > 0,
        color: '#ffffff',
        font: { weight: 'bold' as const, size: 13 },
        anchor: 'center' as const,
        align: 'center' as const,
      },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'day', displayFormats: { day: 'dd/MM/yyyy' }, tooltipFormat: 'dd/MM/yyyy' },
        stacked: true,
        ticks: { color: chartTextColor },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: { color: chartTextColor },
        grid: { color: isDarkMode ? '#374151' : '#D1D5DB' }
      },
    },
  };

  const formatTime = (milliseconds: number) => {
  if (!milliseconds || milliseconds < 0) return '00h 00min';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}min`;
};

  const getPerformancePillColor = (p: number) => {
    if (p >= 80) return 'bg-gradient-to-r from-gold-400 to-gold-200 text-gold-900 font-bold animate-pulse';
    if (p >= 60) return 'bg-yellow-200 text-yellow-800';
    return 'bg-red-200 text-red-800';
  };

  const HierarchicalPerformanceRow: React.FC<{ node: HierarchicalPerformanceNode; level: number; getPerformancePillColor: (p: number) => string; allTopicsExpanded: boolean }> = ({ node, level, getPerformancePillColor, allTopicsExpanded }) => {
    const [isExpanded, setIsExpanded] = React.useState(allTopicsExpanded);
    const hasChildren = node.children && node.children.length > 0;

    React.useEffect(() => {
      setIsExpanded(allTopicsExpanded);
    }, [allTopicsExpanded]);

    const indentation = level * 24;
    const isGrouping = node.is_grouping_topic;
    

    return (
      <>
        <tr className={isGrouping ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
          <td style={{ paddingLeft: `${indentation + 16}px` }} className="px-4 py-3 text-sm font-medium break-words border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {hasChildren && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="mr-2 text-gray-500 dark:text-gray-400 focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  {isExpanded ? <BsChevronDown /> : <BsChevronRight />}
                </button>
              )}
              <span className={`${isGrouping ? 'font-bold' : ''} ${!hasChildren && 'ml-7'}`}>
                {isGrouping ? `* ${node.name}` : node.name}
              </span>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-center border-r border-gray-200 dark:border-gray-700">{node.acertos}</td>
          <td className="px-4 py-3 text-sm text-center border-r border-gray-200 dark:border-gray-700">{node.erros}</td>
          <td className="px-4 py-3 text-sm text-center border-r border-gray-200 dark:border-gray-700">{node.total}</td>
          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold">
            <span className={`px-2 py-1 text-xs rounded-full ${getPerformancePillColor(Math.round(node.percentualAcerto))}`}>
              {node.percentualAcerto.toFixed(1)}%
            </span>
          </td>
        </tr>
        {hasChildren && isExpanded && node.children.map((child, index) => (
          <HierarchicalPerformanceRow
            key={child.id || index}
            node={child}
            level={level + 1}
            getPerformancePillColor={getPerformancePillColor}
            allTopicsExpanded={allTopicsExpanded}
          />
        ))}
      </>
    );
  };
if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12 flex items-center justify-center">
         <p className="text-gray-500 font-medium">Carregando painel...</p>
      </div>
    );
  }
  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-12">
        {/* Cabeçalho */}
        <div className="mb-6">
          <header className="flex justify-between items-center pt-4">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Estatísticas</h1>
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-gold-500 text-white rounded-full shadow-lg hover:bg-gold-600 transition-all font-semibold">
                <BsPlusCircleFill className="mr-2" /> Adicionar Estudo
              </button>
              <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center px-4 py-2 bg-gold-500 text-white rounded-full shadow-lg hover:bg-gold-600 transition-all font-semibold">
                <BsFunnel className="mr-2" /> Filtros
              </button>
            </div>
          </header>
          <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
        </div>

        {/* Sistema de Abas */}
        <div className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 p-1 rounded-xl backdrop-blur-sm border border-gray-200 dark:border-gray-700 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'geral' ? 'bg-gold-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gold-500'}`}
          >
            <BsGraphUp className="mr-2" /> Geral
          </button>
          <button
            onClick={() => setActiveTab('desempenho')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'desempenho' ? 'bg-gold-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gold-500'}`}
          >
            <BsTable className="mr-2" /> Desempenho
          </button>
          <button
            onClick={() => setActiveTab('evolucao')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'evolucao' ? 'bg-gold-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gold-500'}`}
          >
            <BsLightningCharge className="mr-2" /> Evolução
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'geral' && (
          <div className="space-y-6">
            {/* Metadados do Plano */}
            {stats.planMetadata && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-400 uppercase">Concurso</span>
                  <p className="text-lg font-bold truncate">{stats.planMetadata.concurso || '-'}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-400 uppercase">Data Prova</span>
                  <p className="text-lg font-bold text-gold-500">{stats.planMetadata.data_prova ? formatDateBR(stats.planMetadata.data_prova) : '-'}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-400 uppercase">Banca</span>
                  <p className="text-lg font-bold">{stats.planMetadata.banca || '-'}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-400 uppercase">Nota de Corte</span>
                  <p className="text-lg font-bold text-blue-500">{stats.planMetadata.nota_corte_alvo ? `${stats.planMetadata.nota_corte_alvo} pontos` : '-'}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap tracking-tight block">Desempenho Ponderado</span>
                  {stats.planMetadata?.nota_corte_alvo ? (
                    <>
                      <p className={`text-lg font-bold ${stats.overallSimuladoWeightedPerformance >= stats.planMetadata.nota_corte_alvo ? 'text-green-500' : 'text-red-500'}`}>
                        {stats.overallSimuladoWeightedPerformance.toFixed(1)} pontos
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((stats.overallSimuladoWeightedPerformance / stats.planMetadata.nota_corte_alvo) * 100).toFixed(0)}% da meta
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Defina a nota de corte alvo em &quot;Editar Plano&quot;.</p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-400 uppercase">Dias para a Prova</span>
                  <p className={`text-lg font-bold ${daysUntilExam !== null && daysUntilExam < 0 ? 'text-gray-400' : 'text-purple-500'}`}>
                    {daysUntilExam === null ? '-' : daysUntilExam < 0 ? 'Realizada' : daysUntilExam}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Desempenho Geral - Altura Fixa */}
              <div className="md:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-[400px] flex flex-col">
    
                <h2 className="text-xl font-semibold mb-4">Desempenho Geral</h2>
                <div className="flex-grow">
                  <ChartComponents stats={stats} />
                </div>
              </div>

              {/* Grade unificada de métricas - todos os cards com mesma largura/altura */}
              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-2 gap-4 h-auto lg:h-[400px]">

<div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
    Tempo Total de Estudos
  </h2>
  <p className="text-2xl lg:text-3xl font-bold text-gold-500 whitespace-nowrap leading-none mb-4">
    {formatTime(stats.totalStudyTime)}
  </p>

  <div className="flex flex-col gap-1 text-sm">
    <span className="font-normal text-gray-500 dark:text-gray-400">
      {stats.uniqueStudyDays > 0 
        ? formatTime(stats.totalStudyTime / stats.uniqueStudyDays) 
        : "0h"}  <span className="font-light"> por dia estudado (média)</span>
    </span>
    
    <span className="font-normal text-gray-500 dark:text-gray-400">
    <span className="font-light"> Total de </span>    
  <span className="font-bold">
    {stats.uniqueStudyDays}
  </span> 
  
  <span className="font-light"> dias estudados</span>
</span>
  </div>
</div>

<div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
    Progresso no Edital
  </h2>
  
  
  <p className="text-3xl font-bold text-gold-500 mb-4">
    {stats.overallEditalProgress.toFixed(1)}%
  </p>


  <div className="flex flex-col gap-1 text-sm">
    <p className="text-gray-600 dark:text-gray-400">
  <span className="font-bold">
    {stats.completedTopics}
  </span> 
  <span className="font-light ml-1">tópicos concluídos de {stats.totalTopics}</span>
</p>
    
    <p className="text-gray-500 dark:text-gray-400 font-light">
      {stats.pendingTopics} tópicos pendentes
    </p>
  </div>
</div>

<div className="row-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
  <h2 className="text-xl font-semibold mb-6">Constância</h2>
  <div className="text-5xl xl:text-6xl font-black text-gold-500 mb-5 leading-none">{stats.studyConsistencyPercentage?.toFixed(1)}%</div>

  <div className="mt-2 space-y-2 text-sm">
    <div className="flex items-center justify-center gap-2 text-green-500 font-medium">
      <span>✓</span>
      <span>{stats.uniqueStudyDays} dias estudados</span>
    </div>

    <div className="flex items-center justify-center gap-2 text-red-500 font-medium">
      <span>✗</span>
      <span>{stats.failedStudyDays} dias falhos</span>
    </div>

    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-yellow-500 font-medium">
      Meta semanal: {studyDays.length} dias
    </div>
  </div>
</div>

<div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
    Páginas lidas
  </h2>

  
  <p className="text-3xl font-bold text-blue-500 leading-none">
    {stats.totalPagesRead.toLocaleString('pt-BR')}
  </p>
  
  
  <div className="mt-3 text-gray-500 dark:text-gray-400">
  <span className="font-semibold">
    {stats.pagesPerHour.toFixed(1)}
  </span>
  <span className="font-light text-sm ml-1">páginas/hora</span>
</div>
</div>

<div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
    Tempo Total de Videoaulas
  </h2>
  <p className="text-2xl lg:text-3xl font-bold text-gold-500 whitespace-nowrap leading-none">
    {formatTime(stats.totalVideoTime)}
  </p>
</div>

              </div>

            </div>
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-[400px] flex flex-col mt-6">
  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
    Evolução de Estudos Diários
  </h2>
  
  <div className="flex-grow w-full h-full relative">
    {chartJsLoaded ? (
      <Bar
        data={{
          labels: sortedDailyStudy.map(item => {
  const [year, month, day] = item.date.split('-').map(Number);

  const date = new Date(year, month - 1, day);

  const weekday = date.toLocaleDateString('pt-BR', {
  weekday: 'long'
});

return [
  `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${String(year).slice(-2)}`,
  weekday
];
}),
          datasets: [{
            label: 'Horas',
            data: sortedDailyStudy.map(item => item.hours),
            backgroundColor: '#1e40af',
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
          }]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { 
              ticks: { color: chartTextColor }, 
              grid: { display: false } ,
              min: initialMin, 
              max: totalDays - 1
            },
            y: { 
              beginAtZero: true,
              ticks: { color: chartTextColor },
              grid: { color: 'rgba(156, 163, 175, 0.15)' } 
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
  callbacks: {
    title: () => '',
    label: (context) => {
      const totalMinutes = Math.round(context.parsed.y * 60);
      const horas = Math.floor(totalMinutes / 60);
      const minutos = totalMinutes % 60;

      return minutos === 0
        ? `${horas}h`
        : `${horas}h ${minutos}min`;
    }
  }
},
            zoom: {
              zoom: {
                wheel: { enabled: true },
                mode: 'x',
                onZoomComplete: ({chart}) => {
                chart.update('none');
          }
              },
              pan: {
                enabled: true,
                mode: 'x',
              }
            }
          }
        }}
      />
    ) : (
      <div className="flex items-center justify-center h-full text-gray-500">
        Carregando gráfico...
      </div>
    )}
  </div>
</div>
</div>
        )}

        {activeTab === 'desempenho' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Tempo de Estudo por Matéria</h2>
                  <div className="flex space-x-2">
                    <button onClick={() => setSubjectSortOrder('desc')} className={`p-1.5 rounded-md ${subjectSortOrder === 'desc' ? 'bg-gold-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><BsArrowDown /></button>
                    <button onClick={() => setSubjectSortOrder('asc')} className={`p-1.5 rounded-md ${subjectSortOrder === 'asc' ? 'bg-gold-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><BsArrowUp /></button>
                  </div>
                </div>
                <div className="flex-grow relative">
  {chartJsLoaded && (
    <Bar 
      data={{
        labels: sortedSubjectHours.map(([s]) => s),
        datasets: [{ 
          label: 'Horas', 
          data: sortedSubjectHours.map(([, h]) => parseFloat(h.toFixed(2))), 
          backgroundColor: '#1e40af',
          borderRadius: 4
        }]
      }}
      options={{ 
        indexAxis: 'y', 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { 
          x: { 
            ticks: { color: chartTextColor },
            grid: { 
              color: 'rgba(156, 163, 175, 0.15)', 
              drawBorder: false 
            }
          }, 
          y: { 
            ticks: {
              color: chartTextColor,
              // Trunca o nome da matéria manualmente (em vez de deixar o
              // Chart.js cortar do jeito dele, que corta o INÍCIO do texto
              // nesse tipo de gráfico horizontal). Assim, o começo do nome
              // sempre fica visível e só o final é cortado, com "…".
              callback: function(value: any) {
                const label = this.getLabelForValue(value);
                const maxLen = 22;
                return label.length > maxLen ? `${label.slice(0, maxLen - 1)}…` : label;
              },
            },
            grid: { display: false } 
          } 
        },
        plugins: {
          legend: { labels: { color: chartTextColor } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.x;
                return ` Horas: ${value.toFixed(2)}`;
              }
            }
          }
        }
      }} 
    />
  )}
</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-[500px] flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex-shrink-0">Categorias x Horas de Estudo</h3>
                <div className="flex-1 min-h-0 relative">
                  <CategoryHoursChart categoryStudyHours={stats.categoryStudyHours} />
                </div>
              </div>
            </div>
            
<div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md min-h-[500px] flex flex-col">
  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
    Desempenho por Disciplina
  </h2>
  
  <div className="flex-1 min-h-0 relative">
    {chartJsLoaded && Object.keys(stats.subjectPerformance ?? {}).length === 0 ? (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Nenhum registro de desempenho por disciplina.
      </div>
    ) : (
      chartJsLoaded && (
        <Bar
  data={{
    labels: Object.keys(stats.subjectPerformance ?? {}).sort(),
    datasets: [
      {
        label: 'Acertos (%)',
        data: Object.keys(stats.subjectPerformance ?? {}).sort().map(s => 
          parseFloat((stats.subjectPerformance[s].correctPercentage || 0).toFixed(2))
        ),
        backgroundColor: '#002BB9',
        borderRadius: 4,
      },
      {
        label: 'Erros (%)',
        data: Object.keys(stats.subjectPerformance ?? {}).sort().map(s => 
          parseFloat((stats.subjectPerformance[s].incorrectPercentage || 0).toFixed(2))
        ),
        backgroundColor: '#E40000', 
        borderRadius: 4,
      }
    ]
  }}
  options={{
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: chartTextColor }, 
        grid: { display: false }
      },
      y: {
        min: 0,
        max: 100,
        ticks: { 
          color: chartTextColor, 
          callback: (val) => `${val}%` 
        },
        grid: { color: 'rgba(156, 163, 175, 0.15)' } 
      }
    },
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { 
          color: chartTextColor, // Agora usa a variável de cor do tema
          usePointStyle: true 
        } 
      }
    }
  }}
/>
      )
    )}
  </div>
</div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md overflow-x-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Desempenho por Tópico</h2>
                <button onClick={() => setAllTopicsExpanded(!allTopicsExpanded)} className="text-gold-500 font-semibold hover:underline">
                  {allTopicsExpanded ? 'Recolher Tudo' : 'Expandir Tudo'}
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="p-4 font-bold border-b dark:border-gray-700">Disciplina/Tópico</th>
                    <th className="p-4 font-bold border-b dark:border-gray-700 text-center">Acertos</th>
                    <th className="p-4 font-bold border-b dark:border-gray-700 text-center">Erros</th>
                    <th className="p-4 font-bold border-b dark:border-gray-700 text-center">Total</th>
                    <th className="p-4 font-bold border-b dark:border-gray-700 text-center">Desempenho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.topicPerformance.map((node, i) => (
                    <HierarchicalPerformanceRow key={i} node={node} level={0} getPerformancePillColor={getPerformancePillColor} allTopicsExpanded={allTopicsExpanded} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'evolucao' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-gold-500">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Gap de Performance</h3>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black ${stats.performanceGap >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.performanceGap >= 0 ? '+' : ''}{stats.performanceGap?.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-400 mb-1">de diferença</span>
                </div>
               
                <p className="text-xs text-gray-500 mt-3">✅ Gap positivo: desempenho nos simulados acima dos estudos.</p>
                <p className="text-xs text-gray-500 mt-3">❌ Gap negativo: desempenho nos simulados abaixo dos estudos.</p>

              </div>
            </div>

           <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md flex flex-col overflow-hidden">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 flex-shrink-0">
    <h3 className="font-bold text-lg">
      Histórico de Questões
    </h3>

    <div className="flex flex-wrap items-center gap-3">
      <DatePicker
        selectsRange
        monthsShown={2}
        startDate={evolutionCustomStart}
        endDate={evolutionCustomEnd}
        onChange={(dates: [Date | null, Date | null]) => {
          const [start, end] = dates;
          setEvolutionCustomStart(start);
          setEvolutionCustomEnd(end);
          if (start && end) setEvolutionPreset('custom');
        }}
        dateFormat="dd/MM/yyyy"
        withPortal
        customInput={
          <button
            type="button"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors bg-white dark:bg-gray-700 ${evolutionPreset === 'custom' ? 'border-gold-500 ring-2 ring-gold-500 text-gray-800 dark:text-gray-100' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300'}`}
          >
            <span>
              {evolutionCustomStart && evolutionCustomEnd
                ? `${evolutionCustomStart.toLocaleDateString('pt-BR')} - ${evolutionCustomEnd.toLocaleDateString('pt-BR')}`
                : 'Selecione o período'}
            </span>
            <BsCalendar3 className="text-gray-400" />
          </button>
        }
      />

      <div className="relative" ref={periodPresetRef}>
        <button
          type="button"
          onClick={() => setIsPeriodPresetOpen(!isPeriodPresetOpen)}
          className={`flex items-center justify-between gap-3 px-4 py-2 rounded-lg text-sm font-semibold min-w-[160px] bg-gold-600 text-white dark:bg-gold-700 hover:bg-gold-700 dark:hover:bg-gold-600 transition-colors ${isPeriodPresetOpen ? 'ring-2 ring-gold-300' : ''}`}
        >
          <span>{evolutionPreset === 'custom' ? 'Personalizado' : periodPresetLabels[evolutionPreset]}</span>
          <BsChevronDown className={`transition-transform ${isPeriodPresetOpen ? 'rotate-180' : ''}`} />
        </button>

        {isPeriodPresetOpen && (
          <div className="absolute right-0 z-20 mt-1 w-full min-w-[160px] bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 ring-1 ring-black ring-opacity-5">
            {([
              { key: '7d', label: 'Últimos 7 dias' },
              { key: '30d', label: 'Últimos 30 dias' },
              { key: '90d', label: 'Últimos 90 dias' },
              { key: '365d', label: 'Último ano' },
            ] as const).map(({ key, label }) => (
              <div
                key={key}
                onClick={() => {
                  setEvolutionPreset(key);
                  setEvolutionCustomStart(null);
                  setEvolutionCustomEnd(null);
                  setIsPeriodPresetOpen(false);
                }}
                className={`px-4 py-2 text-sm cursor-pointer select-none ${evolutionPreset === key ? 'bg-gold-50 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400 font-semibold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 flex-shrink-0">
    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 text-center">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Total de Resoluções</p>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{evolutionQuestionSummary.totalResolutions}</p>
    </div>
    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 text-center">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Resoluções Certas</p>
      <p className="text-xl font-bold text-green-500 mt-1">{evolutionQuestionSummary.totalCorrect}</p>
    </div>
    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 text-center">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Resoluções Erradas</p>
      <p className="text-xl font-bold text-red-500 mt-1">{evolutionQuestionSummary.totalIncorrect}</p>
    </div>
    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 text-center">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Taxa de Acerto</p>
      <p className="text-xl font-bold text-gold-500 mt-1">{evolutionQuestionSummary.accuracyRate.toFixed(1)}%</p>
    </div>
  </div>

  <div className="h-[320px] relative flex-shrink-0">
    {chartJsLoaded && (
      <Bar
        data={questionChartData}
        plugins={[ChartDataLabels]}
        options={{
          ...questionChartOptions,
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            ...questionChartOptions.scales,
            x: {
              ...questionChartOptions.scales.x,
              ticks: {
                ...questionChartOptions.scales.x.ticks,
                maxRotation: 0,
                minRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8,
              },
            },
          },
        }}
      />
    )}
  </div>
</div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md h-[450px] flex flex-col overflow-hidden">
  <h3 className="font-bold text-lg mb-6 flex-shrink-0">
    Histórico de Simulados
  </h3>

  <div className="flex-1 min-h-0 relative">
  {chartJsLoaded && (
    <Line
      data={{
        labels: stats.simuladoHistory.map(s =>
          formatDateBR(s.date)
        ),
        datasets: [{
          label: 'Desempenho',
          data: stats.simuladoHistory.map(s => s.performance),
          borderColor: '#002BB9',
          backgroundColor: 'rgba(0, 43, 185, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: chartTextColor } }
        },
        scales: {
  y: {
    min: 0,
    max: 100,
    ticks: { color: chartTextColor },
    grid: { 
      color: 'rgba(156, 163, 175, 0.15)', // Cinza com 15% de opacidade
      drawBorder: false 
    }
  },
  x: {
    ticks: { color: chartTextColor },
    grid: { 
      display: true, // Agora exibimos as linhas verticais
      color: 'rgba(156, 163, 175, 0.15)', // A MESMA cor do eixo Y
      drawBorder: false
    }
  }
}
      }}
    />
  )}
</div>
</div>
          </div>
        )}
      </div>

      <StudyRegisterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveStudy} initialRecord={editingRecord} />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} onApply={applyFilters} sessions={[]} availableSubjects={availableSubjects} availableEditalData={[]} availableCategories={availableCategories} />
    </>
  );

  function handleSaveStudy(record: StudyRecord) {
    if (record.id) updateStudyRecord(record);
    else addStudyRecord({ ...record, id: Date.now().toString() } as any);
    setIsModalOpen(false);
    setEditingRecord(null);
  }
}
