'use client';

import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, Title);

const CATEGORY_MAP: { [key: string]: string } = {
  teoria: 'TEORIA',
  revisao: 'REVISÃO',
  questoes: 'QUESTÕES',
  leitura_lei: 'LEITURA DE LEI',
  jurisprudencia: 'JURISPRUDÊNCIA',
};

interface CategoryHoursChartProps {
  categoryStudyHours: Record<string, number>;
}

const formatTimeLabel = (value: number): string => {
  const hours = Math.floor(value);
  const minutes = Math.round((value % 1) * 60);
  if (minutes > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}min`;
  }
  return `${hours}h`;
};

const EXAMPLE_DATA = {
  teoria: 8,
  revisao: 5.5,
  questoes: 12,
  leitura_lei: 7,
  jurisprudencia: 3,
};

const CategoryHoursChart: React.FC<CategoryHoursChartProps> = ({ categoryStudyHours }) => {

  // Estado para detectar dark mode
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    // Adiciona um observador para mudanças na classe 'dark' no elemento <html>
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartTextColor = isDarkMode ? '#9ca3af' : '#4B5563'; // gray-400 no escuro, gray-700 no claro
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb'; // gray-700 no escuro, gray-200 no claro

  const hasRealData = categoryStudyHours && Object.values(categoryStudyHours).some(value => value > 0);
  const dataToShow = hasRealData ? categoryStudyHours : EXAMPLE_DATA;

  // Define a ordem correta e garante a sincronia
  const orderedCategories = ['teoria', 'revisao', 'questoes', 'leitura_lei', 'jurisprudencia'];

  // Valores reais (em horas), usados nos rótulos e no tooltip.
  const realValues = orderedCategories.map(key => dataToShow[key] || 0);

  // Usamos a raiz quadrada apenas para POSICIONAR os pontos no radar.
  // Quando uma categoria tem muito mais horas que as outras (ex.: Teoria),
  // numa escala linear normal os valores menores ficam todos espremidos
  // perto do centro e os rótulos se sobrepõem. A raiz quadrada comprime
  // essa diferença visualmente (sem "mentir": quem tem mais horas continua
  // maior no gráfico), deixando as categorias menores legíveis. Os valores
  // exibidos nos rótulos e no tooltip continuam sendo os reais.
  const plottedValues = realValues.map(hours => Math.sqrt(hours));

  const chartData = {
    labels: orderedCategories.map(key => CATEGORY_MAP[key] || key),
    datasets: [{
      label: hasRealData ? 'Horas de Estudo' : 'Horas de Estudo (Exemplo)',
      data: plottedValues,
      backgroundColor: 'rgba(59, 130, 246, 0.15)', // gold-500 translúcido
      borderColor: '#3b82f6', // gold-500
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#3b82f6',
      pointRadius: 3,
      pointHoverRadius: 6,
      fill: true,
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { display: true, color: gridColor, lineWidth: 1 },
        grid: { circular: false, color: gridColor },
        suggestedMin: 0,
        ticks: {
          display: false,
        },
        pointLabels: {
          display: true,
          color: chartTextColor,
          font: { size: 11, weight: '600' as const },
        },
      },
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#334155',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context: any) => formatTimeLabel(realValues[context.dataIndex] ?? 0),
        },
      },
      datalabels: {
        display: (context: any) => (realValues[context.dataIndex] ?? 0) > 0,
        formatter: (_value: number, context: any) => formatTimeLabel(realValues[context.dataIndex] ?? 0),
        color: '#ffffff',
        backgroundColor: '#3b82f6', // gold-500
        borderRadius: 4,
        padding: { top: 3, bottom: 3, left: 6, right: 6 },
        font: {
          weight: 'bold' as const,
          size: 12,
        },
      },
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Radar data={chartData} options={chartOptions as any} plugins={[ChartDataLabels]} />
    </div>
  );
};

export default CategoryHoursChart;
