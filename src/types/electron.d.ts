export interface IElectronAPI {
  sendTimerCommand: (command: string) => void;
  onTimerTick: (callback: (elapsedTime: number) => void) => void;
  removeTimerTickListeners: () => void;
  updateTitlebarColor: (colors: { background: string; symbols: string }) => void;
  selectFolder: () => Promise<string | null>;
  saveBackup: (data: any, folderPath: string, fileName: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  getBackups: (folderPath: string) => Promise<{ name: string; path: string; mtime: Date }[]>;
  deleteBackup: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  onAppClosing: (callback: () => void) => void;
  sendBackupComplete: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
