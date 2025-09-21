const { app, BrowserWindow, globalShortcut, ipcMain, screen, clipboard, Menu, Tray } = require('electron');
const path = require('path');
const Store = require('electron-store');
require('dotenv').config();

// Importa serviços
const TextCaptureService = require('./services/textCapture');
const DictionaryService = require('./services/dictionaryService');
const AIService = require('./services/aiService');

// Configuração do store para persistência de dados
const store = new Store({
  name: 'dictionary-config',
  defaults: {
    dictionary: {},
    settings: {
      hotkeys: {
        capture: process.env.HOTKEY_CAPTURE || 'CommandOrControl+Shift+D',
        toggle: process.env.HOTKEY_TOGGLE || 'CommandOrControl+Alt+D'
      },
      popup: {
        width: parseInt(process.env.POPUP_WIDTH) || 350,
        height: parseInt(process.env.POPUP_HEIGHT) || 200,
        timeout: parseInt(process.env.POPUP_TIMEOUT) || 10000
      },
      window: {
        width: parseInt(process.env.MAIN_WINDOW_WIDTH) || 800,
        height: parseInt(process.env.MAIN_WINDOW_HEIGHT) || 600
      }
    }
  }
});

class DictionaryApp {
  constructor() {
    this.mainWindow = null;
    this.popupWindow = null;
    this.tray = null;
    this.isQuitting = false;
    
    // Configurações
    this.settings = store.get('settings');
    
    // Inicializa serviços
    this.textCapture = new TextCaptureService();
    this.dictionaryService = new DictionaryService();
    this.aiService = new AIService();
    this.aiService.initialize(this.settings);
  }

  // Inicializa a aplicação
  init() {
    this.createMainWindow();
    this.setupTray();
    this.setupGlobalShortcuts();
    this.setupIpcHandlers();
    
    console.log('🚀 Dicionário Pessoal Desktop iniciado!');
    console.log(`📚 Dicionário carregado com ${Object.keys(this.dictionaryService.getDictionary()).length} palavras`);
    
    // Testa sistema de captura
    this.textCapture.testCapture();
  }

  // Cria a janela principal (oculta por padrão)
  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: this.settings.window.width,
      height: this.settings.window.height,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'renderer', 'preload.js')
      },
      icon: path.join(__dirname, 'assets', 'icon.png'),
      title: 'Dicionário Pessoal',
      show: false, // Inicia oculto na bandeja
      skipTaskbar: false,
      minimizable: true,
      closable: true
    });

    this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Esconde na bandeja ao invés de fechar
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();
        return false;
      }
    });

    this.mainWindow.on('minimize', () => {
      this.mainWindow.hide();
    });

    // Em desenvolvimento, abre DevTools
    if (process.env.DEBUG_MODE === 'true') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  // Cria o ícone da bandeja do sistema
  setupTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    this.tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Mostrar Dicionário',
        click: () => this.showMainWindow()
      },
      {
        label: 'Capturar Texto (Ctrl+Shift+D)',
        click: () => this.captureSelectedText()
      },
      { type: 'separator' },
      {
        label: 'Configurações',
        click: () => this.openSettings()
      },
      {
        label: `${Object.keys(this.dictionaryService.getDictionary()).length} palavras no dicionário`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => this.quit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Dicionário Pessoal');
    
    // Duplo clique mostra janela principal
    this.tray.on('double-click', () => {
      this.showMainWindow();
    });
  }

  // Configura os atalhos globais
  setupGlobalShortcuts() {
    try {
      // Hotkey para capturar texto selecionado
      globalShortcut.register(this.settings.hotkeys.capture, () => {
        console.log(`🔥 Hotkey ativado: ${this.settings.hotkeys.capture}`);
        this.captureSelectedText();
      });

      // Hotkey para mostrar/esconder janela principal
      globalShortcut.register(this.settings.hotkeys.toggle, () => {
        console.log(`🔄 Toggle janela: ${this.settings.hotkeys.toggle}`);
        this.toggleMainWindow();
      });

      console.log(`⌨️  Hotkeys registrados:`);
      console.log(`   📋 Capturar: ${this.settings.hotkeys.capture}`);
      console.log(`   🔄 Toggle: ${this.settings.hotkeys.toggle}`);

    } catch (error) {
      console.error('❌ Erro ao registrar hotkeys:', error.message);
    }
  }

  // Atualiza hotkeys globais (usado quando configurações mudam)
  updateGlobalShortcuts() {
    try {
      // Remove hotkeys antigos
      globalShortcut.unregisterAll();
      
      // Registra novos hotkeys
      this.setupGlobalShortcuts();
      
      console.log('🔄 Hotkeys atualizados');
    } catch (error) {
      console.error('❌ Erro ao atualizar hotkeys:', error.message);
    }
  }

  // Configura handlers IPC para comunicação com renderer
  setupIpcHandlers() {
    console.log('📡 Configurando handlers IPC...');
    
    // Obter dicionário
    ipcMain.handle('get-dictionary', () => {
      try {
        return this.dictionaryService.getDictionary();
      } catch (error) {
        console.error('Erro no handler get-dictionary:', error);
        return {};
      }
    });

    // Salvar palavra no dicionário
    ipcMain.handle('save-word', async (event, word, definition) => {
      const success = await this.dictionaryService.saveWord(word, definition);
      this.updateTrayMenu();
      return { success };
    });

    // Remover palavra do dicionário
    ipcMain.handle('delete-word', async (event, word) => {
      const success = await this.dictionaryService.deleteWord(word);
      this.updateTrayMenu();
      return { success };
    });

    // Importar dicionário da extensão
    ipcMain.handle('import-dictionary', async (event, newDictionary) => {
      const result = await this.dictionaryService.importDictionary(newDictionary);
      this.updateTrayMenu();
      return result;
    });

    // Exportar dicionário
    ipcMain.handle('export-dictionary', async () => {
      return this.dictionaryService.getDictionary();
    });

    // Buscar definição
    ipcMain.handle('search-definition', (event, word) => {
      return this.dictionaryService.getDefinition(word);
    });

    // Gerar definição com IA
    ipcMain.handle('generate-ai-definition', async (event, word, provider) => {
      try {
        // Se não especificado, usa o provedor padrão das configurações
        if (!provider) {
          provider = this.settings.ai?.defaultProvider || 'openai';
        }
        
        return await this.aiService.generateDefinition(word, provider);
      } catch (error) {
        console.error('Erro na geração de IA:', error);
        return null;
      }
    });

    // Obter configurações
    ipcMain.handle('get-settings', () => {
      return this.settings;
    });

    // Salvar configurações
    ipcMain.handle('save-settings', (event, newSettings) => {
      this.settings = { ...this.settings, ...newSettings };
      store.set('settings', this.settings);
      
      // Atualiza hotkeys se mudaram
      this.updateGlobalShortcuts();
      
      // Atualiza serviço de IA com novas configurações
      this.aiService.updateSettings(this.settings);
      
      return { success: true };
    });

    // Resetar configurações
    ipcMain.handle('reset-settings', () => {
      const defaultSettings = {
        hotkeys: {
          capture: process.env.HOTKEY_CAPTURE || 'CommandOrControl+Shift+D',
          toggle: process.env.HOTKEY_TOGGLE || 'CommandOrControl+Alt+D'
        },
        popup: {
          width: parseInt(process.env.POPUP_WIDTH) || 350,
          height: parseInt(process.env.POPUP_HEIGHT) || 200,
          timeout: parseInt(process.env.POPUP_TIMEOUT) || 10000
        },
        window: {
          width: parseInt(process.env.MAIN_WINDOW_WIDTH) || 800,
          height: parseInt(process.env.MAIN_WINDOW_HEIGHT) || 600
        },
        general: {
          startWithSystem: false,
          autoBackup: false,
          maxBackups: 10
        },
        ai: {
          temperature: 0.3,
          maxTokens: 150,
          autoSave: false
        }
      };
      
      this.settings = defaultSettings;
      store.set('settings', this.settings);
      this.updateGlobalShortcuts();
      
      return { success: true };
    });

    // Testar provedor de IA
    ipcMain.handle('test-ai-provider', async (event, provider, apiKey, model) => {
      try {
        // Configura temporariamente a chave para teste
        this.aiService.setApiKey(provider, apiKey);
        
        // Testa com uma palavra simples
        const testDefinition = await this.aiService.generateDefinition('teste', provider);
        
        return {
          success: true,
          message: 'Conexão estabelecida com sucesso!',
          testDefinition: testDefinition
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    // Abrir URL externa
    ipcMain.handle('open-external', async (event, url) => {
      const { shell } = require('electron');
      await shell.openExternal(url);
      return { success: true };
    });
  }

  // Captura texto selecionado via clipboard
  async captureSelectedText() {
    try {
      const selectedText = await this.textCapture.captureAndProcess();
      
      if (selectedText) {
        console.log(`📝 Texto capturado: "${selectedText}"`);
        this.showDefinitionPopup(selectedText);
      } else {
        console.log('⚠️  Nenhum texto válido capturado');
      }

    } catch (error) {
      console.error('❌ Erro ao capturar texto:', error.message);
    }
  }

  // Mostra popup com definição
  showDefinitionPopup(word) {
    // Fecha popup anterior se existir
    if (this.popupWindow && !this.popupWindow.isDestroyed()) {
      this.popupWindow.close();
    }

    // Obtém posição do cursor
    const cursorPosition = screen.getCursorScreenPoint();
    const primaryDisplay = screen.getPrimaryDisplay();
    
    // Calcula posição ideal para o popup
    const popupWidth = this.settings.popup.width;
    const popupHeight = this.settings.popup.height;
    
    let x = cursorPosition.x + 10;
    let y = cursorPosition.y - 50;
    
    // Evita que popup saia da tela
    if (x + popupWidth > primaryDisplay.bounds.width) {
      x = cursorPosition.x - popupWidth - 10;
    }
    
    if (y + popupHeight > primaryDisplay.bounds.height) {
      y = cursorPosition.y - popupHeight - 10;
    }
    
    if (y < 0) y = 10;
    if (x < 0) x = 10;

    // Cria janela do popup
    this.popupWindow = new BrowserWindow({
      width: popupWidth,
      height: popupHeight,
      x: x,
      y: y,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      transparent: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'renderer', 'preload.js')
      },
      show: false
    });

    this.popupWindow.loadFile(path.join(__dirname, 'renderer', 'popup.html'));

    // Mostra popup quando pronto
    this.popupWindow.once('ready-to-show', () => {
      this.popupWindow.show();
      
      // Envia dados para o popup
      this.popupWindow.webContents.send('show-definition', {
        word: word,
        definition: this.dictionaryService.getDefinition(word)
      });
    });

    // Auto-fecha popup após timeout
    setTimeout(() => {
      if (this.popupWindow && !this.popupWindow.isDestroyed()) {
        this.popupWindow.close();
      }
    }, this.settings.popup.timeout);

    // Remove referência quando fechado
    this.popupWindow.on('closed', () => {
      this.popupWindow = null;
    });

    // Fecha popup ao clicar fora (perde foco)
    this.popupWindow.on('blur', () => {
      setTimeout(() => {
        if (this.popupWindow && !this.popupWindow.isDestroyed()) {
          this.popupWindow.close();
        }
      }, 100);
    });
  }

  // Mostra/esconde janela principal
  showMainWindow() {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  toggleMainWindow() {
    this.showMainWindow();
  }

  // Abre configurações
  openSettings() {
    this.showMainWindow();
    // Futuramente enviará evento para mostrar aba de configurações
    this.mainWindow.webContents.send('show-settings');
  }

  // Atualiza menu da bandeja
  updateTrayMenu() {
    if (this.tray) {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Mostrar Dicionário',
          click: () => this.showMainWindow()
        },
        {
          label: 'Capturar Texto (Ctrl+Shift+D)',
          click: () => this.captureSelectedText()
        },
        { type: 'separator' },
        {
          label: 'Configurações',
          click: () => this.openSettings()
        },
        {
          label: `${Object.keys(this.dictionaryService.getDictionary()).length} palavras no dicionário`,
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Sair',
          click: () => this.quit()
        }
      ]);
      
      this.tray.setContextMenu(contextMenu);
    }
  }

  // Gerar definição com IA
  async generateAIDefinition(word, provider = null) {
    try {
      // Se não especificado, usa o provedor padrão das configurações
      if (!provider) {
        provider = this.settings.ai?.defaultProvider || 'openai';
      }
      
      return await this.aiService.generateDefinition(word, provider);
    } catch (error) {
      console.error('Erro na geração de IA:', error);
      return `Erro ao gerar definição para "${word}". Verifique as configurações de IA.`;
    }
  }

  // Encerra aplicação
  quit() {
    this.isQuitting = true;
    globalShortcut.unregisterAll();
    app.quit();
  }
}

// Instância global da aplicação
let dictionaryApp;

// Eventos do Electron
app.whenReady().then(() => {
  dictionaryApp = new DictionaryApp();
  dictionaryApp.init();
});

app.on('window-all-closed', () => {
  // Não encerra no macOS quando todas as janelas são fechadas
  if (process.platform !== 'darwin') {
    // Mas também não encerra se tiver tray
    // app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    dictionaryApp.createMainWindow();
  }
});

app.on('before-quit', () => {
  if (dictionaryApp) {
    dictionaryApp.isQuitting = true;
  }
});

// Limpa hotkeys ao encerrar
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Apenas uma instância da aplicação
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Se tentar abrir segunda instância, foca na primeira
    if (dictionaryApp && dictionaryApp.mainWindow) {
      if (dictionaryApp.mainWindow.isMinimized()) {
        dictionaryApp.mainWindow.restore();
      }
      dictionaryApp.mainWindow.focus();
    }
  });
}