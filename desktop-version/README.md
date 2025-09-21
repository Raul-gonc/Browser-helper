# Dicionário Pessoal - Versão Desktop

## Contexto do Projeto

Este é um projeto de expansão da extensão de navegador "Dicionário Pessoal" para uma aplicação desktop que funciona em toda a máquina, não apenas no navegador.

### Extensão Original (Browser)
A extensão original (`../extension/`) oferece:
- Seleção de palavras/frases em páginas web
- Adição de definições personalizadas
- Destaque automático de palavras do dicionário
- Tooltip com definições ao passar o mouse
- Integração com APIs de IA (OpenAI, Anthropic, Google)
- Armazenamento local via Chrome Storage API

### Objetivo da Versão Desktop
Expandir a funcionalidade para funcionar em **qualquer aplicação** do sistema operacional:
- Captura de texto selecionado em qualquer programa (Word, Notepad, PDFs, etc.)
- Sistema de hotkeys global (ex: Ctrl+Shift+D)
- Popup de definições em overlay sobre qualquer aplicação
- Sincronização com o dicionário da extensão do browser
- Funcionalidade offline completa

## Tecnologias Consideradas

### 1. Electron (Recomendada)
**Prós:**
- Reutiliza código HTML/CSS/JS existente da extensão
- Multiplataforma (Windows, Mac, Linux)
- Fácil integração com APIs existentes
- Interface familiar para desenvolvimento web

**Contras:**
- Maior uso de recursos
- Tamanho do executável maior

### 2. Python + Tkinter
**Prós:**
- Leve e eficiente
- Multiplataforma
- Fácil distribuição
- Integração simples com sistema operacional

**Contras:**
- Interface menos polida
- Curva de aprendizado diferente

### 3. AutoHotkey (Windows only)
**Prós:**
- Extremamente leve
- Integração nativa com Windows
- Scripts simples e eficientes

**Contras:**
- Apenas Windows
- Limitações de interface

## Funcionalidades Planejadas

### Fase 1 - MVP
- [ ] Captura de texto selecionado via hotkey global
- [ ] Popup de definição básico
- [ ] Importação do dicionário da extensão
- [ ] Adição/edição de definições

### Fase 2 - Melhorias
- [ ] Sincronização bidirecional com extensão
- [ ] Integração com APIs de IA
- [ ] Configurações avançadas (hotkeys personalizados)
- [ ] Temas e personalização

### Fase 3 - Recursos Avançados
- [ ] Backup automático na nuvem
- [ ] Compartilhamento de dicionários
- [ ] Estatísticas de uso
- [ ] Plugin system

## Estrutura de Arquivos (Planejada)

```
desktop-version/
├── README.md (este arquivo)
├── electron-app/          # Versão Electron
│   ├── main.js            # Processo principal
│   ├── renderer/          # Interface do usuário
│   │   ├── index.html
│   │   ├── popup.html
│   │   ├── styles.css
│   │   └── app.js
│   ├── services/          # Lógica de negócio
│   │   ├── dictionary.js
│   │   ├── clipboard.js
│   │   └── storage.js
│   └── package.json
├── python-app/            # Versão Python (alternativa)
│   ├── main.py
│   ├── gui/
│   ├── services/
│   └── requirements.txt
└── docs/                  # Documentação adicional
    ├── installation.md
    ├── user-guide.md
    └── development.md
```

## Dados Compartilhados

### Formato do Dicionário
O dicionário segue o formato:
```json
{
  "palavra": "definição ou descrição",
  "termo técnico": "explicação detalhada...",
  "acrônimo": "significado expandido"
}
```

### Sincronização
- **Browser Extension**: Chrome Storage Sync API
- **Desktop App**: Arquivo local + opcional sincronização na nuvem
- **Formato comum**: JSON compatível entre ambas versões

## Configurações

### Hotkeys Padrão
- `Ctrl+Shift+D`: Capturar texto selecionado e mostrar definição
- `Ctrl+Alt+D`: Abrir/fechar janela principal do dicionário
- `Esc`: Fechar popup de definição

### Armazenamento
- **Windows**: `%APPDATA%/DicionarioPessoal/dictionary.json`
- **Mac**: `~/Library/Application Support/DicionarioPessoal/dictionary.json`
- **Linux**: `~/.config/DicionarioPessoal/dictionary.json`

## Como Contribuir

1. Clone o repositório
2. Escolha a implementação (Electron/Python)
3. Siga as instruções de setup na pasta correspondente
4. Teste a integração com a extensão existente
5. Submeta PRs com melhorias

## Roadmap de Desenvolvimento

- **Sprint 1** (Semana 1-2): Setup do ambiente Electron + MVP básico
- **Sprint 2** (Semana 3-4): Importação de dados da extensão + UI
- **Sprint 3** (Semana 5-6): Hotkeys globais + popup overlay
- **Sprint 4** (Semana 7-8): Sincronização + polimento

---

**Última atualização**: 20 de Setembro de 2025
**Versão da extensão base**: 1.0