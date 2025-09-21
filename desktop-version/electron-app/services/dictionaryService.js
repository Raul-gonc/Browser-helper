const Store = require('electron-store');
const path = require('path');
const fs = require('fs').promises;

/**
 * Serviço para gerenciamento do dicionário pessoal
 */
class DictionaryService {
  constructor() {
    this.store = new Store({
      name: 'dictionary-data',
      defaults: {
        dictionary: {},
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          totalWords: 0
        }
      }
    });
    
    this.dictionary = this.store.get('dictionary', {});
    this.metadata = this.store.get('metadata', {});
    
    console.log(`📚 Dicionário carregado com ${Object.keys(this.dictionary).length} palavras`);
  }

  /**
   * Obtém todo o dicionário
   * @returns {Object} Dicionário completo
   */
  getDictionary() {
    return { ...this.dictionary };
  }

  /**
   * Obtém definição de uma palavra
   * @param {string} word Palavra a buscar
   * @returns {string|null} Definição ou null se não encontrada
   */
  getDefinition(word) {
    const normalizedWord = this.normalizeWord(word);
    
    // Busca exata primeiro
    if (this.dictionary[normalizedWord]) {
      return this.dictionary[normalizedWord];
    }
    
    // Busca case-insensitive
    const lowerWord = normalizedWord.toLowerCase();
    const exactMatch = Object.keys(this.dictionary).find(key => 
      key.toLowerCase() === lowerWord
    );
    
    if (exactMatch) {
      return this.dictionary[exactMatch];
    }
    
    return null;
  }

  /**
   * Adiciona ou atualiza uma palavra
   * @param {string} word Palavra
   * @param {string} definition Definição
   * @returns {boolean} Sucesso da operação
   */
  async saveWord(word, definition) {
    try {
      const normalizedWord = this.normalizeWord(word);
      const normalizedDefinition = this.normalizeDefinition(definition);
      
      if (!normalizedWord || !normalizedDefinition) {
        throw new Error('Palavra e definição não podem estar vazias');
      }
      
      const isNewWord = !this.dictionary[normalizedWord];
      
      this.dictionary[normalizedWord] = normalizedDefinition;
      
      // Atualiza metadata
      this.metadata.lastModified = new Date().toISOString();
      this.metadata.totalWords = Object.keys(this.dictionary).length;
      
      // Persiste no store
      this.store.set('dictionary', this.dictionary);
      this.store.set('metadata', this.metadata);
      
      console.log(`💾 ${isNewWord ? 'Adicionada' : 'Atualizada'} palavra: "${normalizedWord}"`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao salvar palavra:', error.message);
      return false;
    }
  }

  /**
   * Remove uma palavra do dicionário
   * @param {string} word Palavra a remover
   * @returns {boolean} Sucesso da operação
   */
  async deleteWord(word) {
    try {
      const normalizedWord = this.normalizeWord(word);
      
      if (!this.dictionary[normalizedWord]) {
        console.log(`⚠️  Palavra "${normalizedWord}" não encontrada para exclusão`);
        return false;
      }
      
      delete this.dictionary[normalizedWord];
      
      // Atualiza metadata
      this.metadata.lastModified = new Date().toISOString();
      this.metadata.totalWords = Object.keys(this.dictionary).length;
      
      // Persiste no store
      this.store.set('dictionary', this.dictionary);
      this.store.set('metadata', this.metadata);
      
      console.log(`🗑️  Palavra "${normalizedWord}" removida`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao excluir palavra:', error.message);
      return false;
    }
  }

  /**
   * Busca palavras que contenham o termo
   * @param {string} query Termo de busca
   * @returns {Array} Lista de palavras encontradas com suas definições
   */
  searchWords(query) {
    if (!query || query.trim().length < 1) {
      return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results = [];
    
    Object.keys(this.dictionary).forEach(word => {
      const definition = this.dictionary[word];
      
      // Busca na palavra
      const wordMatch = word.toLowerCase().includes(searchTerm);
      
      // Busca na definição
      const definitionMatch = definition.toLowerCase().includes(searchTerm);
      
      if (wordMatch || definitionMatch) {
        results.push({
          word: word,
          definition: definition,
          matchType: wordMatch ? 'word' : 'definition'
        });
      }
    });
    
    // Ordena: primeiro matches exatos na palavra, depois parciais, depois na definição
    results.sort((a, b) => {
      const aExact = a.word.toLowerCase() === searchTerm;
      const bExact = b.word.toLowerCase() === searchTerm;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      if (a.matchType === 'word' && b.matchType === 'definition') return -1;
      if (a.matchType === 'definition' && b.matchType === 'word') return 1;
      
      return a.word.localeCompare(b.word);
    });
    
    return results;
  }

  /**
   * Importa dicionário de dados externos
   * @param {Object} importData Dados a importar
   * @param {boolean} merge Se deve mesclar com o existente (default: true)
   * @returns {Object} Resultado da importação
   */
  async importDictionary(importData, merge = true) {
    try {
      if (!importData || typeof importData !== 'object') {
        throw new Error('Dados de importação inválidos');
      }
      
      let imported = 0;
      let updated = 0;
      let errors = 0;
      
      const newDictionary = merge ? { ...this.dictionary } : {};
      
      Object.keys(importData).forEach(word => {
        try {
          const normalizedWord = this.normalizeWord(word);
          const normalizedDefinition = this.normalizeDefinition(importData[word]);
          
          if (normalizedWord && normalizedDefinition) {
            const exists = newDictionary[normalizedWord];
            newDictionary[normalizedWord] = normalizedDefinition;
            
            if (exists) {
              updated++;
            } else {
              imported++;
            }
          } else {
            errors++;
          }
        } catch (err) {
          errors++;
          console.warn(`⚠️  Erro ao importar palavra "${word}":`, err.message);
        }
      });
      
      // Aplica as mudanças
      this.dictionary = newDictionary;
      
      // Atualiza metadata
      this.metadata.lastModified = new Date().toISOString();
      this.metadata.totalWords = Object.keys(this.dictionary).length;
      
      // Persiste no store
      this.store.set('dictionary', this.dictionary);
      this.store.set('metadata', this.metadata);
      
      const result = {
        success: true,
        imported,
        updated,
        errors,
        total: imported + updated,
        totalWords: this.metadata.totalWords
      };
      
      console.log(`📥 Importação concluída: ${imported} novas, ${updated} atualizadas, ${errors} erros`);
      return result;
      
    } catch (error) {
      console.error('❌ Erro na importação:', error.message);
      return {
        success: false,
        error: error.message,
        imported: 0,
        updated: 0,
        errors: 0,
        total: 0
      };
    }
  }

  /**
   * Exporta dicionário para arquivo JSON
   * @param {string} filePath Caminho do arquivo (opcional)
   * @returns {Object} Dados exportados
   */
  async exportDictionary(filePath = null) {
    try {
      const exportData = {
        metadata: {
          ...this.metadata,
          exportedAt: new Date().toISOString(),
          appVersion: '1.0.0'
        },
        dictionary: this.dictionary
      };
      
      if (filePath) {
        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');
        console.log(`📤 Dicionário exportado para: ${filePath}`);
      }
      
      return exportData;
      
    } catch (error) {
      console.error('❌ Erro na exportação:', error.message);
      throw error;
    }
  }

  /**
   * Cria backup do dicionário
   * @returns {string} Caminho do backup criado
   */
  async createBackup() {
    try {
      const backupDir = path.join(this.store.path, '..', 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `dictionary-backup-${timestamp}.json`);
      
      await this.exportDictionary(backupFile);
      
      console.log(`💾 Backup criado: ${backupFile}`);
      return backupFile;
      
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do dicionário
   * @returns {Object} Estatísticas
   */
  getStatistics() {
    const words = Object.keys(this.dictionary);
    const definitions = Object.values(this.dictionary);
    
    return {
      totalWords: words.length,
      averageDefinitionLength: definitions.reduce((sum, def) => sum + def.length, 0) / definitions.length || 0,
      longestWord: words.reduce((a, b) => a.length > b.length ? a : b, ''),
      shortestWord: words.reduce((a, b) => a.length < b.length ? a : b, ''),
      longestDefinition: definitions.reduce((a, b) => a.length > b.length ? a : b, ''),
      createdAt: this.metadata.createdAt,
      lastModified: this.metadata.lastModified
    };
  }

  /**
   * Normaliza uma palavra (remove espaços extras, etc.)
   * @param {string} word Palavra bruta
   * @returns {string} Palavra normalizada
   */
  normalizeWord(word) {
    if (!word || typeof word !== 'string') return '';
    
    return word
      .trim()
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove caracteres invisíveis
  }

  /**
   * Normaliza uma definição
   * @param {string} definition Definição bruta
   * @returns {string} Definição normalizada
   */
  normalizeDefinition(definition) {
    if (!definition || typeof definition !== 'string') return '';
    
    return definition
      .trim()
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove caracteres invisíveis
  }

  /**
   * Limpa o dicionário (remove todas as palavras)
   * @returns {boolean} Sucesso da operação
   */
  async clearDictionary() {
    try {
      this.dictionary = {};
      
      // Atualiza metadata
      this.metadata.lastModified = new Date().toISOString();
      this.metadata.totalWords = 0;
      
      // Persiste no store
      this.store.set('dictionary', this.dictionary);
      this.store.set('metadata', this.metadata);
      
      console.log('🗑️  Dicionário limpo');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao limpar dicionário:', error.message);
      return false;
    }
  }
}

module.exports = DictionaryService;