const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { app } = require("electron");

function getSettingsPath() {
  return path.join(
    app.getPath("userData"),
    "backup-settings.json"
  );
}

module.exports = {
  getSettingsPath
};

const DEFAULT_SETTINGS = {
  enabled: false,
  backupOnClose: true,
  intervalHours: 5,
  backupPath: "",
  maxBackups: 20
};

async function loadSettings() {
  try {
    const data = await fsp.readFile(
      getSettingsPath(),
      "utf8"
    );

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(data)
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings) {
  await fsp.writeFile(
    getSettingsPath(),
    JSON.stringify(settings, null, 2)
  );
}

module.exports = {
  loadSettings,
  saveSettings
};