import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import zlib from 'zlib';

// 获取当前模块的目录路径（ES 模块方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 压缩数据
const compressData = (data) => {
  const jsonString = JSON.stringify(data);
  return zlib.gzipSync(jsonString);
};

// 解压数据
const decompressData = (buffer) => {
  const jsonString = zlib.gunzipSync(buffer).toString('utf8');
  return JSON.parse(jsonString);
};

// 确保存储目录存在（使用项目根目录下的 storage 文件夹，与 localStorageService.ts 保持一致）
const storageDir = path.join(process.cwd(), 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
  console.log('Created storage directory:', storageDir);
}

// 存储文件路径
const storagePath = path.join(storageDir, 'local.json.gz');
console.log('Storage file path:', storagePath);

// 简单的存储实现
const store = {
  get: (key) => {
    try {
      console.log('[Main Process] Getting key:', key);
      console.log('[Main Process] Storage path:', storagePath);
      
      if (fs.existsSync(storagePath)) {
        const buffer = fs.readFileSync(storagePath);
        const data = decompressData(buffer);
        console.log('[Main Process] Read content (decompressed):', JSON.stringify(data, null, 2));
        const result = data[key];
        console.log('[Main Process] Retrieved result:', result ? { projectsCount: result.projects?.length } : null);
        return result;
      }
      console.log('[Main Process] Storage file does not exist');
      return null;
    } catch (error) {
      console.error('[Main Process] Error reading from compressed storage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      console.log('[Main Process] Setting key:', key);
      console.log('[Main Process] Storage path:', storagePath);
      console.log('[Main Process] Value to set:', value ? { projectsCount: value?.projects?.length } : null);
      
      let data = {};
      if (fs.existsSync(storagePath)) {
        const buffer = fs.readFileSync(storagePath);
        data = decompressData(buffer);
      }
      data[key] = value;
      const compressedData = compressData(data);
      fs.writeFileSync(storagePath, compressedData);
      console.log('[Main Process] Data written (compressed) successfully');
      console.log('[Main Process] Current storage content (decompressed):', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[Main Process] Error writing to compressed storage:', error);
    }
  },
  delete: (key) => {
    try {
      console.log('[Main Process] Deleting key:', key);
      if (fs.existsSync(storagePath)) {
        const buffer = fs.readFileSync(storagePath);
        const data = decompressData(buffer);
        delete data[key];
        const compressedData = compressData(data);
        fs.writeFileSync(storagePath, compressedData);
        console.log('[Main Process] Key deleted (compressed) successfully');
      }
    } catch (error) {
      console.error('[Main Process] Error deleting from compressed storage:', error);
    }
  },
  clear: () => {
    try {
      console.log('[Main Process] Clearing storage');
      if (fs.existsSync(storagePath)) {
        const emptyData = compressData({});
        fs.writeFileSync(storagePath, emptyData);
        console.log('[Main Process] Storage cleared (compressed) successfully');
      }
    } catch (error) {
      console.error('[Main Process] Error clearing compressed storage:', error);
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

  // 开发模式加载本地服务器
  win.loadURL('http://localhost:5173');
  
  // 生产模式加载构建后的文件
  // win.loadFile(path.join(__dirname, '../dist/index.html'));
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

// 应用关闭前的处理
app.on('before-quit', async () => {
  console.log('App is quitting, ensuring data is saved...');
  // 这里可以添加额外的保存逻辑
  console.log('App quit process started');
});

// 应用窗口关闭时的处理
app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    console.log('Quitting app');
    app.quit();
  }
});

// 处理存储相关的IPC请求
ipcMain.handle('storage:get', (event, key) => {
  console.log('[IPC] Getting storage key:', key);
  const value = store.get(key);
  console.log('[IPC] Retrieved value:', value ? { projectsCount: value.projects?.length, currentProjectId: value.currentProjectId } : null);
  return value;
});

ipcMain.handle('storage:set', (event, key, value) => {
  console.log('[IPC] Setting storage key:', key);
  console.log('[IPC] Value to set:', value ? { projectsCount: value.projects?.length, currentProjectId: value.currentProjectId } : null);
  store.set(key, value);
  console.log('[IPC] Storage set successfully');
});

ipcMain.handle('storage:remove', (event, key) => {
  console.log('[IPC] Removing storage key:', key);
  store.delete(key);
  console.log('[IPC] Storage key removed');
});

ipcMain.handle('storage:clear', () => {
  console.log('[IPC] Clearing all storage');
  store.clear();
  console.log('[IPC] Storage cleared');
});
