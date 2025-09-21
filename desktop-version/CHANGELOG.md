# Changelog - Dicionário Desktop

Todas as mudanças notáveis deste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Planejado
- Sistema de captura global de texto selecionado
- Interface de popup overlay
- Importação de dicionário da extensão browser
- Sincronização bidirecional com extensão
- Sistema de hotkeys configuráveis
- Suporte multiplataforma (Windows, Mac, Linux)

## [0.1.0] - 2025-09-20

### Adicionado
- Estrutura inicial do projeto desktop
- Documentação base (README.md, CONFIG.md)
- Planejamento de arquitetura e tecnologias
- Definição de formato de dados compatível com extensão
- Roadmap de desenvolvimento

### Contexto da Extensão Original
- **Funcionalidade base**: Dicionário pessoal em navegador
- **Recursos**: Seleção de texto, definições personalizadas, destaque automático
- **Integração IA**: OpenAI, Anthropic, Google AI
- **Armazenamento**: Chrome Storage Sync API
- **Versão atual**: 1.0

### Decisões Técnicas
- **Tecnologia principal**: Electron (reutilização de código web existente)
- **Alternativas**: Python + Tkinter, AutoHotkey
- **Formato de dados**: JSON compatível com extensão
- **Hotkeys padrão**: Ctrl+Shift+D (captura), Ctrl+Alt+D (toggle)

---

## Modelo para Próximas Versões

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Adicionado
- Novas funcionalidades

### Modificado
- Mudanças em funcionalidades existentes

### Depreciado
- Funcionalidades que serão removidas em versões futuras

### Removido
- Funcionalidades removidas

### Corrigido
- Correções de bugs

### Segurança
- Correções de vulnerabilidades
```