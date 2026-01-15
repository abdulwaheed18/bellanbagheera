document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('product-search');
    const categoriesContainer = document.querySelector('.categories');
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');

    let allProducts = [];
    const fetchErrors = [];

    // --- 1. DATA FETCHING & PARSING (FINAL, CORRECTED VERSION) ---

    function parseCSV(text) {
        try {
            // Correctly split by newline characters (\n) or carriage return + newline (\r\n).
            // This was the source of the bug.
            const lines = text.trim().split(/\r?\n/);

            if (lines.length < 2) {
                fetchErrors.push("Parser Error: The data could not be split into lines. The file may be empty or in an unexpected format.");
                return [];
            }

            const headerLine = lines[0];
            const delimiter = ',';

            const header = headerLine.split(delimiter).map(h => h.trim().toLowerCase());

            const keyMap = {
                'title': 'title',
                'product url': 'url',
                'image url': 'image',
                'store': 'store',
                'category': 'category'
            };
            const mappedHeader = header.map(h => keyMap[h] || h);

            const products = lines.slice(1).map(line => {
                if (!line.trim()) return null;
                const values = line.split(delimiter).map(v => v.trim());
                return mappedHeader.reduce((obj, key, index) => {
                    if (key) obj[key] = values[index];
                    return obj;
                }, {});
            }).filter(Boolean);

            if (products.length === 0 && fetchErrors.length === 0) {
                fetchErrors.push("The file was fetched successfully, but no products were found after parsing. Please check the sheet's content.");
            }
            return products;

        } catch (error) {
            console.error("A fatal error occurred during CSV parsing:", error);
            fetchErrors.push("A critical error occurred while parsing the data. See the browser's developer console for details.");
            return [];
        }
    }

    async function loadAllProducts() {
        if (!config.googleSheetUrl || !config.googleSheetUrl.startsWith('https://docs.google.com/spreadsheets/d/e/')) {
            fetchErrors.push("Invalid Google Sheet URL in config.js.");
            return;
        }
        try {
            const response = await fetch(config.googleSheetUrl);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            allProducts = parseCSV(await response.text());
        } catch (error) {
            console.error(`Error fetching from ${config.googleSheetUrl}:`, error);
            fetchErrors.push("Could not load products. Check the URL and ensure the sheet is published correctly.");
        }
    }

    // --- 2. UI RENDERING ---
    function getSocialsHTML() { return config.socials.map(social => `<a href="${social.url}" target="_blank" aria-label="${social.name}"><img src="${social.icon}" alt="${social.name}"></a>`).join(''); }
    function renderProducts(filter = 'all', query = '') {
        if (fetchErrors.length > 0) { grid.innerHTML = `<div class="error-box"><h3>Failed to Load Products</h3><ul>${fetchErrors.map(err => `<li>${err}</li>`).join('')}</ul></div>`; return; }
        if (allProducts.length === 0) { grid.innerHTML = '<p>No products found. Your sheet might be empty or the format is unreadable.</p>'; return; }
        const filtered = allProducts.filter(p => (filter === 'all' || (p.category && p.category.toLowerCase() === filter.toLowerCase())) && (p.title && p.title.toLowerCase().includes(query.toLowerCase())));
        if (filtered.length === 0) { grid.innerHTML = '<p>No products match your search.</p>'; return; }
        grid.innerHTML = filtered.map(product => `<a href="${product.url}" target="_blank" class="card"><img src="${product.image}" alt="${product.title}"><div class="card-content"><div class="card-title">${product.title}</div><div class="btn">View on ${product.store || 'Store'}</div></div></a>`).join('');
    }
    function renderUI() {
        // --- WhatsApp & Collab Button ---
        const whatsAppSocial = config.socials.find(s => s.name.toLowerCase() === 'whatsapp');
        let collabButtonHTML = '';
        if (whatsAppSocial) {
            collabButtonHTML = `
                <a href="${whatsAppSocial.url}" target="_blank" rel="noopener noreferrer" class="collab-button">
                    <img src="${whatsAppSocial.icon}" alt="WhatsApp Icon" class="whatsapp-icon">
                    <div>
                        <strong>Quick Connect for Collabs</strong>
                        <span>Messages only, no calls please.</span>
                    </div>
                </a>`;
        }

        document.title = `${config.profile.name} | Links`;
        header.innerHTML = `<img class="profile-avatar" src="${config.profile.avatar}" alt="Avatar"><h1>${config.profile.name}</h1><p>${config.profile.bio.replace(/\n/g, '<br />')}</p>${collabButtonHTML}<div class="social-links">${getSocialsHTML()}</div>`;
        const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        categoriesContainer.innerHTML = '<div class="chip active" data-filter="all">All Items</div>' + categories.map(c => `<div class="chip" data-filter="${c}">${c}</div>`).join('');
        footer.innerHTML = `<div class="footer-nav">${config.footerLinks.map(link => `<a href="${link.url}">${link.name}</a>`).join('')}</div><div class="footer-socials">${getSocialsHTML()}</div><p>${config.footerText.replace('{year}', new Date().getFullYear())}</p>`;
        renderProducts();
        feather.replace();
    }

    // --- 3. INITIALIZATION ---
    async function init() {
        document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
        await loadAllProducts();
        renderUI();
        searchInput.addEventListener('input', e => renderProducts(document.querySelector('.chip.active').dataset.filter, e.target.value));
        categoriesContainer.addEventListener('click', e => { if (!e.target.classList.contains('chip')) return; document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); e.target.classList.add('active'); renderProducts(e.target.dataset.filter, searchInput.value); });
        document.getElementById('theme-toggle').addEventListener('click', () => { const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); feather.replace(); });
    }
    init();
});