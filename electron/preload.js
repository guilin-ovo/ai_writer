const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  storage: {
    getItem: (key) => ipcRenderer.invoke('storage:get', key),
    setItem: (key, value) => ipcRenderer.invoke('storage:set', key, value),
    removeItem: (key) => ipcRenderer.invoke('storage:remove', key),
    clear: () => ipcRenderer.invoke('storage:clear')
  },
  isElectron: true
});
