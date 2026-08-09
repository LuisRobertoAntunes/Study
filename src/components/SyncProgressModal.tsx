'use client';

import React, { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { getTopicSyncPreview, syncPlanProgress, UnmatchedTopic, SyncScope } from '../app/actions';
import { useNotification } from '../context/NotificationContext';

interface PlanOption {
  fileName: string;
  name: string;
}

interface SyncProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: PlanOption; // plano a partir do qual o botão foi clicado (destino)
  otherPlans: PlanOption[]; // demais planos disponíveis como origem
  onSynced?: () => void; // recarrega os dados do plano depois de sincronizar
}

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
  <label className="flex items-start gap-3 cursor-pointer py-1.5">
    <div className="relative mt-0.5 flex-shrink-0">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-gold-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
    </div>
    <span>
      <span className="block text-gray-700 dark:text-gray-200 font-medium">{label}</span>
      {description && <span className="block text-xs text-gray-500 dark:text-gray-400">{description}</span>}
    </span>
  </label>
);

const SyncProgressModal: React.FC<SyncProgressModalProps> = ({ isOpen, onClose, targetPlan, otherPlans, onSynced }) => {
  const { showNotification } = useNotification();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [scope, setScope] = useState<Set<Exclude<SyncScope, 'all'>>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSources([]);
      setScope(new Set());
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSource = (fileName: string) => {
    setSelectedSources(prev => prev.includes(fileName) ? prev.filter(f => f !== fileName) : [...prev, fileName]);
  };

  const toggleScope = (s: Exclude<SyncScope, 'all'>) => {
    setScope(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const effectiveScope = (): SyncScope => {
    if (scope.has('topics') && scope.has('questions') && scope.has('hours')) return 'all';
    if (scope.has('hours')) return 'hours';
    if (scope.has('questions')) return 'questions';
    return 'topics';
  };

  const handleSync = async () => {
    if (selectedSources.length === 0 || scope.size === 0) return;
    setLoading(true);
    try {
      const finalScope = effectiveScope();
      let syncedTopics = 0;
      const unmatched: (UnmatchedTopic & { planName: string })[] = [];

      for (const fileName of selectedSources) {
        const planName = otherPlans.find(p => p.fileName === fileName)?.name || fileName;
        const preview = await getTopicSyncPreview(fileName, targetPlan.fileName);
        if (!preview.success) {
          showNotification(`Erro ao comparar com "${planName}": ${preview.error}`, 'error');
          continue;
        }

        preview.unmatchedSource.forEach(u => unmatched.push({ ...u, planName }));

        if (preview.matched.length === 0) continue;
        const pairs = preview.matched.map(m => ({
          sourceSubjectId: m.sourceSubjectId,
          sourceTopicText: m.sourceTopicText,
          targetSubjectId: m.targetSubjectId,
          targetSubjectName: m.targetSubjectName,
          targetTopicText: m.targetTopicText,
          targetTopicId: m.targetTopicId,
        }));
        const res = await syncPlanProgress(fileName, targetPlan.fileName, pairs, finalScope);
        if (res.success) {
          syncedTopics += res.syncedTopics;
        } else {
          showNotification(`Erro ao sincronizar "${planName}": ${res.error}`, 'error');
        }
      }

      let message = `${syncedTopics} tópico(s) sincronizado(s) com sucesso.`;
      if (unmatched.length > 0) {
        message += ` ${unmatched.length} não encontrado(s) em ${targetPlan.name} (nome pode ter mudado ou tópico não existe nesse edital).`;
      }
      showNotification(message, 'success');
      onSynced?.();
      onClose();
    } catch (e) {
      showNotification('Erro ao sincronizar o progresso.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center">Sincronizar Aproveitamento</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 mb-6">
          Traga o progresso de outro plano para <strong>{targetPlan.name}</strong>
        </p>

        <label className="block text-sm font-bold text-gold-800 dark:text-gold-300 mb-2">
          PLANO DE ORIGEM
        </label>
        {otherPlans.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Você não tem outros planos para sincronizar.</p>
        ) : (
          <div className="mb-6 divide-y divide-gray-100 dark:divide-gray-700">
            {otherPlans.map(p => (
              <Toggle key={p.fileName} checked={selectedSources.includes(p.fileName)} onChange={() => toggleSource(p.fileName)} label={p.name} />
            ))}
          </div>
        )}

        <label className="block text-sm font-bold text-gold-800 dark:text-gold-300 mb-2">
          O QUE SINCRONIZAR
        </label>
        <div className="mb-2 divide-y divide-gray-100 dark:divide-gray-700">
          <Toggle checked={scope.has('topics')} onChange={() => toggleScope('topics')} label="Tópicos concluídos" description="Marca os tópicos como estudados." />
          <Toggle checked={scope.has('questions')} onChange={() => toggleScope('questions')} label="Questões" description="Traz o total de acertos por tópico." />
          <Toggle checked={scope.has('hours')} onChange={() => toggleScope('hours')} label="Horas estudadas" description="Traz o histórico de sessões: datas, aulas e tempo." />
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSync}
            disabled={selectedSources.length === 0 || scope.size === 0 || loading}
            className="px-6 py-2 bg-gold-500 text-white font-semibold rounded-lg hover:bg-gold-600 transition-colors dark:bg-gold-600 dark:hover:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <FaSpinner className="animate-spin" size={14} />} Sincronizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncProgressModal;
