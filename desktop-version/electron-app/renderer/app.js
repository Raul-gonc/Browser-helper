// Estado da aplicação
let dictionary = {};
let settings = {};
let filteredWords = [];
let isEditMode = false;
let currentEditWord = '';

// Elementos do DOM
let elements = {};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    initElements();
    await loadData();
    setupEventListeners();
    renderDictionaryList();
    updateUI();
});

// Inicializa referências dos elementos
function initElements() {
    elements = {
        // Search
        searchInput: document.getElementById('searchInput'),
        clearSearch: document.getElementById('clearSearch'),
        
        // Buttons
        addWordBtn: document.getElementById('addWordBtn'),
        importBtn: document.getElementById('importBtn'),
        exportBtn: document.getElementById('exportBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        
        // Dictionary list
        dictionaryList: document.getElementById('dictionaryList'),
        wordCount: document.getElementById('wordCount'),
        emptyState: document.getElementById('emptyState'),
        
        // Word Modal
        wordModal: document.getElementById('wordModal'),
        modalTitle: document.getElementById('modalTitle'),
        wordInput: document.getElementById('wordInput'),
        definitionInput: document.getElementById('definitionInput'),
        saveWordBtn: document.getElementById('saveWordBtn'),
        deleteWordBtn: document.getElementById('deleteWordBtn'),
        cancelBtn: document.getElementById('cancelBtn'),
        closeModal: document.getElementById('closeModal'),
        
        // AI buttons
        aiStatus: document.getElementById('aiStatus'),
        
        // Settings Modal
        settingsModal: document.getElementById('settingsModal'),
        closeSettings: document.getElementById('closeSettings'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        captureHotkey: document.getElementById('captureHotkey'),
        toggleHotkey: document.getElementById('toggleHotkey'),
        popupTimeout: document.getElementById('popupTimeout'),
        
        // Import Modal
        importModal: document.getElementById('importModal'),
        closeImport: document.getElementById('closeImport'),
        importData: document.getElementById('importData'),
        fileInput: document.getElementById('fileInput'),
        fileStatus: document.getElementById('fileStatus'),
        cancelImport: document.getElementById('cancelImport'),
        confirmImport: document.getElementById('confirmImport'),
        
        // Status
        statusText: document.getElementById('statusText')
    };
}

// Carrega dados do store
async function loadData() {
    try {
        dictionary = await window.electronAPI.getDictionary();
        settings = await window.electronAPI.getSettings();
        
        console.log('Dados carregados:', {
            words: Object.keys(dictionary).length,
            settings: settings
        });
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showStatus('Erro ao carregar dados', 'error');
    }
}

// Configura event listeners
function setupEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    elements.clearSearch.addEventListener('click', clearSearch);
    
    // Main buttons
    elements.addWordBtn.addEventListener('click', () => openWordModal());
    elements.importBtn.addEventListener('click', () => openImportModal());
    elements.exportBtn.addEventListener('click', exportDictionary);
    elements.settingsBtn.addEventListener('click', () => openSettingsModal());
    
    // Word modal
    elements.saveWordBtn.addEventListener('click', saveWord);
    elements.deleteWordBtn.addEventListener('click', deleteCurrentWord);
    elements.cancelBtn.addEventListener('click', closeWordModal);
    elements.closeModal.addEventListener('click', closeWordModal);
    
    // Settings modal
    elements.closeSettings.addEventListener('click', closeSettingsModal);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);
    
    // Setup AI providers depois que o DOM estiver pronto
    setupAIProviders();
    
    // Import modal
    elements.closeImport.addEventListener('click', closeImportModal);
    elements.cancelImport.addEventListener('click', closeImportModal);
    elements.confirmImport.addEventListener('click', importDictionary);
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // AI buttons
    document.querySelectorAll('.btn-ai').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const provider = e.target.dataset.provider;
            generateAIDefinition(provider);
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Modal backdrop clicks
    elements.wordModal.addEventListener('click', (e) => {
        if (e.target === elements.wordModal) closeWordModal();
    });
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeSettingsModal();
    });
    elements.importModal.addEventListener('click', (e) => {
        if (e.target === elements.importModal) closeImportModal();
    });
}

// Busca no dicionário
function handleSearch() {
    const query = elements.searchInput.value.toLowerCase().trim();
    
    if (query) {
        filteredWords = Object.keys(dictionary).filter(word => 
            word.toLowerCase().includes(query) || 
            dictionary[word].toLowerCase().includes(query)
        );
        elements.clearSearch.style.opacity = '1';
    } else {
        filteredWords = Object.keys(dictionary);
        elements.clearSearch.style.opacity = '0';
    }
    
    renderDictionaryList();
}

function clearSearch() {
    elements.searchInput.value = '';
    filteredWords = Object.keys(dictionary);
    elements.clearSearch.style.opacity = '0';
    renderDictionaryList();
}

// Renderiza lista do dicionário
function renderDictionaryList() {
    const words = filteredWords.length > 0 ? filteredWords : Object.keys(dictionary);
    
    if (words.length === 0) {
        elements.emptyState.style.display = 'flex';
        elements.dictionaryList.innerHTML = '';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    // Ordena palavras alfabeticamente
    words.sort((a, b) => a.localeCompare(b));
    
    const html = words.map(word => `
        <div class="word-item" onclick="editWord('${escapeHtml(word)}')">
            <div class="word-info">
                <div class="word-name">${escapeHtml(word)}</div>
                <div class="word-definition">${escapeHtml(dictionary[word])}</div>
            </div>
            <div class="word-actions">
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); editWord('${escapeHtml(word)}')" title="Editar">
                    ✏️
                </button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteWord('${escapeHtml(word)}')" title="Excluir">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
    
    elements.dictionaryList.innerHTML = html;
}

// Abre modal para adicionar/editar palavra
function openWordModal(word = '') {
    isEditMode = !!word;
    currentEditWord = word;
    
    elements.modalTitle.textContent = isEditMode ? 'Editar Palavra' : 'Adicionar Palavra';
    elements.wordInput.value = word;
    elements.definitionInput.value = word ? dictionary[word] : '';
    elements.deleteWordBtn.style.display = isEditMode ? 'block' : 'none';
    
    elements.wordModal.classList.add('show');
    elements.wordInput.focus();
}

function closeWordModal() {
    elements.wordModal.classList.remove('show');
    resetWordForm();
}

function resetWordForm() {
    elements.wordInput.value = '';
    elements.definitionInput.value = '';
    elements.aiStatus.textContent = '';
    isEditMode = false;
    currentEditWord = '';
}

// Salva palavra no dicionário
async function saveWord() {
    const word = elements.wordInput.value.trim();
    const definition = elements.definitionInput.value.trim();
    
    if (!word) {
        alert('Por favor, digite uma palavra.');
        elements.wordInput.focus();
        return;
    }
    
    if (!definition) {
        alert('Por favor, digite uma definição.');
        elements.definitionInput.focus();
        return;
    }
    
    try {
        // Se estamos editando e mudou a palavra, remove a antiga
        if (isEditMode && currentEditWord !== word && dictionary[currentEditWord]) {
            await window.electronAPI.deleteWord(currentEditWord);
            delete dictionary[currentEditWord];
        }
        
        // Salva a nova/editada
        await window.electronAPI.saveWord(word, definition);
        dictionary[word] = definition;
        
        closeWordModal();
        handleSearch(); // Reaplica filtro se houver
        updateUI();
        
        showStatus(`Palavra "${word}" salva com sucesso!`);
        
    } catch (error) {
        console.error('Erro ao salvar palavra:', error);
        alert('Erro ao salvar palavra. Tente novamente.');
    }
}

// Edita palavra existente
function editWord(word) {
    openWordModal(word);
}

// Deleta palavra
async function deleteWord(word) {
    if (confirm(`Tem certeza que deseja excluir a palavra "${word}"?`)) {
        try {
            await window.electronAPI.deleteWord(word);
            delete dictionary[word];
            
            handleSearch(); // Reaplica filtro
            updateUI();
            showStatus(`Palavra "${word}" excluída.`);
            
        } catch (error) {
            console.error('Erro ao excluir palavra:', error);
            alert('Erro ao excluir palavra. Tente novamente.');
        }
    }
}

// Deleta palavra atual do modal
function deleteCurrentWord() {
    if (isEditMode && currentEditWord) {
        if (confirm(`Tem certeza que deseja excluir a palavra "${currentEditWord}"?`)) {
            deleteWord(currentEditWord);
            closeWordModal();
        }
    }
}

// Gera definição com IA
async function generateAIDefinition(provider) {
    const word = elements.wordInput.value.trim();
    
    if (!word) {
        alert('Digite uma palavra primeiro.');
        elements.wordInput.focus();
        return;
    }
    
    elements.aiStatus.textContent = `Gerando definição com ${provider}...`;
    
    // Desabilita botões de IA temporariamente
    document.querySelectorAll('.btn-ai').forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'Gerando...';
    });
    
    try {
        const definition = await window.electronAPI.generateAIDefinition(word, provider);
        
        if (definition) {
            elements.definitionInput.value = definition;
            elements.aiStatus.textContent = `Definição gerada com ${provider}!`;
            setTimeout(() => {
                elements.aiStatus.textContent = '';
            }, 3000);
        } else {
            throw new Error('Definição vazia retornada');
        }
        
    } catch (error) {
        console.error('Erro ao gerar definição:', error);
        elements.aiStatus.textContent = 'Erro ao gerar definição. Verifique as configurações de IA.';
        setTimeout(() => {
            elements.aiStatus.textContent = '';
        }, 5000);
    } finally {
        // Reabilita botões
        document.querySelectorAll('.btn-ai').forEach((btn, index) => {
            btn.disabled = false;
            const providers = ['OpenAI', 'Anthropic', 'Google AI'];
            btn.textContent = providers[index] || 'IA';
        });
    }
}

// Configurações
function openSettingsModal() {
    loadSettingsData();
    setupSettingsTabs();
    elements.settingsModal.classList.add('show');
}

function closeSettingsModal() {
    elements.settingsModal.classList.remove('show');
}

function loadSettingsData() {
    // Aba Geral
    elements.popupTimeout.value = (settings.popup?.timeout || 10000) / 1000;
    document.getElementById('popupWidth').value = settings.popup?.width || 350;
    document.getElementById('popupHeight').value = settings.popup?.height || 200;
    document.getElementById('startWithSystem').checked = settings.general?.startWithSystem || false;
    document.getElementById('autoBackup').checked = settings.general?.autoBackup || false;
    document.getElementById('maxBackups').value = settings.general?.maxBackups || 10;
    
    // Aba Atalhos
    elements.captureHotkey.value = settings.hotkeys?.capture || 'Ctrl+Shift+D';
    elements.toggleHotkey.value = settings.hotkeys?.toggle || 'Ctrl+Alt+D';
    
    // Aba IA
    loadAISettings();
}

function setupSettingsTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Remove active das outras tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Ativa a tab selecionada
            button.classList.add('active');
            document.getElementById(`${targetTab}Tab`).classList.add('active');
        });
    });
}

function loadAISettings() {
    const aiConfig = settings.ai || {};
    
    // OpenAI
    document.getElementById('openaiEnabled').checked = aiConfig.openai?.enabled || false;
    document.getElementById('openaiKey').value = aiConfig.openai?.apiKey || '';
    document.getElementById('openaiModel').value = aiConfig.openai?.model || 'gpt-4o-mini';
    toggleAIProvider('openai', aiConfig.openai?.enabled);
    
    // Anthropic
    document.getElementById('anthropicEnabled').checked = aiConfig.anthropic?.enabled || false;
    document.getElementById('anthropicKey').value = aiConfig.anthropic?.apiKey || '';
    document.getElementById('anthropicModel').value = aiConfig.anthropic?.model || 'claude-3-haiku-20240307';
    toggleAIProvider('anthropic', aiConfig.anthropic?.enabled);
    
    // Google
    document.getElementById('googleEnabled').checked = aiConfig.google?.enabled || false;
    document.getElementById('googleKey').value = aiConfig.google?.apiKey || '';
    document.getElementById('googleModel').value = aiConfig.google?.model || 'gemini-1.5-flash';
    toggleAIProvider('google', aiConfig.google?.enabled);
    
    // Configurações avançadas
    document.getElementById('aiTemperature').value = aiConfig.temperature || 0.3;
    document.getElementById('aiMaxTokens').value = aiConfig.maxTokens || 150;
    document.getElementById('aiAutoSave').checked = aiConfig.autoSave || false;
    
    // Atualiza display do range
    updateRangeDisplay();
}

function setupAIProviders() {
    // Toggle switches para habilitar/desabilitar provedores
    const providers = ['openai', 'anthropic', 'google'];
    
    providers.forEach(provider => {
        const checkbox = document.getElementById(`${provider}Enabled`);
        checkbox.addEventListener('change', (e) => {
            toggleAIProvider(provider, e.target.checked);
        });
    });
    
    // Range slider para temperature
    document.getElementById('aiTemperature').addEventListener('input', updateRangeDisplay);
}

function toggleAIProvider(provider, enabled) {
    const card = document.querySelector(`#${provider}Config`).closest('.ai-provider-card');
    const content = document.getElementById(`${provider}Config`);
    
    if (enabled) {
        card.classList.add('enabled');
        content.classList.add('show');
    } else {
        card.classList.remove('enabled');
        content.classList.remove('show');
    }
}

function updateRangeDisplay() {
    const range = document.getElementById('aiTemperature');
    const display = document.querySelector('.range-value');
    display.textContent = range.value;
}

async function testApiKey(provider) {
    const keyInput = document.getElementById(`${provider}Key`);
    const modelSelect = document.getElementById(`${provider}Model`);
    const statusDiv = document.getElementById('aiTestStatus');
    
    const apiKey = keyInput.value.trim();
    const model = modelSelect.value;
    
    if (!apiKey) {
        showAIStatus('Por favor, insira a chave da API primeiro.', 'error');
        return;
    }
    
    showAIStatus(`Testando conexão com ${provider}...`, 'testing');
    
    try {
        const result = await window.electronAPI.testAIProvider(provider, apiKey, model);
        
        if (result.success) {
            showAIStatus(`✅ ${provider} configurado com sucesso!`, 'success');
        } else {
            showAIStatus(`❌ Erro: ${result.error}`, 'error');
        }
    } catch (error) {
        showAIStatus(`❌ Erro na conexão: ${error.message}`, 'error');
    }
}

function showAIStatus(message, type) {
    const statusDiv = document.getElementById('aiTestStatus');
    statusDiv.textContent = message;
    statusDiv.className = `ai-status ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

function openExternal(url) {
    window.electronAPI.openExternal(url);
}

let hotkeyRecording = false;
let recordingType = '';

function recordHotkey(type) {
    if (hotkeyRecording) return;
    
    hotkeyRecording = true;
    recordingType = type;
    
    const input = document.getElementById(`${type}Hotkey`);
    const recordingDiv = document.getElementById('hotkeyRecording');
    
    input.value = 'Pressione a combinação...';
    recordingDiv.style.display = 'block';
    
    // Focus no documento para capturar teclas
    document.addEventListener('keydown', captureHotkey);
}

function captureHotkey(event) {
    if (!hotkeyRecording) return;
    
    event.preventDefault();
    
    const keys = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (event.metaKey) keys.push('Cmd');
    
    // Adiciona a tecla principal se não for modificador
    const mainKey = event.code.replace('Key', '').replace('Digit', '');
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        keys.push(mainKey);
    }
    
    if (keys.length >= 2) { // Pelo menos um modificador + uma tecla
        const hotkeyString = keys.join('+');
        document.getElementById(`${recordingType}Hotkey`).value = hotkeyString;
        cancelHotkeyRecord();
    }
}

function cancelHotkeyRecord() {
    hotkeyRecording = false;
    recordingType = '';
    
    const recordingDiv = document.getElementById('hotkeyRecording');
    recordingDiv.style.display = 'none';
    
    document.removeEventListener('keydown', captureHotkey);
    
    // Restaura valores originais se cancelou
    loadSettingsData();
}

async function resetSettings() {
    const confirmed = confirm(
        'Tem certeza que deseja restaurar todas as configurações para os valores padrão? ' +
        'Esta ação não pode ser desfeita.'
    );
    
    if (confirmed) {
        try {
            await window.electronAPI.resetSettings();
            settings = await window.electronAPI.getSettings();
            loadSettingsData();
            showStatus('Configurações restauradas para os padrões!');
        } catch (error) {
            console.error('Erro ao restaurar configurações:', error);
            alert('Erro ao restaurar configurações. Tente novamente.');
        }
    }
}

async function saveSettings() {
    try {
        const newSettings = {
            ...settings,
            popup: {
                ...settings.popup,
                timeout: parseInt(elements.popupTimeout.value) * 1000,
                width: parseInt(document.getElementById('popupWidth').value),
                height: parseInt(document.getElementById('popupHeight').value)
            },
            general: {
                startWithSystem: document.getElementById('startWithSystem').checked,
                autoBackup: document.getElementById('autoBackup').checked,
                maxBackups: parseInt(document.getElementById('maxBackups').value)
            },
            hotkeys: {
                capture: elements.captureHotkey.value,
                toggle: elements.toggleHotkey.value
            },
            ai: {
                openai: {
                    enabled: document.getElementById('openaiEnabled').checked,
                    apiKey: document.getElementById('openaiKey').value,
                    model: document.getElementById('openaiModel').value
                },
                anthropic: {
                    enabled: document.getElementById('anthropicEnabled').checked,
                    apiKey: document.getElementById('anthropicKey').value,
                    model: document.getElementById('anthropicModel').value
                },
                google: {
                    enabled: document.getElementById('googleEnabled').checked,
                    apiKey: document.getElementById('googleKey').value,
                    model: document.getElementById('googleModel').value
                },
                temperature: parseFloat(document.getElementById('aiTemperature').value),
                maxTokens: parseInt(document.getElementById('aiMaxTokens').value),
                autoSave: document.getElementById('aiAutoSave').checked
            }
        };
        
        await window.electronAPI.saveSettings(newSettings);
        settings = newSettings;
        
        closeSettingsModal();
        showStatus('Configurações salvas com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('Erro ao salvar configurações. Tente novamente.');
    }
}

// Import/Export
function openImportModal() {
    elements.importData.value = '';
    elements.fileStatus.textContent = '';
    elements.importModal.classList.add('show');
}

function closeImportModal() {
    elements.importModal.classList.remove('show');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                elements.importData.value = JSON.stringify(data, null, 2);
                elements.fileStatus.textContent = `Arquivo "${file.name}" carregado com sucesso!`;
            } catch (error) {
                elements.fileStatus.textContent = 'Erro: Arquivo JSON inválido.';
            }
        };
        reader.readAsText(file);
    } else {
        elements.fileStatus.textContent = 'Por favor, selecione um arquivo JSON válido.';
    }
}

async function importDictionary() {
    const data = elements.importData.value.trim();
    
    if (!data) {
        alert('Por favor, cole os dados JSON ou selecione um arquivo.');
        return;
    }
    
    try {
        const importedDict = JSON.parse(data);
        
        if (typeof importedDict !== 'object' || importedDict === null) {
            throw new Error('Dados inválidos');
        }
        
        const wordCount = Object.keys(importedDict).length;
        
        if (wordCount === 0) {
            alert('Nenhuma palavra encontrada nos dados importados.');
            return;
        }
        
        const confirmed = confirm(
            `Importar ${wordCount} palavra(s)? ` +
            'Palavras com o mesmo nome serão sobrescritas.'
        );
        
        if (confirmed) {
            const result = await window.electronAPI.importDictionary(importedDict);
            
            if (result.success) {
                // Atualiza dicionário local
                dictionary = { ...dictionary, ...importedDict };
                
                closeImportModal();
                handleSearch(); // Reaplica filtro
                updateUI();
                showStatus(`${result.count} palavra(s) importada(s) com sucesso!`);
            }
        }
        
    } catch (error) {
        console.error('Erro ao importar:', error);
        alert('Erro ao importar dados. Verifique se o JSON está válido.');
    }
}

async function exportDictionary() {
    try {
        const data = await window.electronAPI.exportDictionary();
        const jsonString = JSON.stringify(data, null, 2);
        
        // Cria link de download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dicionario-pessoal-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showStatus('Dicionário exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('Erro ao exportar dicionário. Tente novamente.');
    }
}

// Atualiza interface
function updateUI() {
    const wordCount = Object.keys(dictionary).length;
    elements.wordCount.textContent = `${wordCount} palavra${wordCount !== 1 ? 's' : ''}`;
    
    // Atualiza status
    if (wordCount === 0) {
        elements.statusText.textContent = 'Dicionário vazio • Use Ctrl+Shift+D para capturar texto';
    } else {
        elements.statusText.textContent = `${wordCount} palavra(s) • Use Ctrl+Shift+D para capturar texto`;
    }
}

// Keyboard shortcuts
function handleKeyboard(event) {
    // Esc fecha modais
    if (event.key === 'Escape') {
        if (elements.wordModal.classList.contains('show')) {
            closeWordModal();
        } else if (elements.settingsModal.classList.contains('show')) {
            closeSettingsModal();
        } else if (elements.importModal.classList.contains('show')) {
            closeImportModal();
        }
    }
    
    // Ctrl+N adiciona nova palavra
    if (event.ctrlKey && event.key === 'n' && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        openWordModal();
    }
    
    // Ctrl+F foca na busca
    if (event.ctrlKey && event.key === 'f' && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        elements.searchInput.focus();
        elements.searchInput.select();
    }
    
    // Enter salva palavra no modal
    if (event.key === 'Enter' && elements.wordModal.classList.contains('show')) {
        if (event.ctrlKey) {
            saveWord();
        }
    }
}

// Utilitários
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showStatus(message, type = 'success') {
    elements.statusText.textContent = message;
    
    if (type === 'error') {
        elements.statusText.style.color = '#dc3545';
    } else {
        elements.statusText.style.color = '#28a745';
    }
    
    setTimeout(() => {
        updateUI();
        elements.statusText.style.color = '';
    }, 3000);
}

// Copy to clipboard utility for import instructions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showStatus('Código copiado para a área de transferência!');
    }).catch(() => {
        // Fallback para browsers mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showStatus('Código copiado para a área de transferência!');
    });
}

// Listen for events from main process
if (window.electronAPI) {
    window.electronAPI.onShowSettings(() => {
        openSettingsModal();
    });
}