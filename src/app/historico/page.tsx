'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useData, StudyRecord } from '../../context/DataContext';
import { BsPlusCircleFill, BsFunnel, BsPencilSquare, BsTrash, BsChatTextFill } from 'react-icons/bs';
import StudyRegisterModal from '../../components/StudyRegisterModal';
import FilterModal from '../../components/FilterModal';
import PlanSelector from '../../components/PlanSelector';
import ConfirmationModal from '../../components/ConfirmationModal'; // Importando o novo modal

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  color: string;
}

// Helper para formatar o tempo de milissegundos para HH:MM:SS
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Mapa para exibir nomes de categorias mais amigáveis
const categoryDisplayMap: { [key: string]: string } = {
  teoria: 'Teoria',
  revisao: 'Revisão',
  questoes: 'Questões',
  leitura_lei: 'Leitura de Lei',
  jurisprudencia: 'Jurisprudência',
};

// Mapa reverso para converter rótulos exibidos para valores internos
const categoryReverseMap: { [key: string]: string } = {
  'Teoria': 'teoria',
  'Revisão': 'revisao',
  'Questões': 'questoes',
  'Leitura de Lei': 'leitura_lei',
  'Jurisprudência': 'jurisprudencia',
};

interface Filters {
  subjects: string[]; // Alterado para array para compatibilidade com FilterModal
  categories: string[]; // Alterado para array para compatibilidade com FilterModal
  startDate: Date | null;
  endDate: Date | null;
  minDuration?: number;
  maxDuration?: number;
  minPerformance?: number;
  maxPerformance?: number;
  topics: string[];
}

const HistoricoPage = () => {
  // Acessando dados e funções do context
  const {
    studyRecords,
    addStudyRecord,
    updateStudyRecord,
    deleteStudyRecord,
    availablePlans,
    selectedDataFile,
    setSelectedDataFile,
    studyPlans, // Adicionado para acessar as cores
    stats,
  } = useData();

  // Estado para controle dos modais
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Estado para o modal de confirmação
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null); // Estado para o ID do registro a ser excluído
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Estado para os filtros - CORRIGIDO para aceitar arrays e datas
  const [filters, setFilters] = useState<Filters>({
    subjects: [],
    categories: [],
    startDate: null,
    endDate: null,
    minDuration: undefined,
    maxDuration: undefined,
    minPerformance: undefined,
    maxPerformance: undefined,
    topics: [],
  });

  // Cria um mapa de matérias para cores para fácil acesso
  const subjectColorMap = useMemo(() => {
    const colorMap = new Map<string, string>();
    if (studyPlans) {
      studyPlans.forEach(plan => {
        if (plan.subjects) {
          plan.subjects.forEach(subject => {
            if (!colorMap.has(subject.subject)) {
              colorMap.set(subject.subject, subject.color || '#94A3B8'); // Cor padrão
            }
          });
        }
      });
    }
    return colorMap;
  }, [studyPlans]);

  const allStudyRecords = useMemo(() => {
    return studyRecords;
  }, [studyRecords]);

  // Aplica os filtros aos registros de estudo - CORRIGIDO para trabalhar com arrays
  const filteredRecords = useMemo(() => {
    return allStudyRecords.filter(record => {
      const recordDate = new Date(record.date);

      // Filtro de data de início
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (recordDate < startDate) return false;
      }

      // Filtro de data de fim
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (recordDate > endDate) return false;
      }

      // Filtro de disciplinas (array)
      if (filters.subjects.length > 0 && !filters.subjects.includes(record.subject)) {
        return false;
      }

      // Filtro de categorias (array) - CORRIGIDO: compara com valores internos
      if (filters.categories.length > 0) {
        // Converte os rótulos exibidos para valores internos
        const internalCategories = filters.categories.map(cat => categoryReverseMap[cat] || cat);
        if (!internalCategories.includes(record.category)) {
          return false;
        }
      }

      // Filtro de tópicos (array)
      if (filters.topics.length > 0 && !filters.topics.includes(record.topic)) {
        return false;
      }

      // Filtro de duração mínima (em minutos)
      if (filters.minDuration !== undefined) {
        const durationInMinutes = record.studyTime / 60000; // Converte ms para minutos
        if (durationInMinutes < filters.minDuration) return false;
      }

      // Filtro de duração máxima (em minutos)
      if (filters.maxDuration !== undefined) {
        const durationInMinutes = record.studyTime / 60000; // Converte ms para minutos
        if (durationInMinutes > filters.maxDuration) return false;
      }

      // Filtro de desempenho mínimo (em percentual)
      if (filters.minPerformance !== undefined && record.questions) {
        const performance = (record.questions.correct / record.questions.total) * 100;
        if (performance < filters.minPerformance) return false;
      }

      // Filtro de desempenho máximo (em percentual)
      if (filters.maxPerformance !== undefined && record.questions) {
        const performance = (record.questions.correct / record.questions.total) * 100;
        if (performance > filters.maxPerformance) return false;
      }

      return true;
    });
  }, [studyRecords, filters]);

  // Agrupa os registros filtrados por data
  const groupedRecords = useMemo(() => {
    return filteredRecords.reduce((acc, record) => {
      const date = new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {} as Record<string, StudyRecord[]>);
  }, [filteredRecords]);

  const sortedDates = useMemo(() => 
    Object.keys(groupedRecords).sort((a, b) => 
      new Date(b.split('/').reverse().join('-')).getTime() - 
      new Date(a.split('/').reverse().join('-')).getTime()
    ), [groupedRecords]);

  // Handlers para abrir modais
  const handleAddClick = () => {
    setEditingRecord(null);
    setIsRegisterModalOpen(true);
  };

  const handleEditClick = (record: StudyRecord) => {
    setEditingRecord(record);
    setIsRegisterModalOpen(true);
  };

  // Abre o modal de confirmação
  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id);
    setIsConfirmModalOpen(true);
  };

  // Confirma e executa a exclusão
  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteStudyRecord(recordToDelete);
      setRecordToDelete(null);
      setIsConfirmModalOpen(false); // Fecha o modal após a exclusão
    }
  };

  const handleSave = (record: StudyRecord) => {
    if (editingRecord) {
      updateStudyRecord(record);
    } else {
      addStudyRecord(record);
    }
    setIsRegisterModalOpen(false);
  };

  // CORRIGIDO: Função para aplicar filtros recebidos do FilterModal
  const handleApplyFilters = (newFilters: any) => {
    // Converte os dados recebidos do FilterModal para o formato esperado
    const convertedFilters: Filters = {
      subjects: newFilters.subjects || [],
      categories: newFilters.categories || [], // Já vem em rótulos exibidos
      startDate: newFilters.startDate || null,
      endDate: newFilters.endDate || null,
      minDuration: newFilters.minDuration,
      maxDuration: newFilters.maxDuration,
      minPerformance: newFilters.minPerformance,
      maxPerformance: newFilters.maxPerformance,
      topics: newFilters.topics || [],
    };
    setFilters(convertedFilters);
    setIsFilterModalOpen(false);
  };

  // Função para limpar filtros
  const handleClearFilters = () => {
    setFilters({
      subjects: [],
      categories: [],
      startDate: null,
      endDate: null,
      minDuration: undefined,
      maxDuration: undefined,
      minPerformance: undefined,
      maxPerformance: undefined,
      topics: [],
    });
  };
  
  const availableSubjects = useMemo(() => {
    if (stats && stats.editalData) {
      return stats.editalData.map(s => s.subject);
    }
    return [];
  }, [stats]);

  // Verifica se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.subjects.length > 0 ||
      filters.categories.length > 0 ||
      filters.startDate !== null ||
      filters.endDate !== null ||
      filters.minDuration !== undefined ||
      filters.maxDuration !== undefined ||
      filters.minPerformance !== undefined ||
      filters.maxPerformance !== undefined ||
      filters.topics.length > 0
    );
  }, [filters]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pt-12">
        {/* Cabeçalho */}
        <div className="mb-6">
        <header className="flex justify-between items-center pt-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Histórico de Estudos</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddClick}
              className="flex items-center px-4 py-2 bg-gold-500 text-white rounded-full shadow-lg hover:bg-gold-600 transition-all duration-300 text-base font-semibold"
            >
              <BsPlusCircleFill className="mr-2 text-lg" />
              Adicionar Estudo
            </button>
            
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center px-4 py-2 rounded-full shadow-lg transition-all duration-300 text-base font-semibold ${
                hasActiveFilters
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gold-500 hover:bg-gold-600 text-white'
              }`}
            >
              <BsFunnel className="mr-2" />
              Filtros {hasActiveFilters && `(${Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length})`}
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 text-base font-semibold"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </header>
        <hr className="mt-2 mb-6 border-gray-300 dark:border-gray-700" />
      </div>

        {/* Conteúdo Principal */}
        <main>
          {sortedDates.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                {hasActiveFilters
                  ? "Nenhum registro corresponde aos filtros aplicados."
                  : "Nenhum registro de estudo encontrado. Comece adicionando seu primeiro estudo!"}
              </p>
            </div>
          ) : (
            sortedDates.map(date => (
              <section key={date} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">{date}</h2>
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Matéria / Tópico</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tempo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Questões</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoria</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {groupedRecords[date].map((record, index) => (
                        <tr key={`${record.id}-${index}`}>
                          <td 
                            className="px-6 py-4"
                            style={{ borderLeft: `5px solid ${subjectColorMap.get(record.subject) || '#94A3B8'}` }}
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">{record.subject}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs whitespace-normal">{record.topic}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{formatTime(record.studyTime)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                            <span className="text-green-600 font-semibold">{record.questions?.correct || 0}</span> / <span className="text-red-600 font-semibold">{(record.questions?.total || 0) - (record.questions?.correct || 0)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.category === 'teoria' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : record.category === 'revisao' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                              {categoryDisplayMap[record.category] || record.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center space-x-4">
                              {record.notes && (
                                <div className="relative">
                                  <button
                                    onClick={() => setActiveCommentId(activeCommentId === record.id ? null : record.id)}
                                    title="Comentários"
                                    className="flex items-center justify-center p-3 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 transition-colors"
                                  >
                                    <BsChatTextFill className="text-lg" />
                                  </button>
                                  {activeCommentId === record.id && (
                                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-[100] p-4 text-left">
                                      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-normal">{record.notes}</p>
                                      <div className="absolute bottom-[-8px] right-4 w-4 h-4 bg-white dark:bg-gray-700 border-b border-r border-gray-300 dark:border-gray-600 rotate-45"></div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <button onClick={() => handleEditClick(record)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Editar">
                                <BsPencilSquare size={18} />
                              </button>
                              <button onClick={() => handleDeleteClick(record.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Excluir">
                                <BsTrash size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </main>
      </div>

      {/* Modais */}
      <StudyRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSave={handleSave}
        initialRecord={editingRecord}
        showDeleteButton={!!editingRecord?.id}
      />
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        availableSubjects={availableSubjects}
        availableCategories={Object.values(categoryDisplayMap)}
        initialFilters={filters}
        sessions={allStudyRecords}
        availableEditalData={stats.editalData}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este registro? Esta ação não poderá ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </>
  );
};

export default HistoricoPage;
