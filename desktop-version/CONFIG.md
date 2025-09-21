# Configuração do Projeto - Dicionário Desktop

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes configurações:

```env
# APIs de IA (opcional - compatível com extensão)
OPENAI_API_KEY=sua_chave_aqui
ANTHROPIC_API_KEY=sua_chave_aqui
GOOGLE_AI_KEY=sua_chave_aqui

# Configurações da aplicação
APP_NAME=DicionarioPessoal
APP_VERSION=1.0.0
DEFAULT_LANGUAGE=pt-BR

# Hotkeys (modificáveis)
HOTKEY_CAPTURE=CommandOrControl+Shift+D
HOTKEY_TOGGLE=CommandOrControl+Alt+D
HOTKEY_CLOSE=Escape

# Configurações de sincronização
SYNC_ENABLED=false
SYNC_INTERVAL=300000  # 5 minutos em ms
BACKUP_ENABLED=true
MAX_BACKUPS=10
```

## Migração de Dados da Extensão

### Windows - Chrome
```
C:\Users\{usuario}\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\{extension-id}
```

### Windows - Edge
```
C:\Users\{usuario}\AppData\Local\Microsoft\Edge\User Data\Default\Local Extension Settings\{extension-id}
```

### Comando para exportar (executar no console da extensão)
```javascript
chrome.storage.sync.get({dictionary: {}}, function(data) {
  const blob = new Blob([JSON.stringify(data.dictionary, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dictionary-export.json';
  a.click();
});
```

## Dependências por Tecnologia

### Electron
```json
{
  "devDependencies": {
    "electron": "^25.0.0",
    "electron-builder": "^24.0.0"
  },
  "dependencies": {
    "electron-store": "^8.1.0",
    "node-global-key-listener": "^0.1.1",
    "clipboardy": "^3.0.0"
  }
}
```

### Python
```txt
tkinter (built-in)
pyperclip>=1.8.2
pynput>=1.7.6
requests>=2.31.0
python-dotenv>=1.0.0
```

### AutoHotkey
```
AutoHotkey v1.1+ ou v2.0+
JSON.ahk library (para manipulação de dados)
```

---
**Notas importantes**:
- Sempre teste a captura de texto em diferentes aplicações
- Considere permissões de segurança (antivírus pode bloquear hotkeys globais)
- Mantenha compatibilidade com formato de dados da extensão