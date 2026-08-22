'use client';

import React, { useEffect, useState } from 'react';
import { FaSyncAlt, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

export default function AppVersionFooter() {
  const [version, setVersion] = useState<string>('');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) {
      // Fora do Electron (ex: navegador em dev), usa a versão embutida no build.
      setVersion(process.env.NEXT_PUBLIC_APP_VERSION || '');
      return;
    }

    api.getAppVersion?.().then(v => setVersion(v)).catch(() => {});
    api.onUpdateAvailable?.((v) => {
      setUpdateVersion(v);
      setUpdateReady(false);
      setIsDownloading(false);
      setUpdateError(null);
      setIsUpdateModalOpen(true);
    });
    api.onUpdateDownloaded?.((v) => {
      setUpdateVersion(v);
      setIsDownloading(false);
      setUpdateReady(true);
      setUpdateError(null);
    });
    api.onUpdateError?.((message) => {
      setIsDownloading(false);
      setUpdateError(message);
    });
  }, []);

  const handleDownloadClick = () => {
    if (updateVersion && !isDownloading && !updateReady) {
      setIsDownloading(true);
      setUpdateError(null);
      window.electronAPI?.startUpdateDownload?.();
    }
  };

  const handleInstallClick = () => {
    if (updateReady) {
      window.electronAPI?.quitAndInstall?.();
    }
  };

  const handleDismissUpdate = () => {
    setIsUpdateModalOpen(false);
  };

  return (
    <>
      {updateVersion && isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 sm:h-10 sm:w-10">
                  <FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-4 w-full text-left">
                  <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-gray-100">
                    Deseja Atualizar?
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {updateError || `Uma nova atualização está disponível: v${updateVersion}`}
                  </p>
                </div>
                <button
                  onClick={handleDismissUpdate}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label="Fechar"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 rounded-b-lg bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex-row sm:justify-end sm:px-6">
              {!updateReady && !isDownloading && (
                <button
                  type="button"
                  onClick={handleDismissUpdate}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              )}
              {isDownloading && (
                <span className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-200">
                  <FaSyncAlt className="animate-spin" size={12} /> Baixando...
                </span>
              )}
              {updateReady ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                >
                  Reiniciar e instalar
                </button>
              ) : !isDownloading && (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barra de status fixa no rodapé, no mesmo esquema de cor da sidebar (bg-gold-500 / dark:bg-gray-800) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 h-6 flex items-center justify-between px-3 text-[11px] bg-gold-500 dark:bg-gray-800 text-white/80 border-t border-white/10 dark:border-gray-700 select-none">
        <span>Estudei</span>
        {version && <span>v{version}</span>}
      </div>
    </>
  );
}
