'use client';

import React, { useEffect, useState } from 'react';
import { FaSyncAlt } from 'react-icons/fa';

export default function AppVersionFooter() {
  const [version, setVersion] = useState<string>('');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) {
      // Fora do Electron (ex: navegador em dev), usa a versão embutida no build.
      setVersion(process.env.NEXT_PUBLIC_APP_VERSION || '');
      return;
    }

    api.getAppVersion?.().then(v => setVersion(v)).catch(() => {});
    api.onUpdateAvailable?.((v) => setUpdateVersion(v));
    api.onUpdateDownloaded?.((v) => {
      setUpdateVersion(v);
      setUpdateReady(true);
    });
  }, []);

  const handleInstallClick = () => {
    if (updateReady) {
      window.electronAPI?.quitAndInstall?.();
    }
  };

  return (
    <>
      {updateVersion && (
        <div
          onClick={handleInstallClick}
          className={`fixed bottom-6 left-0 right-0 z-40 text-center text-xs py-1.5 text-white transition-colors ${
            updateReady ? 'bg-green-600 hover:bg-green-500 cursor-pointer' : 'bg-gray-600'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <FaSyncAlt className={updateReady ? '' : 'animate-spin'} size={11} />
            {updateReady
              ? `Versão ${updateVersion} disponível. Clique aqui para reiniciar e instalar.`
              : `Baixando versão ${updateVersion}...`}
          </span>
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
