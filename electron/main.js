const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const http = require("http");
const next = require("next");


let server;
let mainWindow;

// A URL que o Electron vai carregar. Em dev, será http://localhost:3000.
// Em produção, será o arquivo do build.
const startURL = process.env.ELECTRON_START_URL || "http://localhost:3000";
const isDev = !!process.env.ELECTRON_START_URL;
const UPDATE_VERSION_URL = process.env.STUDY_UPDATE_VERSION_URL || 'https://study-page.vercel.app/api/version';
const UPDATE_PAGE_URL = 'https://study-page.vercel.app/';

// --- LÓGICA DO TIMER NO PROCESSO PRINCIPAL ---
let timerState = {
  startTime: 0,
  elapsedTime: 0,
  isRunning: false,
  intervalId: null,
};

function sendTick() {
  if (timerState.isRunning && mainWindow) {
    const now = Date.now();
    const currentElapsed = timerState.elapsedTime + (now - timerState.startTime);
    mainWindow.webContents.send('timer-tick', currentElapsed);
  }
}

ipcMain.on('timer-command', (event, command) => {
  const now = Date.now();
  switch (command) {
    case 'start':
      if (!timerState.isRunning) {
        timerState.startTime = now;
        timerState.isRunning = true;
        timerState.intervalId = setInterval(sendTick, 1000);
      }
      break;
    case 'pause':
      if (timerState.isRunning) {
        timerState.elapsedTime += now - timerState.startTime;
        timerState.isRunning = false;
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
      }
      break;
    case 'reset':
      timerState.isRunning = false;
      timerState.elapsedTime = 0;
      timerState.startTime = 0;
      if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
      }
      // Envia um último tick para zerar a UI
      if (mainWindow) {
        mainWindow.webContents.send('timer-tick', 0);
      }
      break;
    case 'get-state':
      // Quando a UI pede o estado, envia o tempo atual
      sendTick();
      break;
  }
});

ipcMain.on('update-titlebar-color', (event, colors) => {
  if (mainWindow) {
    mainWindow.setTitleBarOverlay({
      color: colors.background,
      symbolColor: colors.symbols
    });
  }
});
// --- FIM DA LÓGICA DO TIMER ---

async function ensureDataDir(dataDir) {
  await fsp.mkdir(dataDir, { recursive: true });
  const bundledData = path.join(process.resourcesPath, "data");
  try {
    const files = await fsp.readdir(bundledData);
    for (const f of files) {
      const src = path.join(bundledData, f);
      const dest = path.join(dataDir, f);
      try {
        await fsp.access(dest);
      } catch {
        await fsp.copyFile(src, dest);
      }
    }
  } catch {
    // Nenhum dado inicial
  }
}

async function startNextServer() {
  const dir = path.resolve(__dirname, "..");
  const nextApp = next({ dev: false, dir }); // Sempre 'false' aqui, pois só roda em produção
  await nextApp.prepare();

  const handler = nextApp.getRequestHandler();
  server = http.createServer((req, res) => handler(req, res));

  return new Promise((resolve) => {
    server.listen(3000, () => {
      console.log("Next.js em produção rodando em http://localhost:3000");
      resolve();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // só mostra depois de maximizar, evita "pulo" visual na tela
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js') // Adiciona o preload script
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#3b82f6', // Cor da sidebar no modo claro
      symbolColor: '#FFFFFF' // Cor dos ícones (maximizar, fechar, etc)
    }
  });

  mainWindow.loadURL(startURL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize(); // Abre como janela maximizada (com bordas/controles), não em tela cheia
    mainWindow.show();
  });

  mainWindow.on("close", (e) => {
    if (mainWindow) {
      e.preventDefault();
      mainWindow.webContents.send('app-closing');
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('get-default-backup-path', async () => {
  const defaultPath = path.join(app.getPath("userData"), "backups");
  if (!fs.existsSync(defaultPath)) {
    await fsp.mkdir(defaultPath, { recursive: true });
  }
  return defaultPath;
});

ipcMain.handle('save-backup', async (event, { data, folderPath, fileName }) => {
  try {
    if (!fs.existsSync(folderPath)) {
      await fsp.mkdir(folderPath, { recursive: true });
    }
    const filePath = path.join(folderPath, fileName);
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving backup:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-backups', async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) return [];
    const files = await fsp.readdir(folderPath);
    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(folderPath, f),
        mtime: fs.statSync(path.join(folderPath, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    return backupFiles;
  } catch (error) {
    console.error('Error getting backups:', error);
    return [];
  }
});

ipcMain.handle('delete-backup', async (event, filePath) => {
  try {
    await fsp.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting backup:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('backup-complete', () => {
  mainWindow = null;
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.on('start-update-download', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    if (result?.updateInfo?.version && compareVersions(result.updateInfo.version, app.getVersion()) > 0) {
      await autoUpdater.downloadUpdate();
    } else if (mainWindow) {
      mainWindow.webContents.send('update-error', 'A versão publicada ainda não está disponível para download.');
    }
  } catch (error) {
    console.error('Erro ao iniciar download da atualização:', error);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', 'Não foi possível baixar a atualização agora.');
    }
  }
});
ipcMain.on('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

function parseVersion(version) {
  const match = String(version || '').trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3] || 0)] : null;
}

function compareVersions(a, b) {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);
  if (!parsedA || !parsedB) return 0;
  for (let index = 0; index < parsedA.length; index += 1) {
    if (parsedA[index] !== parsedB[index]) return parsedA[index] > parsedB[index] ? 1 : -1;
  }
  return 0;
}

let lastNotifiedRemoteVersion = null;

async function fetchPublishedVersion() {
  try {
    const response = await fetch(`${UPDATE_VERSION_URL}?t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) {
      const published = await response.json();
      if (published?.version) return String(published.version).trim();
    }
  } catch (error) {
    console.warn('Endpoint de versão indisponível; tentando a página pública:', error.message);
  }

  const pageResponse = await fetch(`${UPDATE_PAGE_URL}?t=${Date.now()}`, {
    headers: { Accept: 'text/html' },
    signal: AbortSignal.timeout(10000),
  });
  if (!pageResponse.ok) throw new Error(`HTTP ${pageResponse.status}`);

  const pageHtml = await pageResponse.text();
  const versionMatch = pageHtml.match(/v(\d+\.\d+(?:\.\d+)?)\s+dispon[ií]vel\s+para\s+Windows/i);
  return versionMatch?.[1] || null;
}

async function checkPublishedVersion() {
  if (!app.isPackaged || !mainWindow) return;

  try {
    const remoteVersion = await fetchPublishedVersion();
    if (
      remoteVersion &&
      compareVersions(remoteVersion, app.getVersion()) > 0 &&
      remoteVersion !== lastNotifiedRemoteVersion
    ) {
      lastNotifiedRemoteVersion = remoteVersion;
      mainWindow.webContents.send('update-available', remoteVersion);
    }
  } catch (error) {
    console.error('Erro ao consultar a versão publicada:', error);
  }
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded', info.version);
  });
  autoUpdater.on('error', (err) => {
    console.error('Erro no atualizador:', err);
    if (mainWindow) mainWindow.webContents.send('update-error', 'Não foi possível verificar ou baixar a atualização.');
  });
}

app.whenReady().then(async () => {
  const dataDir = path.join(app.getPath("userData"), "data");
  process.env.DATA_DIR = dataDir;
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "development_secret";
  }

  await ensureDataDir(dataDir);

  // Apenas inicia o servidor se NÃO estiver em modo de desenvolvimento
  if (!isDev) {
    await startNextServer();
  }

  // Remove o menu da aplicação
  // Configura o menu da aplicação para permitir o F5
  const menu = Menu.buildFromTemplate([
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'F5',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CommandOrControl+Shift+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);


    createWindow();
  if (app.isPackaged) {
    setupAutoUpdater();
    setTimeout(checkPublishedVersion, 3000);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (server) server.close();
    app.quit();
  }
});
