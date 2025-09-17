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
        <span class="dicionario-modal-close">&times;</span>
      </div>
      <div class="dicionario-modal-body">
        <label>Palavra/Frase:</label>
        <input type="text" id="dicionario-word" value="${selectedText}" readonly>
        <label>Descrição:</label>
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
      <strong class="dicionario-tooltip-word">${word}</strong>
      <p class="dicionario-tooltip-desc">${desc}</p>
      <button class="dicionario-edit-btn">Editar</button>
    </div>
  `;
  
  // Posiciona o tooltip acima da palavra para facilitar o acesso ao botão
  const x = event.pageX;
  const y = event.pageY - 80; // Posiciona acima da palavra
  
  tooltip.style.left = x + 'px';
  tooltip.style.top = Math.max(10, y) + 'px'; // Evita que saia da tela
  
  document.body.appendChild(tooltip);
  
  // Ajusta posição se estiver muito próximo da borda direita
  const tooltipRect = tooltip.getBoundingClientRect();
  if (tooltipRect.right > window.innerWidth - 10) {
    tooltip.style.left = (x - tooltipRect.width - 10) + 'px';
  }
  
  // Adiciona event listener para o botão editar
  const editBtn = tooltip.querySelector('.dicionario-edit-btn');
  editBtn.addEventListener('click', function(e) {
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
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dicionario-modal-content {
    background: #2d3748;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    color: #e2e8f0;
  }
  
  .dicionario-modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid #4a5568;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .dicionario-modal-header h3 {
    margin: 0;
    color: #f7fafc;
  }
  
  .dicionario-modal-close {
    font-size: 24px;
    cursor: pointer;
    color: #a0aec0;
  }
  
  .dicionario-modal-close:hover {
    color: #f7fafc;
  }
  
  .dicionario-modal-body {
    padding: 20px;
  }
  
  .dicionario-modal-body label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #f7fafc;
  }
  
  .dicionario-modal-body input,
  .dicionario-modal-body textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #4a5568;
    border-radius: 4px;
    margin-bottom: 10px;
    font-family: inherit;
    background: #1a202c;
    color: #e2e8f0;
  }
  
  .dicionario-modal-body input:focus,
  .dicionario-modal-body textarea:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }
  
  .dicionario-modal-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .dicionario-modal-body button {
    background: #007cba;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
  }
  
  .dicionario-modal-body button:hover {
    background: #005a8a;
  }
  
  .dicionario-delete-btn {
    background: #dc3545 !important;
  }
  
  .dicionario-delete-btn:hover {
    background: #c82333 !important;
  }
  
  .dicionario-tooltip {
    position: absolute;
    z-index: 10002;
    background: #333;
    color: white;
    padding: 10px;
    border-radius: 6px;
    max-width: 250px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    pointer-events: auto;
    transition: opacity 0.2s;
  }
  
  .dicionario-tooltip:hover {
    opacity: 1;
  }
  
  .dicionario-tooltip-word {
    display: block;
    margin-bottom: 5px;
    color: #ffd700;
    user-select: text;
    cursor: text;
  }
  
  .dicionario-tooltip-desc {
    margin: 0 0 10px 0;
    line-height: 1.4;
    user-select: text;
    cursor: text;
  }
  
  .dicionario-edit-btn {
    background: #007cba;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .dicionario-edit-btn:hover {
    background: #005a8a;
  }
  
  #dicionario-message {
    margin-top: 10px;
    padding: 8px;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
    font-weight: bold;
    transition: all 0.3s ease;
  }
  
  #dicionario-message:not(:empty) {
    border: 1px solid currentColor;
    background: rgba(0, 0, 0, 0.3);
  }
`;
document.head.appendChild(style);
