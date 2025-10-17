// ==============================================================================
// layout.js - Construtor de Layout (Cabeçalho, Rodapé e Timestamp)
// ==============================================================================

/**
 * Constrói o cabeçalho da página.
 */
function loadHeader(config) {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    headerPlaceholder.innerHTML = `
        <header class="header">
            <div class="logo-title-group">
                <img src="banner2.png" alt="Logo da Empresa">
                <h1>${config.title}</h1>
            </div>
            <nav class="header-nav">
                <span id="update-timestamp"></span>
                <a href="${config.buttonLink}" class="nav-button">${config.buttonText}</a>
            </nav>
        </header>
    `;
}

/**
 * Constrói o rodapé padrão.
 */
function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;
    const currentYear = new Date().getFullYear();
    footerPlaceholder.innerHTML = `
        <footer class="footer">
            <p>© ${currentYear} Painel de Monitoramento | Desenvolvido por 👤@juniorkrad + 🤖Gemini</p>
        </footer>
    `;
}

/**
 * Busca e exibe o timestamp da coleta de dados a partir da planilha.
 * @param {string} sheetTab - O nome da aba da planilha (ex: 'HEL1', 'SBO1').
 * @param {string} apiKey - A chave da API do Google.
 * @param {string} sheetId - O ID da Planilha Google.
 */
async function loadTimestamp(sheetTab, apiKey, sheetId) {
    const timestampEl = document.getElementById('update-timestamp');
    if (!timestampEl) return;

    timestampEl.textContent = 'Buscando data...';
    const range = `${sheetTab}!K1`; // A célula onde o script Python salva a data
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha na busca do timestamp.');
        
        const data = await response.json();
        if (data.values && data.values.length > 0 && data.values[0][0]) {
            timestampEl.textContent = data.values[0][0]; // Exibe o texto da célula K1
        } else {
            timestampEl.textContent = 'Data não encontrada.';
        }
    } catch (error) {
        timestampEl.textContent = 'Falha ao buscar data.';
        console.error('Erro ao buscar timestamp:', error);
    }
}