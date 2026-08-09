'use client';

import React, { useEffect, useState } from 'react';
import { FaSyncAlt } from 'react-icons/fa';

declare global {
  interface Window {
    electronAPI?: {
      getAppVersion?: () => Promise<string>;
      onUpdateAvailable?: (callback: (version: string) => void) => void;
      onUpdateDownloaded?: (callback: (version: string) => void) => void;
      quitAndInstall?: () => void;
      [key: string]: any;
    };
  }
}

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
          className={`fixed bottom-0 left-0 right-0 z-40 text-center text-xs py-1.5 text-white transition-colors ${
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

      {version && (
        <div className="fixed bottom-1 right-2 z-30 text-[11px] text-gray-400 dark:text-gray-500 select-none pointer-events-none">
          v{version}
        </div>
      )}
    </>
  );
}
