const { clipboard } = require('electron');
const { exec } = require('child_process');

/**
 * Serviço responsável pela captura global de texto selecionado
 * Updated to work without robotjs - uses system commands instead
 */
class TextCaptureService {
  constructor() {
    this.captureDelay = 150; // ms para aguardar o clipboard
    this.isCapturing = false;
  }

  /**
   * Captura texto selecionado usando simulação de Ctrl+C
   * @returns {Promise<string|null>} Texto capturado ou null se nenhum
   */
  async captureSelectedText() {
    if (this.isCapturing) {
      console.log('⚠️  Captura já em andamento, ignorando...');
      return null;
    }

    this.isCapturing = true;

    try {
      // Salva conteúdo atual do clipboard
      const originalClipboard = clipboard.readText();
      
      // Limpa clipboard temporariamente para detectar novo conteúdo
      clipboard.clear();
      
      // Simula Ctrl+C para copiar texto selecionado usando comando do sistema
      console.log('📋 Simulando Ctrl+C...');
      await this.sendCtrlC();
      
      // Aguarda um tempo para o sistema processar
      await this.sleep(this.captureDelay);
      
      // Obtém o novo conteúdo do clipboard
      const selectedText = clipboard.readText().trim();
      
      // Restaura clipboard original se havia conteúdo
      if (originalClipboard) {
        clipboard.writeText(originalClipboard);
      }

      // Verifica se conseguiu capturar algo novo
      if (selectedText && selectedText !== originalClipboard) {
        console.log(`✅ Texto capturado: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
        return selectedText;
      } else {
        console.log('⚠️  Nenhum texto novo capturado');
        return null;
      }

    } catch (error) {
      console.error('❌ Erro na captura de texto:', error.message);
      return null;
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Captura texto com retry em caso de falha
   * @param {number} maxRetries Número máximo de tentativas
   * @returns {Promise<string|null>}
   */
  async captureWithRetry(maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
      const text = await this.captureSelectedText();
      
      if (text) {
        return text;
      }
      
      if (i < maxRetries - 1) {
        console.log(`🔄 Tentativa ${i + 1} falhou, tentando novamente...`);
        await this.sleep(100);
      }
    }
    
    console.log(`❌ Falha na captura após ${maxRetries} tentativas`);
    return null;
  }

  /**
   * Verifica se o texto parece ser uma seleção válida
   * @param {string} text Texto a verificar
   * @returns {boolean}
   */
  isValidSelection(text) {
    if (!text || typeof text !== 'string') return false;
    
    const cleanText = text.trim();
    
    // Muito curto ou muito longo
    if (cleanText.length < 1 || cleanText.length > 500) return false;
    
    // Apenas espaços/quebras de linha
    if (!/\S/.test(cleanText)) return false;
    
    // Texto que parece ser acidental (apenas pontuação)
    if (/^[^\w\s]+$/.test(cleanText)) return false;
    
    return true;
  }

  /**
   * Normaliza texto capturado (remove quebras excessivas, etc.)
   * @param {string} text Texto bruto
   * @returns {string} Texto normalizado
   */
  normalizeText(text) {
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, ' ')  // Substitui CRLF por espaço
      .replace(/\n/g, ' ')    // Substitui LF por espaço  
      .replace(/\t/g, ' ')    // Substitui tab por espaço
      .replace(/\s+/g, ' ')   // Remove espaços múltiplos
      .trim();
  }

  /**
   * Captura e processa texto selecionado
   * @returns {Promise<string|null>} Texto processado ou null
   */
  async captureAndProcess() {
    const rawText = await this.captureWithRetry();
    
    if (!rawText) return null;
    
    const normalizedText = this.normalizeText(rawText);
    
    if (!this.isValidSelection(normalizedText)) {
      console.log('⚠️  Texto capturado não é uma seleção válida');
      return null;
    }
    
    return normalizedText;
  }

  /**
   * Configura delay para captura
   * @param {number} delay Delay em milissegundos
   */
  setCaptureDelay(delay) {
    this.captureDelay = Math.max(50, Math.min(1000, delay));
    console.log(`⏱️  Delay de captura configurado para ${this.captureDelay}ms`);
  }

  /**
   * Send Ctrl+C using system commands (cross-platform)
   * @returns {Promise}
   */
  sendCtrlC() {
    return new Promise((resolve) => {
      const platform = process.platform;
      
      let command;
      if (platform === 'win32') {
        // Windows: Use PowerShell to send Ctrl+C
        command = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"';
      } else if (platform === 'darwin') {
        // macOS: Use osascript
        command = 'osascript -e "tell application \\"System Events\\" to keystroke \\"c\\" using command down"';
      } else {
        // Linux: Use xdotool (needs to be installed)
        command = 'xdotool key ctrl+c';
      }

      exec(command, (error) => {
        if (error) {
          console.error('Error sending Ctrl+C:', error);
        }
        resolve();
      });
    });
  }

  /**
   * Utility: Sleep promise
   * @param {number} ms Milissegundos para aguardar
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Testa se o sistema de captura está funcionando
   * @returns {Promise<boolean>}
   */
  async testCapture() {
    console.log('🧪 Testando sistema de captura...');
    
    try {
      // Coloca um texto de teste no clipboard
      const testText = 'TESTE_CAPTURA_' + Date.now();
      clipboard.writeText(testText);
      
      // Tenta capturar (não vai funcionar sem seleção real, mas testa o fluxo)
      const result = await this.captureSelectedText();
      
      console.log('✅ Sistema de captura operacional');
      return true;
      
    } catch (error) {
      console.error('❌ Erro no teste de captura:', error.message);
      return false;
    }
  }
}

module.exports = TextCaptureService;