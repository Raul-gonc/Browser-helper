class I18n {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = {};
    this.fallbackLanguage = 'en';
  }

  async detectLanguage() {
    try {
      const stored = await chrome.storage.sync.get({ language: null });
      if (stored.language) {
        this.currentLanguage = stored.language;
        return this.currentLanguage;
      }

      const browserLang = navigator.language || navigator.userLanguage;
      console.log('Browser language detected (popup):', browserLang);
      
      if (browserLang.startsWith('pt')) {
        this.currentLanguage = 'pt-BR';
      } else if (browserLang.startsWith('es')) {
        this.currentLanguage = 'es';
      } else {
        this.currentLanguage = 'en';
      }

      await chrome.storage.sync.set({ language: this.currentLanguage });
      console.log('Language set to (popup):', this.currentLanguage);
      
      return this.currentLanguage;
    } catch (error) {
      console.warn('Erro ao detectar idioma:', error);
      return this.currentLanguage;
    }
  }

  async loadTranslations(language = null) {
    const lang = language || this.currentLanguage;
    
    try {
      const response = await fetch(chrome.runtime.getURL(`locales/${lang}.json`));
      this.translations = await response.json();
      
      if (lang !== this.fallbackLanguage) {
        try {
          const fallbackResponse = await fetch(chrome.runtime.getURL(`locales/${this.fallbackLanguage}.json`));
          const fallbackTranslations = await fallbackResponse.json();
          
          this.translations = { ...fallbackTranslations, ...this.translations };
        } catch (fallbackError) {
          console.warn('Erro ao carregar traduções de fallback:', fallbackError);
        }
      }
      
      return this.translations;
    } catch (error) {
      console.error(`Erro ao carregar traduções para ${lang}:`, error);
      
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

  t(key, variables = {}) {
    let translation = this.translations[key];
    
    if (!translation) {
      console.warn(`Tradução não encontrada para a chave: ${key}`);
      return key; 
    }

    Object.keys(variables).forEach(variable => {
      const placeholder = `{${variable}}`;
      translation = translation.replace(new RegExp(placeholder, 'g'), variables[variable]);
    });

    return translation;
  }

  async changeLanguage(newLanguage) {
    if (this.currentLanguage === newLanguage) return;
    
    this.currentLanguage = newLanguage;
    await chrome.storage.sync.set({ language: newLanguage });
    await this.loadTranslations(newLanguage);
    
    return this.translations;
  }

  getAvailableLanguages() {
    return [
      { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' }
    ];
  }

  async initialize() {
    await this.detectLanguage();
    await this.loadTranslations();
    return this.translations;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

window.i18n = new I18n();