// 测试Node.js环境下的本地文件存储功能
const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const STORAGE_FILE = path.join(STORAGE_DIR, 'local.json');

// 确保存储目录存在
const ensureStorageDir = () => {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    console.log('创建存储目录:', STORAGE_DIR);
  }
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({}, null, 2));
    console.log('创建存储文件:', STORAGE_FILE);
  }
};

// 读取数据
const getItem = (key) => {
  ensureStorageDir();
  try {
    const content = fs.readFileSync(STORAGE_FILE, 'utf8');
    const data = JSON.parse(content);
    return data[key];
  } catch (error) {
    console.error('Error reading from local storage:', error);
    return null;
  }
};

// 写入数据
const setItem = (key, value) => {
  ensureStorageDir();
  try {
    const content = fs.readFileSync(STORAGE_FILE, 'utf8');
    const data = JSON.parse(content);
    data[key] = value;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    console.log('写入数据:', key, '=', value);
  } catch (error) {
    console.error('Error writing to local storage:', error);
  }
};

// 移除数据
const removeItem = (key) => {
  ensureStorageDir();
  try {
    const content = fs.readFileSync(STORAGE_FILE, 'utf8');
    const data = JSON.parse(content);
    delete data[key];
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    console.log('移除数据:', key);
  } catch (error) {
    console.error('Error removing from local storage:', error);
  }
};

// 清空所有数据
const clear = () => {
  ensureStorageDir();
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({}, null, 2));
    console.log('清空所有数据');
  } catch (error) {
    console.error('Error clearing local storage:', error);
  }
};

// 测试功能
console.log('开始测试Node.js环境下的本地文件存储...');

// 测试设置数据
setItem('testKey', 'testValue');

// 测试获取数据
const value = getItem('testKey');
console.log('获取数据:', value);

// 测试更新数据
setItem('testKey', 'updatedValue');
const updatedValue = getItem('testKey');
console.log('更新数据后:', updatedValue);

// 测试删除数据
removeItem('testKey');
const deletedValue = getItem('testKey');
console.log('删除数据后:', deletedValue);

// 测试清空数据
setItem('key1', 'value1');
setItem('key2', 'value2');
console.log('设置多个数据后');
console.log('key1:', getItem('key1'));
console.log('key2:', getItem('key2'));

clear();
console.log('清空数据后');
console.log('key1:', getItem('key1'));
console.log('key2:', getItem('key2'));

console.log('测试完成！');
