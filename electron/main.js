import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compressData = (data) => {
  const jsonString = JSON.stringify(data);
  return zlib.gzipSync(jsonString);
};

const decompressData = (buffer) => {
  const jsonString = zlib.gunzipSync(buffer).toString('utf8');
  return JSON.parse(jsonString);
};

const storageDir = path.join(process.cwd(), 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storagePath = path.join(storageDir, 'local.json.gz');

const store = {
  get: (key) => {
    try {
      if (fs.existsSync(storagePath)) {
        const buffer = fs.readFileSync(storagePath);
        const data = decompressData(buffer);
        return data[key];
      }
      return null;
    } catch (error) {
      console.error('[Main Process] Error reading:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      let data = {};
      if (fs.existsSync(storagePath)) {
        const buffer = fs.readFileSync(storagePath);
        data = decompressData(buffer);
      }
      data[key] = value;
      const compressedData = compressData(data);
      fs.writeFileSync(storagePath, compressedData);
    } catch (error) {
      console.error('[Main Process] Error writing:', error);
    }
  },
  delete: (key) => {
    try {
      if (fs.existsSync(storagePath)) {
        const buffer = fs.readFileSync(storagePath);
        const data = decompressData(buffer);
        delete data[key];
        const compressedData = compressData(data);
        fs.writeFileSync(storagePath, compressedData);
      }
    } catch (error) {
      console.error('[Main Process] Error deleting:', error);
    }
  },
  clear: () => {
    try {
      if (fs.existsSync(storagePath)) {
        const emptyData = compressData({});
        fs.writeFileSync(storagePath, emptyData);
      }
    } catch (error) {
      console.error('[Main Process] Error clearing:', error);
    }
  }
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (app.isPackaged) {
    let indexPath = path.join(__dirname, 'dist/index.html');
    console.log('Loading from:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    console.log('__dirname:', __dirname);
    win.loadFile(indexPath);
  } else {
    win.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('storage:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('storage:set', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('storage:remove', (event, key) => {
  store.delete(key);
});

ipcMain.handle('storage:clear', () => {
  store.clear();
});
