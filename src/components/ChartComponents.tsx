'use client';

import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, TooltipItem, ArcElement, DoughnutController, Legend, Tooltip, CategoryScale } from 'chart.js';

// Registrando componentes do Chart.js
Chart.register(ArcElement, DoughnutController, Legend, Tooltip, CategoryScale);

const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart: any) {
    if (chart.config.options.elements && chart.config.options.elements.center) {
      const ctx = chart.ctx;
      const centerConfig = chart.config.options.elements.center;
      const txt = centerConfig.text;
      
      // Lógica dinâmica para cor baseada na classe 'dark' do HTML
      const isDark = document.documentElement.classList.contains('dark');
      const color = isDark ? '#e6e6e6' : '#111827'; // Branco no dark, cinza escuro no light

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
      const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

      ctx.font = `bold ${centerConfig.fontSize}px ${centerConfig.fontStyle}`;
      ctx.fillStyle = color;
      ctx.fillText(txt, centerX, centerY);
    }
  }
};

interface ChartComponentsProps {
  stats: {
    totalCorrectQuestions: number;
    totalQuestions: number;
  };
}

const ChartComponents: React.FC<ChartComponentsProps> = ({ stats }) => {
  const [chartJsLoaded, setChartJsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  

  useEffect(() => {
    setChartJsLoaded(true);
    
    // Observa mudanças na classe 'dark' para atualizar o gráfico quando o tema mudar
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  const doughnutData = {
    labels: ['Acertos', 'Erros'],
    datasets: [
      {
        data: [stats.totalCorrectQuestions, stats.totalQuestions - stats.totalCorrectQuestions],
        backgroundColor: ['#1e40af', '#e40000'],
        borderColor: ['#1e40af', '#e40000'],
      },
    ],
  };

  const correctPercentage = stats.totalQuestions > 0 
    ? ((stats.totalCorrectQuestions / stats.totalQuestions) * 100).toFixed(1) 
    : '0.0';

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      }
    },
    elements: {
      center: {
        text: `${correctPercentage}%`,
        fontStyle: 'Arial',
        fontSize: 24,
      }
    }
  };

  if (!chartJsLoaded) return <div className="flex items-center justify-center h-full">Carregando...</div>;

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* A key forçada garante a re-renderização ao trocar o tema */}
      <Doughnut 
        key={isDarkMode ? 'dark' : 'light'} 
        data={doughnutData} 
        options={doughnutOptions} 
        plugins={[centerTextPlugin]} 
      />
    </div>
  );
};

export default ChartComponents;