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

// Mostra modal para adicionar descrição
function showModal(selectedText) {
  hideModal();
  
  modal = document.createElement('div');
  modal.className = 'dicionario-modal';
  modal.innerHTML = `
    <div class="dicionario-modal-content">
      <div class="dicionario-modal-header">
        <h3>Adicionar ao Dicionário</h3>
        <span class="dicionario-modal-close">&times;</span>
      </div>
      <div class="dicionario-modal-body">
        <label>Palavra/Frase:</label>
        <input type="text" id="dicionario-word" value="${selectedText}" readonly>
        <label>Descrição:</label>
        <textarea id="dicionario-desc" placeholder="Digite a descrição..." rows="3"></textarea>
        <button id="dicionario-save">Salvar</button>
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
      return;
    }
    
    dictionary[word] = desc;
    chrome.storage.sync.set({dictionary: dictionary}, function() {
      modal.querySelector('#dicionario-message').textContent = 'Salvo com sucesso!';
      setTimeout(() => {
        hideModal();
        highlightWords();
      }, 1000);
    });
  };
  
  // Foca no campo de descrição
  modal.querySelector('#dicionario-desc').focus();
}

// Esconde modal
function hideModal() {
  if (modal) {
    modal.remove();
    modal = null;
  }
}

// Mostra tooltip editável ao passar mouse sobre palavras destacadas
document.addEventListener('mouseover', function(e) {
  if (e.target.classList.contains('dicionario-highlight')) {
    const word = e.target.getAttribute('data-word');
    const desc = e.target.getAttribute('data-desc');
    showTooltip(e, word, desc);
  }
});

document.addEventListener('mouseout', function(e) {
  if (e.target.classList.contains('dicionario-highlight')) {
    hideTooltip();
  }
});

// Mostra tooltip com opção de editar
function showTooltip(event, word, desc) {
  hideTooltip();
  
  tooltip = document.createElement('div');
  tooltip.className = 'dicionario-tooltip';
  tooltip.innerHTML = `
    <div class="dicionario-tooltip-content">
      <strong>${word}</strong>
      <p>${desc}</p>
      <button class="dicionario-edit-btn" onclick="editWord('${word}', '${desc}')">Editar</button>
    </div>
  `;
  
  tooltip.style.left = event.pageX + 'px';
  tooltip.style.top = (event.pageY - 10) + 'px';
  
  document.body.appendChild(tooltip);
}

// Esconde tooltip
function hideTooltip() {
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
}

// Função global para editar palavra
window.editWord = function(word, currentDesc) {
  hideTooltip();
  
  modal = document.createElement('div');
  modal.className = 'dicionario-modal';
  modal.innerHTML = `
    <div class="dicionario-modal-content">
      <div class="dicionario-modal-header">
        <h3>Editar Descrição</h3>
        <span class="dicionario-modal-close">&times;</span>
      </div>
      <div class="dicionario-modal-body">
        <label>Palavra/Frase:</label>
        <input type="text" value="${word}" readonly>
        <label>Descrição:</label>
        <textarea id="dicionario-desc" rows="3">${currentDesc}</textarea>
        <button id="dicionario-save">Salvar</button>
        <button id="dicionario-delete" style="background: #dc3545;">Excluir</button>
        <div id="dicionario-message"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  modal.querySelector('.dicionario-modal-close').onclick = hideModal;
  modal.onclick = function(e) {
    if (e.target === modal) hideModal();
  };
  
  modal.querySelector('#dicionario-save').onclick = function() {
    const desc = modal.querySelector('#dicionario-desc').value.trim();
    
    if (!desc) {
      modal.querySelector('#dicionario-message').textContent = 'A descrição não pode estar vazia!';
      return;
    }
    
    dictionary[word] = desc;
    chrome.storage.sync.set({dictionary: dictionary}, function() {
      modal.querySelector('#dicionario-message').textContent = 'Atualizado com sucesso!';
      setTimeout(() => {
        hideModal();
        highlightWords();
      }, 1000);
    });
  };
  
  modal.querySelector('#dicionario-delete').onclick = function() {
    if (confirm('Tem certeza que deseja excluir esta entrada?')) {
      delete dictionary[word];
      chrome.storage.sync.set({dictionary: dictionary}, function() {
        hideModal();
        highlightWords();
      });
    }
  };
};

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
    background: rgba(255, 255, 0, 0.3);
    cursor: help;
    border-radius: 3px;
    padding: 1px 2px;
    transition: background 0.2s;
  }
  
  .dicionario-highlight:hover {
    background: rgba(255, 255, 0, 0.6);
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
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  
  .dicionario-modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .dicionario-modal-header h3 {
    margin: 0;
    color: #333;
  }
  
  .dicionario-modal-close {
    font-size: 24px;
    cursor: pointer;
    color: #999;
  }
  
  .dicionario-modal-close:hover {
    color: #333;
  }
  
  .dicionario-modal-body {
    padding: 20px;
  }
  
  .dicionario-modal-body label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
  }
  
  .dicionario-modal-body input,
  .dicionario-modal-body textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 10px;
    font-family: inherit;
  }
  
  .dicionario-modal-body button {
    background: #007cba;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
    margin-bottom: 10px;
  }
  
  .dicionario-modal-body button:hover {
    background: #005a8a;
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
  }
  
  .dicionario-tooltip-content strong {
    display: block;
    margin-bottom: 5px;
    color: #ffd700;
  }
  
  .dicionario-tooltip-content p {
    margin: 0 0 10px 0;
    line-height: 1.4;
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
    padding: 5px;
    border-radius: 3px;
    font-size: 14px;
  }
`;
document.head.appendChild(style);
