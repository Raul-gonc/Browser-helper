function loadDictionary() {
  chrome.storage.sync.get({dictionary: {}}, function(data) {
    const dictionary = data.dictionary;
    const listElement = document.getElementById('dictionaryList');
    const statsContainer = document.getElementById('statsContainer');
    const actionsContainer = document.getElementById('actionsContainer');
    const wordCount = document.getElementById('wordCount');
    
    const wordKeys = Object.keys(dictionary);
    const totalWords = wordKeys.length;
    
    if (totalWords > 0) {
      wordCount.textContent = totalWords;
      statsContainer.style.display = 'block';
      actionsContainer.style.display = 'block';
    } else {
      statsContainer.style.display = 'none';
      actionsContainer.style.display = 'none';
    }
    
    if (!dictionary || totalWords === 0) {
      listElement.innerHTML = `<div class="empty-state">${i18n.t('emptyStateMessage')}</div>`;
      return;
    }
    
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

function clearAllWords() {
  if (confirm(i18n.t('clearAllConfirm'))) {
    chrome.storage.sync.set({dictionary: {}}, function() {
      loadDictionary();
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
            });
          }
        });
      });
    });
  }
}

function openAIConfig() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: () => {
        if (typeof showAIConfigModal === 'function') {
          showAIConfigModal();
        } else {
          alert(i18n.t('openWebPageToConfig'));
        }
      }
    });
  });
  
  window.close();
}

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
          alert(i18n.t('openWebPageToEdit'));
        }
      },
      args: [word]
    });
  });
  
  window.close();
};

function updatePopupTexts() {
  const titleElement = document.querySelector('.header h3');
  if (titleElement) titleElement.textContent = i18n.t('popupTitle');
  
  const aiConfigIcon = document.getElementById('aiConfigIcon');
  if (aiConfigIcon) aiConfigIcon.title = i18n.t('aiConfigTooltip');
  
  const howToTitle = document.querySelector('.info h4');
  if (howToTitle) howToTitle.textContent = i18n.t('howToUseTitle');
  
  const howToSteps = document.querySelectorAll('.info p');
  if (howToSteps.length >= 5) {
    howToSteps[0].textContent = i18n.t('howToStep1');
    howToSteps[1].textContent = i18n.t('howToStep2');
    howToSteps[2].textContent = i18n.t('howToStep3');
    howToSteps[3].textContent = i18n.t('howToStep4');
    howToSteps[4].textContent = i18n.t('howToStep5');
  }
  
  const wordsCounter = document.querySelector('.stats span:not(.stats-number)');
  if (wordsCounter) wordsCounter.textContent = i18n.t('wordsCounter');
  
  const clearBtn = document.getElementById('clearAllBtn');
  if (clearBtn) clearBtn.textContent = i18n.t('clearAllButton');
  
  loadDictionary();
}

document.addEventListener('DOMContentLoaded', async function() {
  await i18n.initialize();
  
  updatePopupTexts();
  
  loadDictionary();
  
  const clearBtn = document.getElementById('clearAllBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllWords);
  }
  
  const aiConfigIcon = document.getElementById('aiConfigIcon');
  if (aiConfigIcon) {
    aiConfigIcon.addEventListener('click', openAIConfig);
  }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.dictionary) {
    loadDictionary();
  }
  
  if (namespace === 'sync' && changes.language) {
    i18n.changeLanguage(changes.language.newValue).then(() => {
      updatePopupTexts();
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'languageChanged') {
    i18n.changeLanguage(message.language).then(() => {
      updatePopupTexts();
    });
  }
});
