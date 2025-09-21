# 📚 Dicionário Pessoal - Desktop Edition

Uma aplicação desktop que permite capturar texto de qualquer programa e criar um dicionário pessoal com definições customizadas e geração automática via IA.

![Dicionário Desktop](https://via.placeholder.com/800x450/0066cc/ffffff?text=Dicionário+Desktop)

## ✨ Funcionalidades

### 🎯 Captura Global de Texto
- Funciona em **qualquer aplicação** (Word, Notepad, PDFs, sites, etc.)
- Hotkey global `Ctrl+Shift+D` para capturar texto selecionado
- Popup instantâneo com definições existentes

### 📝 Gerenciamento de Dicionário
- Interface intuitiva para adicionar/editar/excluir definições
- Busca inteligente por palavra ou conteúdo
- Importação de dados da extensão browser
- Exportação para backup em JSON

### 🤖 Integração com IA
- **OpenAI GPT**: Geração automática de definições
- **Anthropic Claude**: Definições contextualizadas
- **Google AI Gemini**: Alternativa gratuita
- Fallback automático entre provedores

### ⚙️ Configurações Avançadas
- Hotkeys personalizáveis
- Timeout configurável para popups
- Sincronização com extensão browser
- Backup automático de dados

## 🚀 Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/browser-helper.git
cd browser-helper/desktop-version/electron-app

# 2. Instale as dependências
npm install

# 3. Configure as variáveis (opcional)
cp .env.example .env

# 4. Execute a aplicação
npm start
```

Para instruções detalhadas, consulte [INSTALL.md](INSTALL.md).

## 📱 Interface

### Janela Principal
- **Lista de palavras**: Visualização de todo o dicionário
- **Busca em tempo real**: Filtragem por palavra ou definição
- **Botões de ação**: Adicionar, importar, exportar, configurar
- **Contador**: Número total de palavras no dicionário

### Popup de Definição
- **Aparece automaticamente** ao capturar texto
- **Botão Editar**: Adiciona/modifica definições rapidamente
- **Botão IA**: Gera definição automática
- **Fechamento automático**: Timeout configurável

### Modais de Edição
- **Campo palavra**: Termo a ser definido
- **Campo definição**: Descrição detalhada
- **Botões IA**: Geração por provedor específico
- **Validação**: Verifica campos obrigatórios

## ⌨️ Atalhos de Teclado

| Atalho | Função |
|--------|--------|
| `Ctrl+Shift+D` | Capturar texto selecionado |
| `Ctrl+Alt+D` | Mostrar/ocultar janela principal |
| `Ctrl+N` | Adicionar nova palavra |
| `Ctrl+F` | Focar no campo de busca |
| `Ctrl+Enter` | Salvar palavra no modal |
| `Esc` | Fechar modais/popups |

## 🔧 Arquitetura

### Estrutura de Arquivos
```
electron-app/
├── main.js              # Processo principal do Electron
├── renderer/            # Interface do usuário
│   ├── index.html       # Janela principal
│   ├── popup.html       # Popup de definições
│   ├── app.js          # Lógica da interface
│   ├── styles.css      # Estilos CSS
│   └── preload.js      # Bridge segura IPC
├── services/           # Lógica de negócio
│   ├── textCapture.js  # Captura global de texto
│   ├── dictionaryService.js # Gerenciamento do dicionário
│   └── aiService.js    # Integração com APIs de IA
├── assets/            # Recursos estáticos
└── package.json       # Configuração do projeto
```

### Tecnologias
- **Electron 25+**: Framework desktop multiplataforma
- **Node.js 16+**: Runtime JavaScript
- **robotjs**: Simulação de teclas para captura
- **electron-store**: Persistência de dados
- **node-fetch**: Requisições HTTP para APIs

### Comunicação IPC
```javascript
// Renderer → Main
window.electronAPI.saveWord(word, definition);

// Main → Renderer  
window.webContents.send('show-definition', data);
```

## 🤖 APIs de IA Suportadas

### OpenAI GPT
```javascript
// Configuração no .env
OPENAI_API_KEY=sk-proj-...

// Modelos suportados
- gpt-3.5-turbo (padrão)
- gpt-4 (configurável)
```

### Anthropic Claude
```javascript  
// Configuração no .env
ANTHROPIC_API_KEY=sk-ant-...

// Modelos suportados
- claude-3-haiku (padrão)
- claude-3-sonnet
- claude-3-opus
```

### Google AI Gemini
```javascript
// Configuração no .env  
GOOGLE_AI_KEY=AIza...

// Modelos suportados
- gemini-pro (padrão)
- gemini-pro-vision
```

## 📊 Formato de Dados

### Dicionário
```json
{
  "palavra": "Definição clara e concisa da palavra ou termo",
  "API REST": "Interface de programação que segue os princípios REST...",
  "machine learning": "Subcampo da inteligência artificial que permite..."
}
```

### Configurações
```json
{
  "hotkeys": {
    "capture": "CommandOrControl+Shift+D",
    "toggle": "CommandOrControl+Alt+D"
  },
  "popup": {
    "width": 350,
    "height": 200,
    "timeout": 10000
  }
}
```

## 🔄 Sincronização com Extensão

### Exportar da Extensão Browser
```javascript
// Console da extensão (F12)
chrome.storage.sync.get({dictionary: {}}, function(data) {
  console.log(JSON.stringify(data.dictionary, null, 2));
});
```

### Importar no Desktop
1. Copie o JSON exportado
2. Desktop App → "📥 Importar"  
3. Cole o JSON → "Importar"
4. Confirme a mesclagem

### Manter Sincronizado
- **Manual**: Export/import periódico
- **Futuro**: Sincronização automática na nuvem

## 🐛 Depuração

### Logs de Desenvolvimento
```bash
# Modo debug com DevTools
npm run dev

# Logs do processo principal
console.log no main.js aparece no terminal

# Logs do renderer
console.log no app.js aparece no DevTools (F12)
```

### Problemas Comuns

#### Hotkeys não funcionam
```bash
# Verificar conflitos com outros programas
# Executar como administrador (Windows)
# Permitir acessibilidade (macOS)
```

#### Erro na instalação do robotjs
```bash
# Windows: Instalar build tools
npm install --global windows-build-tools

# macOS: Xcode command line tools  
xcode-select --install

# Linux: Dependências de build
sudo apt-get install build-essential libxtst6
```

#### Popup não aparece
```bash
# Verificar se texto está selecionado
# Aumentar delay de captura
# Verificar permissões de clipboard
```

## 📈 Performance

### Otimizações
- **Lazy loading**: Componentes carregados sob demanda
- **Debounced search**: Busca otimizada com atraso
- **Memory management**: Limpeza automática de recursos
- **Background process**: Processo principal leve

### Métricas Típicas
- **Startup time**: < 2 segundos
- **Memory usage**: 50-150MB
- **Capture latency**: < 200ms
- **AI response**: 1-5 segundos

## 🏗️ Build e Distribuição

### Desenvolvimento
```bash
npm run dev          # Modo desenvolvimento
npm run start        # Modo produção local
```

### Build
```bash
npm run build        # Todas as plataformas
npm run build-win    # Windows (exe + installer)
npm run build-mac    # macOS (dmg + app)  
npm run build-linux  # Linux (AppImage + deb)
```

### Distribuição
```bash
# Arquivos gerados em dist/
├── win-unpacked/           # Windows portable
├── DicionarioPessoal-1.0.0-Setup.exe  # Windows installer
├── DicionarioPessoal-1.0.0.dmg        # macOS disk image
└── DicionarioPessoal-1.0.0.AppImage   # Linux portable
```

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`  
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **Electron**: Framework que torna isso possível
- **robotjs**: Captura global de texto  
- **OpenAI/Anthropic/Google**: APIs de IA
- **Comunidade**: Feedback e contribuições

---

**Desenvolvido com ❤️ por Raul**  
**Versão**: 1.0.0  
**Compatibilidade**: Windows 10+, macOS 10.14+, Ubuntu 18.04+