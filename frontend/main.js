const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const serve = require('electron-serve').default;

const loadURL = serve({ directory: 'out' });

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    show: false, // Don't show until ready
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // electron-serve handles the routing and asset loading cleanly
    loadURL(mainWindow);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startPythonBackend() {
  // Path to the bundled executable
  let apiPath;
  if (app.isPackaged) {
    apiPath = path.join(process.resourcesPath, 'api-bin', 'quantstrike-api.exe');
  } else {
    apiPath = path.join(__dirname, 'api-bin', 'quantstrike-api.exe');
  }

  if (fs.existsSync(apiPath)) {
    console.log('Starting Python backend from:', apiPath);
    pythonProcess = spawn(apiPath, [], {
      detached: false
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });
  } else {
    console.warn('Python backend executable not found at:', apiPath);
  }
}

app.on('ready', () => {
  startPythonBackend();
  
  // Give the backend a second to start before opening the UI
  setTimeout(() => {
    createWindow();
  }, 2000);
});

app.on('window-all-closed', function () {
  if (pythonProcess) {
    console.log('Killing Python backend...');
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
