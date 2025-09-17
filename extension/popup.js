// Carrega e exibe o dicionário no popup
function loadDictionary() {
  chrome.storage.sync.get({dictionary: {}}, function(data) {
    const dictionary = data.dictionary;
    const listElement = document.getElementById('dictionaryList');
    const statsContainer = document.getElementById('statsContainer');
    const actionsContainer = document.getElementById('actionsContainer');
    const wordCount = document.getElementById('wordCount');
    
    const wordKeys = Object.keys(dictionary);
    const totalWords = wordKeys.length;
    
    // Atualiza estatísticas e ações
    if (totalWords > 0) {
      wordCount.textContent = totalWords;
      statsContainer.style.display = 'block';
      actionsContainer.style.display = 'block';
    } else {
      statsContainer.style.display = 'none';
      actionsContainer.style.display = 'none';
    }
    
    if (!dictionary || totalWords === 0) {
      listElement.innerHTML = '<div class="empty-state">Nenhuma palavra salva ainda.<br><br>Selecione uma palavra em qualquer página e clique no botão 📝 para começar!</div>';
      return;
    }
    
    // Ordena palavras alfabeticamente
    const sortedWords = wordKeys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    let html = '';
    sortedWords.forEach(word => {
      const description = dictionary[word];
      const truncatedDesc = description.length > 80 ? description.substring(0, 80) + '...' : description;
      
      html += `
        <div class="word-item word-item-clickable" onclick="editWord('${word.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'")}')">
          <div class="word-text">${word}</div>
          <div class="word-desc">${truncatedDesc}</div>
        </div>
      `;
    });
    
    listElement.innerHTML = html;
  });
}

// Função para limpar todas as palavras
function clearAllWords() {
  if (confirm('⚠️ Tem certeza que deseja excluir TODAS as palavras do dicionário?\n\nEsta ação não pode ser desfeita.')) {
    chrome.storage.sync.set({dictionary: {}}, function() {
      loadDictionary();
      // Notifica as páginas ativas para remover os destaques
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
            chrome.scripting.executeScript({
              target: {tabId: tab.id},
              func: () => {
                if (typeof highlightWords === 'function') {
                  highlightWords();
                }
              }
            }).catch(() => {
              // Ignora erros em páginas que não podem executar scripts
            });
          }
        });
      });
    });
  }
}

// Função para editar palavra (abre modal na página atual)
window.editWord = function(word, desc) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: (word) => {
        if (typeof editWordFromTooltip === 'function') {
          editWordFromTooltip(word);
        } else if (typeof showModal === 'function') {
          showModal(word);
        } else {
          alert('Abra uma página da web para editar suas palavras.');
        }
      },
      args: [word]
    });
  });
  
  // Fecha o popup
  window.close();
};

// Carrega o dicionário quando o popup abre
document.addEventListener('DOMContentLoaded', function() {
  loadDictionary();
  
  // Adiciona event listener para o botão de limpar
  const clearBtn = document.getElementById('clearAllBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllWords);
  }
});

// Recarrega quando há mudanças no storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.dictionary) {
    loadDictionary();
  }
});
