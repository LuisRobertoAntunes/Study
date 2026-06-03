'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaDownload, FaUpload, FaExclamationTriangle, FaSpinner, FaFolderOpen, FaHistory, FaCheck, FaTimes } from 'react-icons/fa';
import { useData } from '../../context/DataContext';
import DeleteAllDataModal from '../../components/DeleteAllDataModal';
import ImportConfirmationModal from '../../components/ImportConfirmationModal';
import { useNotification } from '../../context/NotificationContext';

interface BackupSettings {
  enabled: boolean;
  backupOnClose: boolean;
  interval: number;
  folderPath: string;
  maxBackups: number;
}

const BackupPage = () => {
  const { exportAllData, importAllData, clearAllData } = useData();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Configurações de Backup
  const [settings, setSettings] = useState<BackupSettings>({
    enabled: false,
    backupOnClose: false,
    interval: 5,
    folderPath: '',
    maxBackups: 20
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('backupSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = (newSettings: BackupSettings) => {
    setSettings(newSettings);
    localStorage.setItem('backupSettings', JSON.stringify(newSettings));
    showNotification('Configurações de backup salvas!', 'success');
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI) {
      const folderPath = await window.electronAPI.selectFolder();
      if (folderPath) {
        saveSettings({ ...settings, folderPath });
      }
    } else {
      showNotification('Seleção de pasta disponível apenas na versão Desktop.', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const date = new Date().toISOString().split('T')[0];
      link.download = `backup-study-completo-${date}.json`;
      link.click();
      showNotification('Backup exportado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Erro ao exportar dados.', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsImportModalOpen(true);
    }
  };

  const handleConfirmImport = () => {
    if (!selectedFile) return;

    setIsImportModalOpen(false);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Formato de arquivo inválido.');
        }
        const data = JSON.parse(text);
        await importAllData(data);
        showNotification('Dados importados com sucesso!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        console.error(err);
        showNotification('Erro ao importar arquivo.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(selectedFile);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAllData = async () => {
    setIsDeleteModalOpen(false);
    setIsLoading(true);
    try {
      await clearAllData();
      showNotification('Todos os dados foram apagados.', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      console.error(err);
      showNotification('Erro ao apagar dados.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-slate-200 flex items-center">
        <FaHistory className="mr-3 text-gold-500" />
        Backup e Restauração
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Painel de Backup Automático */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-slate-100 border-b pb-3 dark:border-slate-700">
            Backup Automático
          </h2>
          
          <div className="space-y-6">
            <label className="flex items-center cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={settings.enabled}
                  onChange={(e) => saveSettings({ ...settings, enabled: e.target.checked })}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.enabled ? 'bg-gold-500' : 'bg-gray-300 dark:bg-slate-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.enabled ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-3 text-gray-700 dark:text-slate-300 font-medium">Ativar backup automático</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={settings.backupOnClose}
                  onChange={(e) => saveSettings({ ...settings, backupOnClose: e.target.checked })}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.backupOnClose ? 'bg-gold-500' : 'bg-gray-300 dark:bg-slate-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.backupOnClose ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-3 text-gray-700 dark:text-slate-300 font-medium">Backup ao fechar</span>
            </label>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-600 dark:text-slate-400 mb-2">
                Intervalo
              </label>
              <select 
                value={settings.interval}
                onChange={(e) => saveSettings({ ...settings, interval: parseInt(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-gold-500 outline-none"
              >
                <option value={1}>1 hora</option>
                <option value={3}>3 horas</option>
                <option value={5}>5 horas</option>
                <option value={12}>12 horas</option>
                <option value={24}>24 horas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-slate-400 mb-2">
                Pasta dos Backups
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={settings.folderPath || 'Nenhuma pasta selecionada'}
                  className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-gray-500 dark:text-slate-400 italic"
                />
                <button 
                  onClick={handleSelectFolder}
                  className="bg-gold-500 hover:bg-gold-600 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center min-w-[44px]"
                  title="Alterar Pasta"
                >
                  <FaFolderOpen />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-slate-400 mb-2">
                Manter
              </label>
              <select 
                value={settings.maxBackups}
                onChange={(e) => saveSettings({ ...settings, maxBackups: parseInt(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-gold-500 outline-none"
              >
                <option value={5}>5 backups</option>
                <option value={10}>10 backups</option>
                <option value={20}>20 backups</option>
                <option value={50}>50 backups</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ações Manuais */}
        <div className="space-y-8">
          {/* Exportar/Importar */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-slate-100 border-b pb-3 dark:border-slate-700">
              Gerenciar Dados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleExport}
                className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
              >
                <FaDownload className="text-2xl text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-blue-700 dark:text-blue-300">Exportar Dados</span>
              </button>

              <button
                onClick={handleImportClick}
                className="flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
              >
                <FaUpload className="text-2xl text-green-600 dark:text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-green-700 dark:text-green-300">Importar Dados</span>
              </button>
            </div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileSelected}
              className="hidden"
            />
          </div>

          {/* Perigo */}
          <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
            <h2 className="text-xl font-bold mb-4 text-red-700 dark:text-red-400 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              Zona de Perigo
            </h2>
            <p className="text-sm text-red-600 dark:text-red-300/80 mb-6">
              Esta ação apagará permanentemente todos os seus dados. Recomendamos fazer um backup antes de prosseguir.
            </p>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 flex items-center justify-center"
            >
              {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaExclamationTriangle className="mr-2" />}
              Começar do Zero
            </button>
          </div>
        </div>
      </div>

      <DeleteAllDataModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleClearAllData}
      />
      <ImportConfirmationModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
};

export default BackupPage;
