const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Serviço para integração com APIs de IA para geração automática de definições
 */
class AIService {
  constructor() {
    this.settings = {};
    this.apiKeys = {};
    
    this.endpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      google: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
    };
    
    this.requestTimeout = 30000; // 30 segundos
  }

  /**
   * Inicializa o serviço com configurações do usuário
   * @param {Object} settings Configurações do usuário
   */
  initialize(settings) {
    this.updateSettings(settings);
    console.log('🤖 Serviço de IA inicializado');
    this.logAvailableProviders();
  }

  /**
   * Gera definição para uma palavra usando o provedor especificado
   * @param {string} word Palavra para definir
   * @param {string} provider Provedor de IA ('openai', 'anthropic', 'google')
   * @returns {Promise<string>} Definição gerada
   */
  async generateDefinition(word, provider = 'openai') {
    try {
      if (!word || word.trim().length === 0) {
        throw new Error('Palavra não pode estar vazia');
      }

      const normalizedWord = word.trim();
      
      console.log(`🔍 Gerando definição para "${normalizedWord}" usando ${provider}...`);
      
      switch (provider.toLowerCase()) {
        case 'openai':
          return await this.generateWithOpenAI(normalizedWord);
        case 'anthropic':
          return await this.generateWithAnthropic(normalizedWord);
        case 'google':
          return await this.generateWithGoogle(normalizedWord);
        default:
          throw new Error(`Provedor não suportado: ${provider}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao gerar definição com ${provider}:`, error.message);
      throw error;
    }
  }

  /**
   * Gera definição usando OpenAI GPT
   * @param {string} word Palavra
   * @returns {Promise<string>}
   */
  async generateWithOpenAI(word) {
    if (!this.apiKeys.openai) {
      throw new Error('Chave da API OpenAI não configurada');
    }

    const prompt = this.createPrompt(word);
    
    const response = await fetch(this.endpoints.openai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em criar definições claras e concisas para um dicionário pessoal. Sempre responda apenas com a definição, sem texto adicional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
      timeout: this.requestTimeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Resposta vazia da OpenAI');
    }

    const definition = data.choices[0].message.content.trim();
    console.log(`✅ Definição gerada com OpenAI: "${definition.substring(0, 50)}..."`);
    
    return this.cleanDefinition(definition);
  }

  /**
   * Gera definição usando Anthropic Claude
   * @param {string} word Palavra
   * @returns {Promise<string>}
   */
  async generateWithAnthropic(word) {
    if (!this.apiKeys.anthropic) {
      throw new Error('Chave da API Anthropic não configurada');
    }

    const prompt = this.createPrompt(word);
    
    const response = await fetch(this.endpoints.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKeys.anthropic,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: `Você é um assistente especializado em criar definições claras e concisas para um dicionário pessoal. Sempre responda apenas com a definição, sem texto adicional.\n\n${prompt}`
          }
        ]
      }),
      timeout: this.requestTimeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.content || data.content.length === 0) {
      throw new Error('Resposta vazia da Anthropic');
    }

    const definition = data.content[0].text.trim();
    console.log(`✅ Definição gerada com Anthropic: "${definition.substring(0, 50)}..."`);
    
    return this.cleanDefinition(definition);
  }

  /**
   * Gera definição usando Google AI (Gemini)
   * @param {string} word Palavra
   * @returns {Promise<string>}
   */
  async generateWithGoogle(word) {
    if (!this.apiKeys.google) {
      throw new Error('Chave da API Google AI não configurada');
    }

    const prompt = this.createPrompt(word);
    const url = `${this.endpoints.google}?key=${this.apiKeys.google}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Você é um assistente especializado em criar definições claras e concisas para um dicionário pessoal. Sempre responda apenas com a definição, sem texto adicional.\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 150,
          stopSequences: []
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }),
      timeout: this.requestTimeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google AI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error('Resposta vazia do Google AI');
    }

    const definition = data.candidates[0].content.parts[0].text.trim();
    console.log(`✅ Definição gerada com Google AI: "${definition.substring(0, 50)}..."`);
    
    return this.cleanDefinition(definition);
  }

  /**
   * Cria prompt otimizado para geração de definições
   * @param {string} word Palavra
   * @returns {string} Prompt formatado
   */
  createPrompt(word) {
    return `Defina a palavra ou termo "${word}" de forma clara, concisa e útil para um dicionário pessoal. A definição deve:
- Ser objetiva e fácil de entender
- Ter entre 10 e 100 palavras
- Incluir o contexto de uso quando relevante
- Ser em português brasileiro
- Não incluir a palavra na própria definição quando possível

Responda apenas com a definição:`;
  }

  /**
   * Limpa e normaliza a definição gerada
   * @param {string} definition Definição bruta
   * @returns {string} Definição limpa
   */
  cleanDefinition(definition) {
    if (!definition) return '';
    
    return definition
      .trim()
      // Remove aspas no início e fim
      .replace(/^["']+|["']+$/g, '')
      // Remove prefixos comuns das IAs
      .replace(/^(Definição:|A palavra|O termo|Este termo)\s*/i, '')
      // Normaliza espaços
      .replace(/\s+/g, ' ')
      // Garante que termina com ponto
      .replace(/([^.!?])$/, '$1.')
      .trim();
  }

  /**
   * Tenta gerar definição com fallback entre provedores
   * @param {string} word Palavra
   * @param {Array<string>} providers Lista de provedores em ordem de prioridade
   * @returns {Promise<string>}
   */
  async generateWithFallback(word, providers = ['openai', 'anthropic', 'google']) {
    let lastError;
    
    for (const provider of providers) {
      try {
        if (this.isProviderAvailable(provider)) {
          const definition = await this.generateDefinition(word, provider);
          if (definition && definition.length > 0) {
            return definition;
          }
        }
      } catch (error) {
        console.warn(`⚠️  Fallback: ${provider} falhou:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError || new Error('Todos os provedores falharam');
  }

  /**
   * Verifica se um provedor está disponível (tem chave configurada)
   * @param {string} provider Nome do provedor
   * @returns {boolean}
   */
  isProviderAvailable(provider) {
    return !!(this.apiKeys[provider] && this.apiKeys[provider].trim().length > 0);
  }

  /**
   * Obtém lista de provedores disponíveis
   * @returns {Array<string>}
   */
  getAvailableProviders() {
    return Object.keys(this.apiKeys).filter(provider => this.isProviderAvailable(provider));
  }

  /**
   * Testa conectividade com um provedor
   * @param {string} provider Nome do provedor
   * @returns {Promise<boolean>}
   */
  async testProvider(provider) {
    try {
      await this.generateDefinition('teste', provider);
      return true;
    } catch (error) {
      console.error(`❌ Teste do provedor ${provider} falhou:`, error.message);
      return false;
    }
  }

  /**
   * Extrai chaves de API das configurações do usuário
   * @returns {Object} Objeto com chaves de API
   */
  extractApiKeys() {
    const keys = {};
    
    if (this.settings.openai?.enabled && this.settings.openai?.apiKey) {
      keys.openai = this.settings.openai.apiKey;
    }
    
    if (this.settings.anthropic?.enabled && this.settings.anthropic?.apiKey) {
      keys.anthropic = this.settings.anthropic.apiKey;
    }
    
    if (this.settings.google?.enabled && this.settings.google?.apiKey) {
      keys.google = this.settings.google.apiKey;
    }
    
    return keys;
  }

  /**
   * Atualiza configurações do serviço
   * @param {Object} newSettings Novas configurações
   */
  updateSettings(newSettings) {
    this.settings = newSettings.ai || {};
    this.apiKeys = this.extractApiKeys();
    this.logAvailableProviders();
  }

  /**
   * Configura nova chave de API (para testes temporários)
   * @param {string} provider Nome do provedor
   * @param {string} apiKey Nova chave
   */
  setApiKey(provider, apiKey) {
    if (!apiKey || apiKey.trim().length === 0) {
      delete this.apiKeys[provider];
    } else {
      this.apiKeys[provider] = apiKey.trim();
    }
    
    console.log(`🔑 Chave do ${provider} ${apiKey ? 'configurada' : 'removida'}`);
  }

  /**
   * Log dos provedores disponíveis
   */
  logAvailableProviders() {
    const available = this.getAvailableProviders();
    
    if (available.length > 0) {
      console.log(`🤖 Provedores de IA disponíveis: ${available.join(', ')}`);
    } else {
      console.log('⚠️  Nenhum provedor de IA configurado');
    }
  }

  /**
   * Obtém estatísticas de uso (placeholder para implementação futura)
   * @returns {Object}
   */
  getUsageStats() {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      providerUsage: {}
    };
  }
}

module.exports = AIService;