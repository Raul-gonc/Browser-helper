# Notas Técnicas - Implementação Desktop

## Desafios da Migração Browser → Desktop

### 1. Captura de Texto Global
**Browser Extension**: `window.getSelection()` funciona apenas no contexto da página
**Desktop**: Precisa interceptar seleções em qualquer aplicação

**Soluções**:
- **Windows**: Win32 API via `GetClipboardData()` + simulação de Ctrl+C
- **Mac**: Cocoa API via `NSPasteboard`
- **Linux**: X11/Wayland clipboard APIs

### 2. Overlay de Interface
**Browser**: DOM nativo, z-index simples
**Desktop**: Janelas sempre-on-top, transparência, posicionamento por coordenadas de mouse

**Implementação Electron**:
```javascript
const overlayWindow = new BrowserWindow({
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  webPreferences: {
    nodeIntegration: true
  }
});
```

### 3. Hotkeys Globais
**Browser**: Shortcuts limitados ao contexto da aba
**Desktop**: Sistema operacional precisa registrar combinações globalmente

**Bibliotecas**:
- Electron: `globalShortcut.register()`
- Python: `pynput.keyboard.GlobalHotKeys`
- AutoHotkey: Nativo

### 4. Armazenamento de Dados
**Browser**: Chrome Storage API (sincronização automática entre dispositivos)
**Desktop**: Sistema de arquivos local + opcional sync manual

**Migração**:
```javascript
// Exportar da extensão (console do browser)
chrome.storage.sync.get({dictionary: {}}, (data) => {
  console.log(JSON.stringify(data.dictionary, null, 2));
});

// Importar no desktop
const fs = require('fs');
const importedDict = JSON.parse(fs.readFileSync('dictionary.json', 'utf8'));
```

## Arquitetura Técnica Detalhada

### Processo Principal (main.js)
```javascript
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');

class DictionaryApp {
  constructor() {
    this.mainWindow = null;
    this.popupWindow = null;
    this.dictionary = {};
  }

  // Registrar hotkeys globais
  setupHotkeys() {
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      this.captureSelectedText();
    });
  }

  // Capturar texto via clipboard
  async captureSelectedText() {
    const clipboard = require('electron').clipboard;
    const originalText = clipboard.readText();
    
    // Simula Ctrl+C
    robot.keyTap('c', ['control']); // usando robotjs
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const selectedText = clipboard.readText();
    
    if (selectedText !== originalText) {
      this.showDefinitionPopup(selectedText);
    }
  }
}
```

### Sistema de Coordenadas para Popup
```javascript
const { screen } = require('electron');

function getOptimalPopupPosition(mouseX, mouseY) {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  
  const popupWidth = 350;
  const popupHeight = 200;
  
  // Evita que popup saia da tela
  let x = mouseX + 10;
  let y = mouseY - 50;
  
  if (x + popupWidth > primaryDisplay.bounds.width) {
    x = mouseX - popupWidth - 10;
  }
  
  if (y + popupHeight > primaryDisplay.bounds.height) {
    y = mouseY - popupHeight - 10;
  }
  
  return { x, y };
}
```

### Integração com APIs de IA (reutilização do código da extensão)
```javascript
class AIService {
  constructor() {
    this.apis = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_AI_KEY
    };
  }

  async generateDefinition(word, provider = 'openai') {
    // Mesmo código da extensão, mas com fetch nativo do Node.js
    const response = await fetch(`https://api.${provider}.com/...`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apis[provider]}` },
      body: JSON.stringify({
        prompt: `Defina a palavra "${word}" de forma clara e concisa:`,
        max_tokens: 100
      })
    });
    
    return response.json();
  }
}
```

## Considerações de Performance

### Monitoramento de Recursos
- **Memória**: Electron pode usar 50-200MB em idle
- **CPU**: Listener de hotkeys deve ser otimizado
- **Startup**: Aplicação deve iniciar em < 2 segundos

### Otimizações
1. **Lazy loading** de componentes de UI
2. **Debounce** em operações de busca/filtragem
3. **Virtualização** para listas grandes de palavras
4. **Cache** de definições de IA

## Distribuição e Packaging

### Electron Builder Config
```json
{
  "build": {
    "appId": "com.dicionariopessoal.desktop",
    "productName": "Dicionário Pessoal",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "renderer/**/*",
      "services/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    }
  }
}
```

### Auto-updater
```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
autoUpdater.on('update-available', () => {
  // Notificar usuário sobre atualização
});
```

## Testes e Qualidade

### Casos de Teste Críticos
1. **Captura de texto em diferentes aplicações**: Word, Notepad, PDFs, etc.
2. **Hotkeys não conflitam com outros programas**
3. **Popup posiciona corretamente em múltiplos monitores**
4. **Importação/sincronização de dados da extensão**
5. **Performance com dicionários grandes (1000+ palavras)**

### Ferramentas
- Jest para testes unitários
- Spectron para testes E2E do Electron
- ESLint para qualidade de código

---

**Próximos passos**: Implementar MVP com captura básica + popup simples