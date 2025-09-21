const { contextBridge, ipcRenderer } = require('electron');

// Expõe API segura para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Operações do dicionário
  getDictionary: () => ipcRenderer.invoke('get-dictionary'),
  saveWord: (word, definition) => ipcRenderer.invoke('save-word', word, definition),
  deleteWord: (word) => ipcRenderer.invoke('delete-word', word),
  searchDefinition: (word) => ipcRenderer.invoke('search-definition', word),
  
  // Importação/exportação
  importDictionary: (dictionary) => ipcRenderer.invoke('import-dictionary', dictionary),
  exportDictionary: () => ipcRenderer.invoke('export-dictionary'),
  
  // IA
  generateAIDefinition: (word, provider) => ipcRenderer.invoke('generate-ai-definition', word, provider),
  testAIProvider: (provider, apiKey, model) => ipcRenderer.invoke('test-ai-provider', provider, apiKey, model),
  
  // Configurações
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  
  // Sistema
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Listeners para eventos do main process
  onShowDefinition: (callback) => ipcRenderer.on('show-definition', callback),
  onShowSettings: (callback) => ipcRenderer.on('show-settings', callback),
  
  // Utilitários
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});