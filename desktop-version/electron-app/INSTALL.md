# 🚀 Instalação e Execução - Dicionário Desktop

## 📋 Pré-requisitos

### 1. Node.js
- Baixe e instale Node.js 16+ em https://nodejs.org/
- Verifique a instalação:
```bash
node --version
npm --version
```

### 2. Dependências do Sistema

#### Windows:
```bash
# Instalar ferramentas de build (necessário para robotjs)
npm install --global windows-build-tools
```

#### macOS:
```bash
# Instalar Xcode Command Line Tools
xcode-select --install
```

#### Linux:
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libxtst6 libpng++-dev

# Red Hat/CentOS
sudo yum groupinstall "Development Tools"
sudo yum install libXtst-devel libpng-devel
```

## ⚙️ Configuração

### 1. Instalar Dependências
```bash
cd desktop-version/electron-app
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas chaves de API (opcional)
notepad .env  # Windows
nano .env     # Linux/macOS
```

### 3. Configurar Ícone (Temporário)
```bash
# Criar um ícone placeholder simples
# Para Windows com PowerShell:
$url = "https://via.placeholder.com/512x512/0066cc/ffffff.png?text=📚"
Invoke-WebRequest -Uri $url -OutFile "assets/icon.png"
```

## ▶️ Executar a Aplicação

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

### Construir Executável
```bash
# Para Windows
npm run build-win

# Para macOS  
npm run build-mac

# Para Linux
npm run build-linux

# Para todas as plataformas
npm run build
```

## 🔧 Uso da Aplicação

### Primeira Execução
1. A aplicação inicia na bandeja do sistema (system tray)
2. Clique duplo no ícone da bandeja para abrir a janela principal
3. Ou use o atalho `Ctrl+Alt+D`

### Capturando Texto
1. Selecione qualquer texto em qualquer aplicação
2. Pressione `Ctrl+Shift+D`
3. Um popup aparecerá com a definição (se existir)
4. Clique em "Editar" para adicionar/modificar a definição

### Gerenciando o Dicionário
- **Adicionar palavra**: Botão "➕ Adicionar Palavra" ou `Ctrl+N`
- **Buscar**: Digite no campo de busca ou `Ctrl+F`
- **Importar**: Botão "📥 Importar" para trazer dados da extensão
- **Exportar**: Botão "📤 Exportar" para backup

### Atalhos de Teclado
- `Ctrl+Shift+D`: Capturar texto selecionado
- `Ctrl+Alt+D`: Mostrar/ocultar janela principal
- `Ctrl+N`: Adicionar nova palavra
- `Ctrl+F`: Focar na busca
- `Esc`: Fechar modais/popups

### Importando da Extensão Browser
1. Abra a extensão no navegador
2. Pressione F12 para abrir o console
3. Execute o comando:
```javascript
chrome.storage.sync.get({dictionary: {}}, function(data) {
  console.log(JSON.stringify(data.dictionary, null, 2));
});
```
4. Copie o resultado JSON
5. Na aplicação desktop: "📥 Importar" → Cole o JSON → "Importar"

## 🤖 Configuração de APIs de IA

### OpenAI
1. Obtenha uma chave API em https://platform.openai.com/api-keys
2. No arquivo `.env`: `OPENAI_API_KEY=sk-...`

### Anthropic (Claude)
1. Obtenha uma chave API em https://console.anthropic.com/
2. No arquivo `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

### Google AI (Gemini)
1. Obtenha uma chave API em https://makersuite.google.com/app/apikey
2. No arquivo `.env`: `GOOGLE_AI_KEY=AIz...`

## 🐛 Solução de Problemas

### Erro ao instalar robotjs
```bash
# Windows: Instalar ferramentas de build
npm install --global windows-build-tools

# Ou usar versão pré-compilada
npm install robotjs --force
```

### Hotkeys não funcionam
- Verifique se outro programa não está usando os mesmos atalhos
- Execute a aplicação como administrador (Windows)
- Verifique permissões de acessibilidade (macOS)

### Popup não aparece
- Verifique se há texto selecionado antes de pressionar o hotkey
- Tente aumentar o delay de captura nas configurações
- Verifique se o antivírus não está bloqueando

### Aplicação não inicia
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problemas de Performance
- Feche outras aplicações que usam muita RAM
- Considere usar apenas um provedor de IA
- Reduza o tempo de timeout do popup

## 📁 Localização dos Dados

### Windows
```
%APPDATA%/dicionario-pessoal-desktop/
├── config.json
├── dictionary-data.json
└── backups/
```

### macOS
```
~/Library/Application Support/dicionario-pessoal-desktop/
├── config.json
├── dictionary-data.json
└── backups/
```

### Linux
```
~/.config/dicionario-pessoal-desktop/
├── config.json
├── dictionary-data.json
└── backups/
```

## 🔄 Atualizações

A aplicação verifica atualizações automaticamente. Para atualizar manualmente:

```bash
git pull origin main
npm install
npm start
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console da aplicação
2. Consulte as issues no GitHub
3. Crie uma nova issue com detalhes do erro

---

**Versão**: 1.0.0  
**Compatibilidade**: Windows 10+, macOS 10.14+, Ubuntu 18.04+