// Carrega e exibe o dicionário no popup
function loadDictionary() {
  chrome.storage.sync.get({dictionary: {}}, function(data) {
    const dictionary = data.dictionary;
    const listElement = document.getElementById('dictionaryList');
    
    if (!dictionary || Object.keys(dictionary).length === 0) {
      listElement.innerHTML = '<div class="empty-state">Nenhuma palavra salva ainda.<br>Selecione uma palavra em qualquer página para começar!</div>';
      return;
    }
    
    let html = '';
    for (const word in dictionary) {
      html += `
        <div class="word-item" onclick="editWord('${word}', '${dictionary[word].replace(/'/g, "\\'")}')">
          <div class="word-text">${word}</div>
          <div class="word-desc">${dictionary[word]}</div>
        </div>
      `;
    }
    
    listElement.innerHTML = html;
  });
}

// Função para editar palavra (abre modal na página atual)
window.editWord = function(word, desc) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: (word, desc) => {
        if (typeof window.editWord === 'function') {
          window.editWord(word, desc);
        } else {
          alert('Abra uma página da web para editar suas palavras.');
        }
      },
      args: [word, desc]
    });
  });
  
  // Fecha o popup
  window.close();
};

// Carrega o dicionário quando o popup abre
document.addEventListener('DOMContentLoaded', loadDictionary);

// Recarrega quando há mudanças no storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.dictionary) {
    loadDictionary();
  }
});
