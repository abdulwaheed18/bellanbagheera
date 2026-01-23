document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('product-search');
    const tabsContainer = document.getElementById('category-tabs'); // New Tab Container
    const sortSelect = document.getElementById('sort-select');
    const footerSocials = document.getElementById('footer-socials'); // Footer div for socials

    let allProducts = [];
    let currentCategory = 'All'; // Active category state
    const fetchErrors = [];

    // --- 1. DATA FETCHING ---

    function parseCSV(text) {
        try {
            const lines = text.trim().split(/\r?\n(?=(?:[^"]*"[^"]*")*[^"]*$)/);
            if (lines.length < 2) return [];

            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const keyMap = {
                'title': 'title', 'name': 'title', 'product url': 'url',
                'image url': 'image', 'store': 'store', 'category': 'category',
                'notes': 'notes', 'price': 'price', 'recommendation': 'recommendation'
            };
            const mappedHeader = header.map(h => keyMap[h] || h);

            return lines.slice(1).map(line => {
                if (!line.trim()) return null;
                const values = [];
                let currentValue = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        if (inQuotes && line[i + 1] === '"') { currentValue += '"'; i++; }
                        else { inQuotes = !inQuotes; }
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue.trim()); currentValue = '';
                    } else { currentValue += char; }
                }
                values.push(currentValue.trim());
                return mappedHeader.reduce((obj, key, index) => {
                    if (key) obj[key] = values[index];
                    return obj;
                }, {});
            }).filter(Boolean);
        } catch (error) {
            console.error("CSV Parse Error", error);
            return [];
        }
    }

    async function loadAllProducts() {
        if (!config.googleSheetUrl) return;
        try {
            const response = await fetch(config.googleSheetUrl);
            const parsedProducts = parseCSV(await response.text());
            allProducts = parsedProducts.map(product => ({
                ...product,
                price: product.price ? parseFloat(String(product.price).replace(/[^0-9.-]+/g, "")) : 0,
                category: product.category ? product.category.split(',').map(c => c.trim()).filter(Boolean) : []
            }));
        } catch (error) {
            console.error("Fetch Error", error);
        }
    }

    // --- 2. RENDERERS ---

    function renderTabs() {
        if (!tabsContainer) return;

        // Extract unique categories
        const allCats = allProducts.flatMap(p => p.category || []);
        const categories = ['All', "Top Picks", ...new Set(allCats)].filter((v, i, a) => a.indexOf(v) === i); // Unique

        tabsContainer.innerHTML = categories.map(c =>
            `<span class="cat-tab ${c === currentCategory ? 'active' : ''}" data-category="${c}">${c}</span>`
        ).join('');

        // Add click listeners
        tabsContainer.querySelectorAll('.cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state UI
                document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update state and re-render grid
                currentCategory = tab.dataset.category;
                updateView();
            });
        });
    }

    function renderFooterSocials() {
        if (!footerSocials) return;

        const socialIconsHTML = config.socials.map(social =>
            `<a href="${social.url}" target="_blank" aria-label="${social.name}">
                <img src="${social.icon}" style="width:24px; height:24px;" alt="${social.name}">
            </a>`
        ).join('');

        const disclosureHTML = config.affiliateDisclosure ? `<p class="affiliate-disclosure" style="margin-top:1.5rem;">${config.affiliateDisclosure}</p>` : '';

        footerSocials.innerHTML = socialIconsHTML;
        // Append disclosure after socials in the parent container
        // Note: Ideally structure should support this better, inserting adjacent for now
        const container = footerSocials.parentElement;
        const existingDisclosure = container.querySelector('.affiliate-disclosure');
        if (existingDisclosure) existingDisclosure.remove();

        if (disclosureHTML) {
            footerSocials.insertAdjacentHTML('afterend', disclosureHTML);
        }
    }

    function renderProducts(productsToRender) {
        if (!grid) return;

        // Staggered entry animation is handled by CSS nth-child or JS delay
        grid.innerHTML = productsToRender.map((product, index) => {
            const delay = index * 100; // 100ms stagger

            // Logic for Recommendation Status (Badge)
            // Logic for Recommendation Status (Badge)
            let badge = '';
            if (product.recommendation) {
                const rec = product.recommendation.toLowerCase().trim();
                if (rec === 'recommended') {
                    badge = `<div class="product-card__badge product-card__badge--recommended">BNB PICK</div>`;
                } else if (rec === 'ok') {
                    badge = `<div class="product-card__badge product-card__badge--ok">GOOD FIND</div>`;
                } else if (rec === 'avoid') {
                    badge = `<div class="product-card__badge product-card__badge--avoid">NOT OUR FAVE</div>`;
                }
            }

            // Note Logic
            let noteBtn = '';
            if (product.notes) {
                const originalIndex = allProducts.findIndex(p => p === product);
                noteBtn = `<div class="txt-btn notes-trigger" data-product-index="${originalIndex}">READ NOTES</div>`;
            }

            return `
            <div class="edit-card" style="animation-delay: ${delay}ms">
                <div class="edit-card__img-wrapper">
                    ${badge}
                    <a href="${product.url}" target="_blank">
                        <img src="${product.image}" class="edit-card__img" loading="lazy" alt="${product.title}">
                    </a>
                </div>
                <div class="edit-card__details">
                    <h3 class="edit-card__title">${product.title}</h3>
                    <p class="edit-card__price">₹${product.price.toFixed(2)}</p>
                    
                    <div class="edit-card__meta-actions">
                         ${noteBtn}
                         <a href="${product.url}" target="_blank" class="txt-btn">BUY NOW</a>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        feather.replace();
    }

    function updateView() {
        const query = searchInput.value.toLowerCase();
        const sortBy = sortSelect.value;

        // Filter
        let filtered = allProducts.filter(p => {
            const matchesCat = currentCategory === 'All' ? true : (p.category && p.category.includes(currentCategory));
            const matchesSearch = p.title.toLowerCase().includes(query);
            return matchesCat && matchesSearch;
        });

        // Sort
        if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);

        renderProducts(filtered);
    }

    // --- 3. INIT ---
    async function init() {
        await loadAllProducts();
        renderTabs();
        renderFooterSocials();
        updateView();

        // Listeners
        searchInput.addEventListener('input', updateView);
        sortSelect.addEventListener('change', updateView);

        // Modal
        MicroModal.init({
            openTrigger: 'data-custom-open',
            closeTrigger: 'data-close-modal',
            disableScroll: true,
            awaitCloseAnimation: true
        });

        // Event delegation for Notes
        grid.addEventListener('click', e => {
            const trigger = e.target.closest('.notes-trigger');
            if (trigger) {
                const idx = trigger.dataset.productIndex;
                const product = allProducts[idx];
                document.getElementById('notes-modal-title').textContent = product.title;
                document.getElementById('notes-modal-content').innerHTML = formatNotesContent(product.notes);

                const modal = document.getElementById('notes-modal');
                modal.classList.add('is-open');
                modal.setAttribute('aria-hidden', 'false');

                // Robustly load and process Instagram embeds
                if (window.instgrm) {
                    window.instgrm.Embeds.process();
                } else {
                    const scriptId = 'instagram-embed-script';
                    if (!document.getElementById(scriptId)) {
                        const s = document.createElement('script');
                        s.id = scriptId;
                        s.src = "https://www.instagram.com/embed.js";
                        s.async = true;
                        s.defer = true;
                        s.onload = () => {
                            if (window.instgrm) window.instgrm.Embeds.process();
                        };
                        document.body.appendChild(s);
                    }
                }
            }
        });

        // Custom Modal Close Logic because we aren't using default Micromodal triggers for this custom setup
        document.querySelectorAll('[data-close-modal]').forEach(b => {
            b.addEventListener('click', () => {
                const modal = document.getElementById('notes-modal');
                modal.classList.remove('is-open');
                setTimeout(() => modal.setAttribute('aria-hidden', 'true'), 300);
            });
        });
    }

    init();
});