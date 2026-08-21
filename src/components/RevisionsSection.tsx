'use client';

import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';

const RevisionsSection = () => {
  const { reviewRecords, updateReviewRecord } = useData();

  const todaysReviewRecords = useMemo(() => {
    const getRecordCreationTime = (id: string) => {
      const timestamp = Number(String(id || '').split('-')[0]);
      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    return reviewRecords
      .filter(record => !record.completedDate && !record.ignored)
      .sort((a, b) => {
        const [aYear, aMonth, aDay] = a.scheduledDate.split('-').map(Number);
        const dateA = new Date(Date.UTC(aYear, aMonth - 1, aDay));
        const [bYear, bMonth, bDay] = b.scheduledDate.split('-').map(Number);
        const dateB = new Date(Date.UTC(bYear, bMonth - 1, bDay));
        const dateDifference = dateA.getTime() - dateB.getTime();
        if (dateDifference !== 0) return dateDifference;

        // Quando várias revisões vencem no mesmo dia, segue a ordem em que
        // as aulas foram registradas: a mais antiga deve ser executada antes.
        return getRecordCreationTime(a.studyRecordId) - getRecordCreationTime(b.studyRecordId);
      })
      .slice(0, 3);
  }, [reviewRecords]);

  const handleCompleteReview = (id: string) => {
    const recordToUpdate = reviewRecords.find(record => record.id === id);
    if (recordToUpdate) {
      updateReviewRecord({ ...recordToUpdate, completedDate: new Date().toISOString().split('T')[0], ignored: false });
    }
  };

  const handleIgnoreReview = (id: string) => {
    const recordToUpdate = reviewRecords.find(record => record.id === id);
    if (recordToUpdate) {
      updateReviewRecord({ ...recordToUpdate, ignored: true, completedDate: undefined });
    }
  };
  
  const getDaysDifference = (scheduledDate: string) => {
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const [sYear, sMonth, sDay] = scheduledDate.split('-').map(Number);
    const scheduledDateUtc = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    return Math.round((scheduledDateUtc.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Próximas Revisões</h2>
      <div className="flex-grow overflow-y-auto -mr-3 pr-3">
        {todaysReviewRecords.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center mt-8">Nenhuma revisão pendente.</p>
        ) : (
          <div className="space-y-4">
            {todaysReviewRecords.map((record) => {
              const daysUntil = getDaysDifference(record.scheduledDate);
              const isOverdue = daysUntil < 0;

              return (
                <div key={record.id} className="bg-gray-50 dark:bg-gray-700 border-l-4 border-gold-500 dark:border-gold-600 rounded-r-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{record.subject}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{record.topic}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCompleteReview(record.id)}
                        title="Marcar como concluída"
                        className="p-2 rounded-full bg-gold-100 dark:bg-gold-900/50 hover:bg-gold-200 text-gold-700 dark:text-gold-300 transition-colors"
                      >
                        <BsCheckCircleFill />
                      </button>
                      <button
                        onClick={() => handleIgnoreReview(record.id)}
                        title="Ignorar por agora"
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 text-gray-600 dark:text-gray-200 transition-colors"
                      >
                        <BsXCircleFill />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className={`text-sm font-semibold ${isOverdue ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                      {isOverdue
                        ? `Atrasada em ${Math.abs(daysUntil)} dia(s)`
                        : daysUntil === 0
                          ? 'Revisar hoje'
                          : `Revisar em ${daysUntil} dia(s)`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionsSection;
