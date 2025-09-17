// Variáveis globais
let dictionary = {};
let selectionButton = null;
let modal = null;
let tooltip = null;

// Função para escapar regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Carrega o dicionário e destaca palavras
function loadDictionaryAndHighlight() {
  chrome.storage.sync.get({dictionary: {}}, function(data) {
    dictionary = data.dictionary;
    highlightWords();
  });
}

// Destaca palavras do dicionário na página
function highlightWords() {
  // Remove destaques anteriores
  const oldHighlights = document.querySelectorAll('.dicionario-highlight');
  oldHighlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
  });

  if (!dictionary || Object.keys(dictionary).length === 0) return;

  const body = document.body;
  for (const word in dictionary) {
    if (!word) continue;
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    walkAndHighlight(body, regex, word, dictionary[word]);
  }
}

function walkAndHighlight(node, regex, originalWord, desc) {
  if (node.nodeType === 3) { // texto
    const match = node.nodeValue.match(regex);
    if (match) {
      const span = document.createElement('span');
      span.innerHTML = node.nodeValue.replace(regex, (m) => 
        `<span class='dicionario-highlight' data-word='${originalWord}' data-desc='${desc}'>${m}</span>`
      );
      node.replaceWith(span);
    }
  } else if (node.nodeType === 1 && node.childNodes && !['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(node.tagName)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      walkAndHighlight(node.childNodes[i], regex, originalWord, desc);
    }
  }
}

// Detecta seleção de texto e mostra botão
document.addEventListener('mouseup', function(e) {
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    hideSelectionButton();
    
    if (selectedText && selectedText.length > 0) {
      showSelectionButton(e, selectedText);
    }
  }, 10);
});

// Mostra botão próximo à seleção
function showSelectionButton(event, selectedText) {
  hideSelectionButton();
  
  selectionButton = document.createElement('div');
  selectionButton.className = 'dicionario-selection-btn';
  selectionButton.innerHTML = '📝';
  selectionButton.title = 'Adicionar ao dicionário';
  
  // Posiciona o botão próximo ao cursor
  selectionButton.style.left = (event.pageX + 10) + 'px';
  selectionButton.style.top = (event.pageY - 30) + 'px';
  
  selectionButton.onclick = function(e) {
    e.stopPropagation();
    showModal(selectedText);
    hideSelectionButton();
  };
  
  document.body.appendChild(selectionButton);
}

// Esconde botão de seleção
function hideSelectionButton() {
  if (selectionButton) {
    selectionButton.remove();
    selectionButton = null;
  }
}

// Mostra modal para adicionar/editar descrição
function showModal(selectedText) {
  hideModal();
  
  // Verifica se a palavra já existe no dicionário
  const existingDesc = dictionary[selectedText] || '';
  const isEditing = existingDesc !== '';
  const modalTitle = isEditing ? 'Editar Descrição' : 'Adicionar ao Dicionário';
  const buttonText = isEditing ? 'Atualizar' : 'Salvar';
  
  modal = document.createElement('div');
  modal.className = 'dicionario-modal';
  modal.innerHTML = `
    <div class="dicionario-modal-content">
      <div class="dicionario-modal-header">
        <h3>${modalTitle}</h3>
        <div class="dicionario-header-buttons">
          <button id="dicionario-config" class="dicionario-config-header-btn" title="Configurar IA">⚙️</button>
          <span class="dicionario-modal-close">&times;</span>
        </div>
      </div>
      <div class="dicionario-modal-body">
        <label>Palavra/Frase:</label>
        <input type="text" id="dicionario-word" value="${selectedText}" readonly>
        <label>Descrição: <button id="dicionario-ai-btn" class="dicionario-ai-btn-inline" title="Gerar descrição com IA">🤖 IA</button></label>
        <textarea id="dicionario-desc" placeholder="Digite a descrição..." rows="3">${existingDesc}</textarea>
        <div class="dicionario-modal-buttons">
          <button id="dicionario-save">${buttonText}</button>
          ${isEditing ? '<button id="dicionario-delete" class="dicionario-delete-btn">Excluir</button>' : ''}
        </div>
        <div id="dicionario-message"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners do modal
  modal.querySelector('.dicionario-modal-close').onclick = hideModal;
  modal.onclick = function(e) {
    if (e.target === modal) hideModal();
  };
  
  modal.querySelector('#dicionario-save').onclick = function() {
    const word = modal.querySelector('#dicionario-word').value.trim();
    const desc = modal.querySelector('#dicionario-desc').value.trim();
    
    if (!word || !desc) {
      modal.querySelector('#dicionario-message').textContent = 'Preencha todos os campos!';
      modal.querySelector('#dicionario-message').style.color = '#dc3545';
      return;
    }
    
    dictionary[word] = desc;
    chrome.storage.sync.set({dictionary: dictionary}, function() {
      const successMessage = isEditing ? 'Atualizado com sucesso!' : 'Salvo com sucesso!';
      modal.querySelector('#dicionario-message').textContent = successMessage;
      modal.querySelector('#dicionario-message').style.color = '#28a745';
      setTimeout(() => {
        hideModal();
        highlightWords();
      }, 1000);
    });
  };
  
  // Event listener para botão de excluir (se existir)
  const deleteBtn = modal.querySelector('#dicionario-delete');
  if (deleteBtn) {
    deleteBtn.onclick = function() {
      if (confirm(`Tem certeza que deseja excluir "${selectedText}" do dicionário?`)) {
        delete dictionary[selectedText];
        chrome.storage.sync.set({dictionary: dictionary}, function() {
          modal.querySelector('#dicionario-message').textContent = 'Excluído com sucesso!';
          modal.querySelector('#dicionario-message').style.color = '#28a745';
          setTimeout(() => {
            hideModal();
            highlightWords();
          }, 1000);
        });
      }
    };
  }
  
  // Event listener para botão de IA
  modal.querySelector('#dicionario-ai-btn').onclick = function(e) {
    e.preventDefault();
    generateAIDescription(selectedText);
  };
  
  // Event listener para botão de configuração
  modal.querySelector('#dicionario-config').onclick = function(e) {
    e.preventDefault();
    showAIConfigModal();
  };
  
  // Foca no campo de descrição e seleciona o texto se estiver editando
  const descField = modal.querySelector('#dicionario-desc');
  descField.focus();
  if (isEditing) {
    descField.setSelectionRange(0, descField.value.length);
  }
}

// Esconde modal
function hideModal() {
  if (modal) {
    modal.remove();
    modal = null;
  }
}

// Variáveis para controlar o tooltip
let tooltipTimeout = null;
let currentTooltipWord = null;

// Mostra tooltip editável ao passar mouse sobre palavras destacadas
document.addEventListener('mouseover', function(e) {
  if (e.target.classList.contains('dicionario-highlight')) {
    clearTimeout(tooltipTimeout);
    const word = e.target.getAttribute('data-word');
    const desc = e.target.getAttribute('data-desc');
    
    // Só mostra novo tooltip se for uma palavra diferente
    if (currentTooltipWord !== word) {
      showTooltip(e, word, desc);
      currentTooltipWord = word;
    }
  } else if (e.target.closest('.dicionario-tooltip')) {
    // Cancela o fechamento se o mouse entrou no tooltip
    clearTimeout(tooltipTimeout);
  }
});

document.addEventListener('mouseout', function(e) {
  if (e.target.classList.contains('dicionario-highlight')) {
    // Só inicia o timeout se o mouse não foi para o tooltip
    if (!e.relatedTarget?.closest('.dicionario-tooltip')) {
      tooltipTimeout = setTimeout(() => {
        hideTooltip();
        currentTooltipWord = null;
      }, 300);
    }
  } else if (e.target.closest('.dicionario-tooltip') && !e.relatedTarget?.closest('.dicionario-tooltip') && !e.relatedTarget?.classList.contains('dicionario-highlight')) {
    // Fecha o tooltip quando sai completamente dele e não vai para uma palavra destacada
    tooltipTimeout = setTimeout(() => {
      hideTooltip();
      currentTooltipWord = null;
    }, 100);
  }
});

// Mostra tooltip com opção de editar
function showTooltip(event, word, desc) {
  // Se já existe tooltip para a mesma palavra, não cria novo
  if (tooltip && currentTooltipWord === word) {
    return;
  }
  
  hideTooltip();
  
  tooltip = document.createElement('div');
  tooltip.className = 'dicionario-tooltip';
  tooltip.innerHTML = `
    <div class="dicionario-tooltip-content">
      <strong class="dicionario-tooltip-word" title="Clique para editar">${word}</strong>
      <p class="dicionario-tooltip-desc">${desc}</p>
    </div>
  `;
  
  // Posiciona o tooltip acima da palavra
  const x = event.pageX;
  const y = event.pageY - 70; // Posiciona acima da palavra
  
  tooltip.style.left = x + 'px';
  tooltip.style.top = Math.max(10, y) + 'px'; // Evita que saia da tela
  
  document.body.appendChild(tooltip);
  
  // Ajusta posição se estiver muito próximo da borda direita
  const tooltipRect = tooltip.getBoundingClientRect();
  if (tooltipRect.right > window.innerWidth - 10) {
    tooltip.style.left = (x - tooltipRect.width - 10) + 'px';
  }
  
  // Adiciona event listener para clicar na palavra
  const wordElement = tooltip.querySelector('.dicionario-tooltip-word');
  wordElement.addEventListener('click', function(e) {
    e.stopPropagation();
    editWordFromTooltip(word, desc);
  });
}

// Esconde tooltip
function hideTooltip() {
  clearTimeout(tooltipTimeout);
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
  currentTooltipWord = null;
}

// Função para editar palavra (reutiliza a função showModal)
function editWordFromTooltip(word, currentDesc) {
  hideTooltip();
  showModal(word);
}

// Funções para integração com IA
function showAIConfigModal() {
  const configModal = document.createElement('div');
  configModal.className = 'dicionario-modal';
  configModal.innerHTML = `
    <div class="dicionario-modal-content">
      <div class="dicionario-modal-header">
        <h3>⚙️ Configuração da IA</h3>
        <span class="dicionario-modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
      </div>
      <div class="dicionario-modal-body">
        <label>Provedor de IA:</label>
        <select id="ai-provider">
          <option value="openai">ChatGPT (OpenAI)</option>
          <option value="anthropic">Claude (Anthropic)</option>
          <option value="google">Gemini (Google)</option>
        </select>
        
        <label>API Key:</label>
        <input type="password" id="ai-api-key" placeholder="Sua chave da API">
        
        <label>Modelo:</label>
        <select id="ai-model">
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="gemini-pro">Gemini Pro</option>
          <option value="gemini-pro-vision">Gemini Pro Vision</option>
        </select>
        
        <div class="dicionario-modal-buttons">
          <button id="save-ai-config">Salvar Configuração</button>
          <button onclick="this.closest('.dicionario-modal').remove()">Cancelar</button>
        </div>
        
        <div class="ai-info">
          <p><strong>Como obter as chaves:</strong></p>
          <p>• <strong>OpenAI:</strong> platform.openai.com/api-keys</p>
          <p>• <strong>Anthropic:</strong> console.anthropic.com/</p>
          <p>• <strong>Google:</strong> aistudio.google.com/app/apikey</p>
        </div>
        
        <div id="ai-config-message"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(configModal);
  
  // Carrega configurações salvas
  chrome.storage.sync.get({aiConfig: {}}, function(data) {
    const config = data.aiConfig;
    if (config.provider) {
      configModal.querySelector('#ai-provider').value = config.provider;
      updateModelOptions(config.provider, configModal);
    }
    if (config.apiKey) {
      configModal.querySelector('#ai-api-key').value = config.apiKey;
    }
    if (config.model) {
      configModal.querySelector('#ai-model').value = config.model;
    }
  });
  
  // Event listener para mudança de provedor
  configModal.querySelector('#ai-provider').onchange = function() {
    updateModelOptions(this.value, configModal);
  };
  
  // Event listener para salvar configuração
  configModal.querySelector('#save-ai-config').onclick = function() {
    const config = {
      provider: configModal.querySelector('#ai-provider').value,
      apiKey: configModal.querySelector('#ai-api-key').value.trim(),
      model: configModal.querySelector('#ai-model').value
    };
    
    if (!config.apiKey) {
      configModal.querySelector('#ai-config-message').textContent = 'Por favor, insira a API Key!';
      configModal.querySelector('#ai-config-message').style.color = '#dc3545';
      return;
    }
    
    chrome.storage.sync.set({aiConfig: config}, function() {
      configModal.querySelector('#ai-config-message').textContent = 'Configuração salva!';
      configModal.querySelector('#ai-config-message').style.color = '#28a745';
      setTimeout(() => {
        configModal.remove();
      }, 1500);
    });
  };
}

function updateModelOptions(provider, configModal) {
  const modelSelect = configModal.querySelector('#ai-model');
  modelSelect.innerHTML = '';
  
  const models = {
    openai: [
      {value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo'},
      {value: 'gpt-4', text: 'GPT-4'},
      {value: 'gpt-4-turbo', text: 'GPT-4 Turbo'}
    ],
    anthropic: [
      {value: 'claude-3-haiku-20240307', text: 'Claude 3 Haiku'},
      {value: 'claude-3-sonnet-20240229', text: 'Claude 3 Sonnet'},
      {value: 'claude-3-opus-20240229', text: 'Claude 3 Opus'}
    ],
    google: [
      {value: 'gemini-2.5-flash-lite', text: 'Gemini 2.5 Flash Lite'},
    ]
  };
  
  models[provider].forEach(model => {
    const option = document.createElement('option');
    option.value = model.value;
    option.textContent = model.text;
    modelSelect.appendChild(option);
  });
}

// Função para coletar contexto da página
function getPageContext(word) {
  const context = {
    pageTitle: document.title,
    pageUrl: window.location.href,
    wordOccurrences: []
  };
  
  // Busca trechos onde a palavra aparece
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Ignora scripts, styles e outros elementos não visíveis
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const wordRegex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
  let textNode;
  
  while (textNode = walker.nextNode()) {
    const text = textNode.textContent;
    const matches = text.match(wordRegex);
    
    if (matches && matches.length > 0) {
      // Extrai contexto ao redor da palavra (50 caracteres antes e depois)
      const wordIndex = text.toLowerCase().indexOf(word.toLowerCase());
      if (wordIndex !== -1) {
        const start = Math.max(0, wordIndex - 50);
        const end = Math.min(text.length, wordIndex + word.length + 50);
        const excerpt = text.substring(start, end).trim();
        
        if (excerpt && context.wordOccurrences.length < 3) { // Limita a 3 ocorrências
          context.wordOccurrences.push(excerpt);
        }
      }
    }
  }
  
  return context;
}

async function generateAIDescription(word) {
  const aiBtn = modal.querySelector('#dicionario-ai-btn');
  const descField = modal.querySelector('#dicionario-desc');
  const messageDiv = modal.querySelector('#dicionario-message');
  
  // Coleta contexto da página
  const pageContext = getPageContext(word);
  
  // Verifica se há configuração de IA
  chrome.storage.sync.get({aiConfig: {}}, async function(data) {
    const config = data.aiConfig;
    
    if (!config.apiKey || !config.provider) {
      messageDiv.textContent = 'Configure a IA primeiro clicando em "⚙️ Config IA"';
      messageDiv.style.color = '#dc3545';
      return;
    }
    
    // Mostra estado de carregamento
    aiBtn.textContent = '⏳ Gerando...';
    aiBtn.disabled = true;
    messageDiv.textContent = 'Gerando descrição...';
    messageDiv.style.color = '#007cba';
    
    try {
      let description;
      
      switch (config.provider) {
        case 'openai':
          description = await callOpenAI(word, config, pageContext);
          break;
        case 'anthropic':
          description = await callClaude(word, config, pageContext);
          break;
        case 'google':
          description = await callGemini(word, config, pageContext);
          break;
        default:
          throw new Error('Provedor não suportado');
      }
      
      descField.value = description.trim();
      messageDiv.textContent = 'Descrição gerada com sucesso!';
      messageDiv.style.color = '#28a745';
      
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      messageDiv.textContent = 'Erro ao gerar descrição: ' + error.message;
      messageDiv.style.color = '#dc3545';
    } finally {
      aiBtn.textContent = '🤖 IA';
      aiBtn.disabled = false;
    }
  });
}

async function callOpenAI(word, config, pageContext) {
  // Constrói o prompt com contexto
  let contextPrompt = `Defina brevemente a palavra ou frase: "${word}"`;
  
  if (pageContext.pageTitle) {
    contextPrompt += `\n\nContexto da página: "${pageContext.pageTitle}"`;
  }
  
  if (pageContext.wordOccurrences && pageContext.wordOccurrences.length > 0) {
    contextPrompt += `\n\nTrechos onde a palavra aparece:`;
    pageContext.wordOccurrences.forEach((excerpt, index) => {
      contextPrompt += `\n${index + 1}. "${excerpt}"`;
    });
  }
  
  contextPrompt += `\n\nCom base no contexto acima, forneça uma definição clara e específica da palavra/frase.`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente que cria definições claras e concisas para palavras e frases baseando-se no contexto fornecido. Responda apenas com a definição, sem explicações adicionais ou menção do contexto.'
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`Erro da API: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaude(word, config, pageContext) {
  // Constrói o prompt com contexto
  let contextPrompt = `Defina brevemente a palavra ou frase: "${word}"`;
  
  if (pageContext.pageTitle) {
    contextPrompt += `\n\nContexto da página: "${pageContext.pageTitle}"`;
  }
  
  if (pageContext.wordOccurrences && pageContext.wordOccurrences.length > 0) {
    contextPrompt += `\n\nTrechos onde a palavra aparece:`;
    pageContext.wordOccurrences.forEach((excerpt, index) => {
      contextPrompt += `\n${index + 1}. "${excerpt}"`;
    });
  }
  
  contextPrompt += `\n\nCom base no contexto acima, forneça uma definição clara e específica da palavra/frase. Responda apenas com a definição, sem explicações adicionais ou menção do contexto.`;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: contextPrompt
        }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Erro da API: ${response.status}`);
  }
  
  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(word, config, pageContext) {
  // Constrói o prompt com contexto
  let contextPrompt = `Defina brevemente a palavra ou frase: "${word}"`;
  
  if (pageContext.pageTitle) {
    contextPrompt += `\n\nContexto da página: "${pageContext.pageTitle}"`;
  }
  
  if (pageContext.wordOccurrences && pageContext.wordOccurrences.length > 0) {
    contextPrompt += `\n\nTrechos onde a palavra aparece:`;
    pageContext.wordOccurrences.forEach((excerpt, index) => {
      contextPrompt += `\n${index + 1}. "${excerpt}"`;
    });
  }
  
  contextPrompt += `\n\nCom base no contexto acima, forneça uma definição clara e específica da palavra/frase. Responda apenas com a definição, sem explicações adicionais ou menção do contexto.`;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: contextPrompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Erro da API: ${response.status}`);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Torna a função disponível globalmente para o popup
window.editWordFromTooltip = editWordFromTooltip;
window.showModal = showModal;

// Event listeners para esconder elementos ao clicar fora
document.addEventListener('click', function(e) {
  if (!e.target.closest('.dicionario-selection-btn')) {
    hideSelectionButton();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    hideSelectionButton();
    hideModal();
    hideTooltip();
  }
});

// Inicializa a extensão
loadDictionaryAndHighlight();

// Recarrega quando há mudanças no storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.dictionary) {
    loadDictionaryAndHighlight();
  }
});

// Estilos CSS
const style = document.createElement('style');
style.textContent = `
  .dicionario-highlight {
    background: transparent;
    cursor: help;
    border-bottom: 2px dotted #ffd700;
    text-decoration: none;
    transition: border-color 0.2s;
  }
  
  .dicionario-highlight:hover {
    border-bottom-color: #ffb000;
    border-bottom-width: 3px;
  }
  
  .dicionario-selection-btn {
    position: absolute;
    z-index: 10000;
    background: #007cba;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: transform 0.2s;
  }
  
  .dicionario-selection-btn:hover {
    transform: scale(1.1);
    background: #005a8a;
  }
  
  .dicionario-modal {
    position: fixed;
    z-index: 10001;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  }
  
  .dicionario-modal-content {
    background: rgba(26, 32, 44, 0.95);
    border: 1px solid rgba(74, 85, 104, 0.3);
    border-radius: 12px;
    width: 90%;
    max-width: 420px;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
    backdrop-filter: blur(10px);
  }
  
  .dicionario-modal-header {
    padding: 24px 24px 16px 24px;
    border-bottom: 1px solid rgba(74, 85, 104, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .dicionario-modal-header h3 {
    margin: 0;
    color: #f7fafc;
    font-size: 18px;
    font-weight: 500;
    letter-spacing: -0.025em;
  }
  
  .dicionario-header-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .dicionario-config-header-btn {
    background: transparent;
    color: #a0aec0;
    border: 1px solid rgba(160, 174, 192, 0.2);
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .dicionario-config-header-btn:hover {
    background: rgba(160, 174, 192, 0.1);
    border-color: rgba(160, 174, 192, 0.4);
    color: #e2e8f0;
  }
  
  .dicionario-modal-close {
    font-size: 20px;
    cursor: pointer;
    color: #a0aec0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .dicionario-modal-close:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f56565;
  }
  
  .dicionario-modal-body {
    padding: 16px 24px 24px 24px;
  }
  
  .dicionario-modal-body label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #cbd5e0;
    font-size: 14px;
    letter-spacing: 0.025em;
  }
  
  .dicionario-modal-body input,
  .dicionario-modal-body textarea,
  .dicionario-modal-body select {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid rgba(74, 85, 104, 0.3);
    border-radius: 8px;
    margin-bottom: 16px;
    font-family: inherit;
    background: rgba(26, 32, 44, 0.5);
    color: #e2e8f0;
    font-size: 14px;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }
  
  .dicionario-modal-body input:focus,
  .dicionario-modal-body textarea:focus,
  .dicionario-modal-body select:focus {
    outline: none;
    border-color: rgba(66, 153, 225, 0.6);
    background: rgba(26, 32, 44, 0.8);
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }
  
  .dicionario-modal-body textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .dicionario-ai-btn-inline {
    background: transparent;
    color: #a78bfa;
    border: 1px solid rgba(167, 139, 250, 0.3);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 12px;
    vertical-align: middle;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  
  .dicionario-ai-btn-inline:hover {
    background: rgba(167, 139, 250, 0.1);
    border-color: rgba(167, 139, 250, 0.5);
    color: #c4b5fd;
  }
  
  .dicionario-ai-btn-inline:disabled {
    background: transparent;
    color: #6b7280;
    border-color: rgba(107, 114, 128, 0.3);
    cursor: not-allowed;
  }
  
  .dicionario-modal-buttons {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  
  .dicionario-modal-body button {
    background: transparent;
    color: #e2e8f0;
    border: 1px solid rgba(226, 232, 240, 0.2);
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    flex: 1;
    min-width: 120px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    letter-spacing: 0.025em;
  }
  
  .dicionario-modal-body button:hover {
    background: rgba(226, 232, 240, 0.1);
    border-color: rgba(226, 232, 240, 0.4);
    transform: translateY(-1px);
  }
  
  .dicionario-modal-body button:active {
    transform: translateY(0);
  }
  
  .dicionario-delete-btn {
    color: #fc8181 !important;
    border-color: rgba(252, 129, 129, 0.3) !important;
  }
  
  .dicionario-delete-btn:hover {
    background: rgba(252, 129, 129, 0.1) !important;
    border-color: rgba(252, 129, 129, 0.5) !important;
    color: #f56565 !important;
  }
  

  

  
  .ai-info {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(74, 85, 104, 0.2);
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    font-size: 12px;
    line-height: 1.5;
  }
  
  .ai-info p {
    margin: 6px 0;
    color: #a0aec0;
  }
  
  .ai-info strong {
    color: #63b3ed;
    font-weight: 600;
  }
  
  .dicionario-tooltip {
    position: absolute;
    z-index: 10002;
    background: rgba(45, 55, 72, 0.95);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    max-width: 280px;
    box-shadow: 
      0 10px 25px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    pointer-events: auto;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .dicionario-tooltip:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 15px 35px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.15);
  }
  
  .dicionario-tooltip-word {
    display: block;
    margin-bottom: 8px;
    color: #ffd700;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    font-weight: 600;
  }
  
  .dicionario-tooltip-word:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
    color: #ffed4e;
    transform: translateY(-1px);
  }
  
  .dicionario-tooltip-desc {
    margin: 0;
    line-height: 1.5;
    user-select: text;
    cursor: text;
    color: #e2e8f0;
    font-size: 15px;
  }
  

  
  #dicionario-message {
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    text-align: center;
    font-weight: 500;
    transition: all 0.3s ease;
    letter-spacing: 0.025em;
  }
  
  #dicionario-message:not(:empty) {
    border: 1px solid rgba(74, 85, 104, 0.3);
    background: rgba(0, 0, 0, 0.2);
  }
  
  #ai-config-message {
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    text-align: center;
    font-weight: 500;
    transition: all 0.3s ease;
    letter-spacing: 0.025em;
  }
  
  #ai-config-message:not(:empty) {
    border: 1px solid rgba(74, 85, 104, 0.3);
    background: rgba(0, 0, 0, 0.2);
  }
`;
document.head.appendChild(style);
