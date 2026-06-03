// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendTimerCommand: (command) => ipcRenderer.send('timer-command', command),
  onTimerTick: (callback) => ipcRenderer.on('timer-tick', (event, ...args) => callback(...args)),
  removeTimerTickListeners: () => ipcRenderer.removeAllListeners('timer-tick'),
  updateTitlebarColor: (colors) => ipcRenderer.send('update-titlebar-color', colors),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveBackup: (data, folderPath, fileName) => ipcRenderer.invoke('save-backup', { data, folderPath, fileName }),
  getBackups: (folderPath) => ipcRenderer.invoke('get-backups', folderPath),
  deleteBackup: (filePath) => ipcRenderer.invoke('delete-backup', filePath),
  onAppClosing: (callback) => ipcRenderer.on('app-closing', callback),
  sendBackupComplete: () => ipcRenderer.send('backup-complete'),
});
