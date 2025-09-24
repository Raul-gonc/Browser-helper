// Sistema de Internacionalização
class I18n {
  constructor() {
    this.currentLanguage = 'en'; // Padrão em inglês
    this.translations = {};
    this.fallbackLanguage = 'en';
  }

  // Detecta o idioma do usuário
  async detectLanguage() {
    try {
      // Tenta obter idioma salvo no storage
      const stored = await chrome.storage.sync.get({ language: null });
      if (stored.language) {
        this.currentLanguage = stored.language;
        return this.currentLanguage;
      }

      // Detecta idioma do navegador
      const browserLang = navigator.language || navigator.userLanguage;
      console.log('Browser language detected (popup):', browserLang);
      
      // Mapeia códigos de idioma para os suportados
      if (browserLang.startsWith('pt')) {
        this.currentLanguage = 'pt-BR';
      } else if (browserLang.startsWith('es')) {
        this.currentLanguage = 'es';
      } else {
        this.currentLanguage = 'en';
      }

      // Salva a detecção automática
      await chrome.storage.sync.set({ language: this.currentLanguage });
      console.log('Language set to (popup):', this.currentLanguage);
      
      return this.currentLanguage;
    } catch (error) {
      console.warn('Erro ao detectar idioma:', error);
      return this.currentLanguage;
    }
  }

  // Carrega as traduções para o idioma atual
  async loadTranslations(language = null) {
    const lang = language || this.currentLanguage;
    
    try {
      // Carrega arquivo de tradução principal
      const response = await fetch(chrome.runtime.getURL(`locales/${lang}.json`));
      this.translations = await response.json();
      
      // Se não é o idioma de fallback, carrega também o fallback para casos não traduzidos
      if (lang !== this.fallbackLanguage) {
        try {
          const fallbackResponse = await fetch(chrome.runtime.getURL(`locales/${this.fallbackLanguage}.json`));
          const fallbackTranslations = await fallbackResponse.json();
          
          // Mescla traduções (fallback primeiro, depois sobrescreve com o idioma atual)
          this.translations = { ...fallbackTranslations, ...this.translations };
        } catch (fallbackError) {
          console.warn('Erro ao carregar traduções de fallback:', fallbackError);
        }
      }
      
      return this.translations;
    } catch (error) {
      console.error(`Erro ao carregar traduções para ${lang}:`, error);
      
      // Se falhar, tenta carregar o idioma de fallback
      if (lang !== this.fallbackLanguage) {
        try {
          const fallbackResponse = await fetch(chrome.runtime.getURL(`locales/${this.fallbackLanguage}.json`));
          this.translations = await fallbackResponse.json();
          return this.translations;
        } catch (fallbackError) {
          console.error('Erro ao carregar idioma de fallback:', fallbackError);
          return {};
        }
      }
      
      return {};
    }
  }

  // Obtém uma tradução por chave
  t(key, variables = {}) {
    let translation = this.translations[key];
    
    if (!translation) {
      console.warn(`Tradução não encontrada para a chave: ${key}`);
      return key; // Retorna a própria chave se não encontrar tradução
    }

    // Substitui variáveis na tradução (ex: "Olá {name}" com {name: "João"})
    Object.keys(variables).forEach(variable => {
      const placeholder = `{${variable}}`;
      translation = translation.replace(new RegExp(placeholder, 'g'), variables[variable]);
    });

    return translation;
  }

  // Muda o idioma e recarrega traduções
  async changeLanguage(newLanguage) {
    if (this.currentLanguage === newLanguage) return;
    
    this.currentLanguage = newLanguage;
    await chrome.storage.sync.set({ language: newLanguage });
    await this.loadTranslations(newLanguage);
    
    return this.translations;
  }

  // Obtém lista de idiomas disponíveis
  getAvailableLanguages() {
    return [
      { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' }
    ];
  }

  // Inicializa o sistema de i18n
  async initialize() {
    await this.detectLanguage();
    await this.loadTranslations();
    return this.translations;
  }

  // Obtém idioma atual
  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

// Instância global do sistema de i18n
window.i18n = new I18n();