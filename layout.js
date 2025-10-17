// ==============================================================================
// layout.js - Construtor de Cabeçalho e Rodapé
// ==============================================================================

/**
 * Constrói o cabeçalho da página com base nas configurações fornecidas.
 * @param {object} config - Objeto de configuração.
 * @param {string} config.title - O título a ser exibido no cabeçalho.
 * @param {string} config.buttonText - O texto do botão de navegação.
 * @param {string} config.buttonLink - O URL para onde o botão aponta.
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
                <a href="${config.buttonLink}" class="nav-button">${config.buttonText}</a>
            </nav>
        </header>
    `;
}

/**
 * Constrói o rodapé padrão para todas as páginas.
 */
function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;

    // Usando o ano atual dinamicamente
    const currentYear = new Date().getFullYear();

    footerPlaceholder.innerHTML = `
        <footer class="footer">
            <p>© ${currentYear} Painel de Monitoramento | Desenvolvido por 👤@juniorkrad + 🤖Gemini</p>
        </footer>
    `;
}