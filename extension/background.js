// Background script para comunicação entre componentes da extensão
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Retransmite mensagens de mudança de idioma para todos os componentes
  if (message.type === 'languageChanged') {
    // A mensagem já é processada individualmente por cada script
    return true;
  }
});
