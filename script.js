document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('product-search');
    const filterContainer = document.querySelector('.filter-section');
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

    /**
     * Creates a clean product URL. For mobile Amazon links, it creates a minimal URL
     * to improve the chances of it opening in the native app.
     * @param {object} product The product object.
     * @returns {string} The cleaned URL.
     */
    function getCleanProductUrl(product) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && product.url && product.url.includes('amazon.in')) {
            const asinMatch = product.url.match(/\/dp\/([A-Z0-9]{10})/);
            if (asinMatch && asinMatch[1]) {
                return `https://www.amazon.in/dp/${asinMatch[1]}`;
            }
        }
        return product.url;
    }

    function getSocialsHTML() { return config.socials.map(social => `<a href="${social.url}" target="_blank" aria-label="${social.name}"><img src="${social.icon}" alt="${social.name}"></a>`).join(''); }
    function renderProducts(filter = 'all', query = '') {
        if (fetchErrors.length > 0) { grid.innerHTML = `<div class="error-box"><h3>Failed to Load Products</h3><ul>${fetchErrors.map(err => `<li>${err}</li>`).join('')}</ul></div>`; return; }
        if (allProducts.length === 0) { grid.innerHTML = '<p>No products found. Your sheet might be empty or the format is unreadable.</p>'; return; }
        const filtered = allProducts.filter(p => (filter === 'all' || (p.category && p.category.toLowerCase() === filter.toLowerCase())) && (p.title && p.title.toLowerCase().includes(query.toLowerCase())));
        if (filtered.length === 0) { grid.innerHTML = '<p>No products match your search.</p>'; return; }
        grid.innerHTML = filtered.map((product, index) => {
            const productUrl = getCleanProductUrl(product);
            const storeName = product.store || 'Store';
            let buttonHTML;

            if (storeName.toLowerCase() === 'amazon') {
                buttonHTML = `<div class="btn btn-amazon">View on Amazon</div>`;
            } else {
                buttonHTML = `<div class="btn">View on ${storeName}</div>`;
            }

            return `<a href="${productUrl}" target="_blank" class="card" style="animation-delay: ${index * 50}ms"><img src="${product.image}" alt="${product.title}"><div class="card-content"><div class="card-title">${product.title}</div>${buttonHTML}</div></a>`;
        }).join('');
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

        const socialsHTML = getSocialsHTML();

        document.title = `${config.profile.name} | Links`;
        header.innerHTML = `<img class="profile-avatar" src="${config.profile.avatar}" alt="Avatar"><h1>${config.profile.name}</h1><p>${config.profile.bio.replace(/\n/g, '<br />')}</p>${collabButtonHTML}<div class="social-links">${socialsHTML}</div>`;
        const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        const optionsHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        filterContainer.innerHTML = `
            <label for="category-select" class="category-label">Category:</label>
            <div class="select-wrapper">
                <select id="category-select">
                    <option value="all">All Categories</option>
                    ${optionsHTML}
                </select>
            </div>`;
        const disclosureHTML = config.affiliateDisclosure ? `<p class="affiliate-disclosure">${config.affiliateDisclosure}</p>` : '';
        footer.innerHTML = `${disclosureHTML}<div class="footer-socials">${socialsHTML}</div><p>${config.footerText.replace('{year}', new Date().getFullYear())}</p>`;
        renderProducts();
        feather.replace();
    }

    /**
     * Creates a trail of paw prints that follow the cursor.
     */
    function initPawCursor() {
        const pawIconUrl = 'images/icons/paw.svg';
        let lastX = -100;
        let lastY = -100;

        window.addEventListener('mousemove', e => {
            const distance = Math.sqrt(Math.pow(e.pageX - lastX, 2) + Math.pow(e.pageY - lastY, 2));
            if (distance < 50) return; // Throttle paw creation

            lastX = e.pageX;
            lastY = e.pageY;

            const paw = document.createElement('img');
            paw.setAttribute('src', pawIconUrl);
            paw.classList.add('paw-trail');
            paw.style.left = `${e.pageX - 15}px`;
            paw.style.top = `${e.pageY - 15}px`;
            document.body.appendChild(paw);

            setTimeout(() => {
                paw.style.opacity = '0';
                paw.style.transform = 'scale(0.5) rotate(30deg)';
                setTimeout(() => paw.remove(), 600); // Remove from DOM after transition
            }, 100);
        });
    }

    // --- 3. INITIALIZATION ---
    async function init() {
        document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
        await loadAllProducts();
        renderUI();

        const categorySelect = document.getElementById('category-select');

        searchInput.addEventListener('input', e => renderProducts(categorySelect.value, e.target.value));
        categorySelect.addEventListener('change', e => renderProducts(e.target.value, searchInput.value));

        document.getElementById('theme-toggle').addEventListener('click', () => { const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); feather.replace(); });

        initPawCursor();
    }
    init();
});