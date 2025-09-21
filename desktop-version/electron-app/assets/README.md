# Ícone da Aplicação

Para a aplicação funcionar corretamente, você precisará adicionar um ícone nas seguintes resoluções:

## Arquivos necessários:
- `assets/icon.png` (512x512 pixels)
- `assets/icon.ico` (para Windows)
- `assets/icon.icns` (para macOS)

## Criação dos ícones:

### Opção 1: Gerar online
Use ferramentas como:
- https://favicon.io/favicon-generator/
- https://realfavicongenerator.net/
- https://convertio.co/png-ico/

### Opção 2: Usar emoji como placeholder
Temporariamente, você pode usar um emoji como ícone:

```bash
# No Windows com PowerShell:
# Baixar um ícone de exemplo
Invoke-WebRequest -Uri "https://via.placeholder.com/512x512/0066cc/ffffff?text=📚" -OutFile "assets/icon.png"
```

### Opção 3: Criar com código
Use a biblioteca `sharp` para gerar um ícone simples:

```javascript
const sharp = require('sharp');

// Criar ícone SVG simples
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0066cc" rx="64"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="240" 
        text-anchor="middle" fill="white" font-weight="bold">📚</text>
</svg>
`;

// Converter para PNG
sharp(Buffer.from(svgIcon))
  .png()
  .toFile('assets/icon.png');
```

## Estrutura final dos assets:
```
assets/
├── icon.png     # 512x512 - Universal
├── icon.ico     # Windows
├── icon.icns    # macOS
└── README.md    # Este arquivo
```

Por enquanto, crie um arquivo icon.png básico para a aplicação inicializar sem erros.