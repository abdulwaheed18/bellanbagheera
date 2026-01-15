document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('product-search');
    const categoriesContainer = document.querySelector('.categories');
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');

    let allProducts = []; // This will hold all products fetched from Google Sheets.

    // --- 1. DATA FETCHING & PARSING ---

    /**
     * Parses raw CSV text into an array of JavaScript objects.
     * Assumes the first row is the header.
     * @param {string} text - The raw CSV text.
     * @returns {Array<Object>} An array of product objects.
     */
    function parseCSV(text) {
        try {
            const lines = text.trim().split('\\n');
            if (lines.length < 2) return []; // Return empty if no data rows.

            const header = lines[0].split(',').map(h => h.trim());

            return lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                return header.reduce((obj, key, index) => {
                    obj[key] = values[index];
                    return obj;
                }, {});
            });
        } catch (error) {
            console.error("Failed to parse CSV:", error);
            return [];
        }
    }

    /**
     * Fetches product data from a single Google Sheet source URL.
     * @param {Object} source - An object containing the category and URL.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of products.
     */
    async function fetchProductsFromSource(source) {
        try {
            const response = await fetch(source.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            const products = parseCSV(csvText);

            // Add the category from the config to each product
            return products.map(product => ({ ...product, category: source.category }));
        } catch (error) {
            console.error(`Error fetching or parsing from ${source.url}:`, error);
            // Return an empty array on failure so Promise.all doesn't fail completely.
            return [];
        }
    }

    /**
     * Fetches products from all configured sources and triggers the initial UI render.
     */
    async function loadAllProducts() {
        const productPromises = config.googleSheetSources.map(fetchProductsFromSource);
        const productArrays = await Promise.all(productPromises);
        allProducts = productArrays.flat(); // Flatten the array of arrays into a single list.

        renderUI(); // Render the full UI now that we have the product data.
    }

    // --- 2. UI RENDERING ---

    function getSocialsHTML() {
        return config.socials.map(social => `
            <a href="${social.url}" target="_blank" aria-label="${social.name}">
                <img src="${social.icon}" alt="${social.name}">
            </a>
        `).join('');
    }

    function renderProducts(filter = 'all', query = '') {
        const filtered = allProducts.filter(p => {
            const matchesCategory = filter === 'all' || (p.category && p.category.split(' ').includes(filter));
            const matchesSearch = p.title && p.title.toLowerCase().includes(query.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = '<p>No products found.</p>';
            return;
        }

        grid.innerHTML = filtered.map(product => `
            <a href="${product.url}" target="_blank" class="card">
                <img src="${product.image}" alt="${product.title}">
                <div class="card-content">
                    <div class="card-title">${product.title}</div>
                    <div class="btn">View on ${product.store || 'Store'}</div>
                </div>
            </a>
        `).join('');
    }

    function renderUI() {
        // Set page title
        document.title = `${config.profile.name} | Links`;

        // Render Header
        header.innerHTML = `
            <img class="profile-avatar" src="${config.profile.avatar}" alt="Avatar">
            <h1>${config.profile.name}</h1>
            <p>${config.profile.bio.replace(/\\n/g, '<br />')}</p>
        `;

        // Render Categories
        let chips = '<div class="chip active" data-filter="all">All Items</div>';
        chips += config.categories.map(c => `<div class="chip" data-filter="${c.id}">${c.name}</div>`).join('');
        categoriesContainer.innerHTML = chips;

        // Render Footer
        footer.innerHTML = `
            <div class="footer-socials">${getSocialsHTML()}</div>
            <p>${config.footerText.replace('{year}', new Date().getFullYear())}</p>
        `;

        // Initial render of products
        renderProducts();
        feather.replace(); // Ensure all icons are rendered.
    }

    // --- 3. EVENT LISTENERS ---

    function setupEventListeners() {
        searchInput.addEventListener('input', (e) => {
            const activeFilter = document.querySelector('.chip.active').dataset.filter;
            renderProducts(activeFilter, e.target.value);
        });

        categoriesContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('chip')) return;
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            renderProducts(e.target.dataset.filter, searchInput.value);
        });

        document.getElementById('theme-toggle').addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            // Re-apply icon filters based on the new theme
            feather.replace();
        });
    }

    // --- 4. INITIALIZATION ---

    function init() {
        // Apply theme first to prevent flash of unstyled content
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        setupEventListeners();
        loadAllProducts(); // Fetch data and render the page.
    }

    init();
});