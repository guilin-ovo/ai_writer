// 检测是否在Electron环境中
const isElectron = typeof window !== 'undefined' && (window as any).electron && (window as any).electron.isElectron;

// 检测是否在Node.js环境中
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

// 打印环境信息用于调试
console.log('=== Environment Detection ===');
console.log('isElectron:', isElectron);
console.log('isNode:', isNode);
console.log('typeof window:', typeof window);
if (typeof window !== 'undefined') {
  console.log('window.electron exists:', !!(window as any).electron);
  if ((window as any).electron) {
    console.log('window.electron.isElectron:', (window as any).electron.isElectron);
    console.log('window.electron.storage exists:', !!(window as any).electron.storage);
  }
}
console.log('=== End Environment Detection ===');

let fs: any;
let path: any;
let zlib: any;
let STORAGE_DIR: string;
let STORAGE_FILE: string;

if (isNode) {
  fs = require('fs');
  path = require('path');
  zlib = require('zlib');
  // 统一存储路径，使用项目根目录下的 storage 文件夹
  STORAGE_DIR = path.join(process.cwd(), 'storage');
  STORAGE_FILE = path.join(STORAGE_DIR, 'local.json.gz'); // 使用压缩文件
  console.log('Node.js storage path:', STORAGE_FILE);
}

// 压缩数据
const compressData = (data: any): Buffer => {
  const jsonString = JSON.stringify(data);
  return zlib.gzipSync(jsonString);
};

// 解压数据
const decompressData = (buffer: Buffer): any => {
  const jsonString = zlib.gunzipSync(buffer).toString('utf8');
  return JSON.parse(jsonString);
};

// 确保存储目录存在（仅在Node.js环境中）
const ensureStorageDir = () => {
  if (isNode) {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
      console.log('Created storage directory:', STORAGE_DIR);
    }
    if (!fs.existsSync(STORAGE_FILE)) {
      const emptyData = compressData({});
      fs.writeFileSync(STORAGE_FILE, emptyData);
      console.log('Created compressed storage file:', STORAGE_FILE);
    }
  }
};

// 读取数据
export const getItem = async (key: string): Promise<any> => {
  console.log('Getting item:', key);
  if (isElectron) {
    console.log('Using Electron storage');
    // 在Electron环境中通过IPC获取数据
    try {
      const result = await (window as any).electron.storage.getItem(key);
      console.log('Got item from Electron storage:', result ? { projectsCount: result.projects?.length } : null);
      return result;
    } catch (error) {
      console.error('Error getting item from Electron storage:', error);
      return null;
    }
  } else if (isNode) {
    console.log('Using Node.js storage');
    // 在Node.js环境中使用fs
    ensureStorageDir();
    try {
      const buffer = fs.readFileSync(STORAGE_FILE);
      const data = decompressData(buffer);
      const result = data[key];
      console.log('Got item from Node.js storage (compressed):', result ? { projectsCount: result.projects?.length } : null);
      return result;
    } catch (error) {
      console.error('Error reading from compressed local storage:', error);
      return null;
    }
  } else {
    console.log('Using browser localStorage');
    // 在浏览器环境中使用原始的localStorage
    try {
      const saved = localStorage.getItem(key);
      const result = saved ? JSON.parse(saved) : null;
      console.log('Got item from browser localStorage:', result ? { projectsCount: result.projects?.length } : null);
      return result;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
};

// 写入数据
export const setItem = async (key: string, value: any): Promise<void> => {
  console.log('Setting item:', key, { projectsCount: value?.projects?.length });
  if (isElectron) {
    console.log('Using Electron storage');
    // 在Electron环境中通过IPC设置数据
    try {
      await (window as any).electron.storage.setItem(key, value);
      console.log('Set item in Electron storage successfully');
    } catch (error) {
      console.error('Error setting item in Electron storage:', error);
    }
  } else if (isNode) {
    console.log('Using Node.js storage');
    // 在Node.js环境中使用fs
    ensureStorageDir();
    try {
      let data: Record<string, any> = {};
      if (fs.existsSync(STORAGE_FILE)) {
        const buffer = fs.readFileSync(STORAGE_FILE);
        data = decompressData(buffer);
      }
      data[key] = value;
      const compressedData = compressData(data);
      fs.writeFileSync(STORAGE_FILE, compressedData);
      console.log('Set item in Node.js storage (compressed) successfully');
    } catch (error) {
      console.error('Error writing to compressed local storage:', error);
    }
  } else {
    console.log('Using browser localStorage');
    // 在浏览器环境中使用原始的localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value));
      console.log('Set item in browser localStorage successfully');
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
};

// 移除数据
export const removeItem = async (key: string): Promise<void> => {
  console.log('Removing item:', key);
  if (isElectron) {
    console.log('Using Electron storage');
    // 在Electron环境中通过IPC移除数据
    try {
      await (window as any).electron.storage.removeItem(key);
      console.log('Removed item from Electron storage successfully');
    } catch (error) {
      console.error('Error removing item from Electron storage:', error);
    }
  } else if (isNode) {
    console.log('Using Node.js storage');
    // 在Node.js环境中使用fs
    ensureStorageDir();
    try {
      const buffer = fs.readFileSync(STORAGE_FILE);
      const data = decompressData(buffer);
      delete data[key];
      const compressedData = compressData(data);
      fs.writeFileSync(STORAGE_FILE, compressedData);
      console.log('Removed item from Node.js storage (compressed) successfully');
    } catch (error) {
      console.error('Error removing from compressed local storage:', error);
    }
  } else {
    console.log('Using browser localStorage');
    // 在浏览器环境中使用原始的localStorage
    try {
      localStorage.removeItem(key);
      console.log('Removed item from browser localStorage successfully');
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

// 清空所有数据
export const clear = async (): Promise<void> => {
  console.log('Clearing storage');
  if (isElectron) {
    console.log('Using Electron storage');
    // 在Electron环境中通过IPC清空数据
    try {
      await (window as any).electron.storage.clear();
      console.log('Cleared Electron storage successfully');
    } catch (error) {
      console.error('Error clearing Electron storage:', error);
    }
  } else if (isNode) {
    console.log('Using Node.js storage');
    // 在Node.js环境中使用fs
    ensureStorageDir();
    try {
      const emptyData = compressData({});
      fs.writeFileSync(STORAGE_FILE, emptyData);
      console.log('Cleared Node.js storage (compressed) successfully');
    } catch (error) {
      console.error('Error clearing compressed local storage:', error);
    }
  } else {
    console.log('Using browser localStorage');
    // 在浏览器环境中使用原始的localStorage
    try {
      localStorage.clear();
      console.log('Cleared browser localStorage successfully');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};
