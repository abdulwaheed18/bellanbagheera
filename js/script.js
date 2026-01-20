document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('product-search');
    const filterContainer = document.getElementById('category-filter-container');
    const profileContainer = document.getElementById('profile-container');
    const footerContainer = document.getElementById('footer-content');

    let allProducts = [];
    const fetchErrors = [];

    // --- 1. DATA FETCHING & PARSING (FINAL, CORRECTED VERSION) ---

    function parseCSV(text) {
        try {
            // Split by newlines, but only if they are not inside double quotes. This handles multi-line notes.
            const lines = text.trim().split(/\r?\n(?=(?:[^"]*"[^"]*")*[^"]*$)/);

            if (lines.length < 2) {
                fetchErrors.push("Parser Error: The data could not be split into lines. The file may be empty or in an unexpected format.");
                return [];
            }

            const headerLine = lines[0];
            const delimiter = ',';

            const header = headerLine.split(delimiter).map(h => h.trim().toLowerCase());

            const keyMap = {
                'title': 'title',
                'name': 'title', // Also recognize 'name' column and map it to 'title'
                'product url': 'url',
                'image url': 'image',
                'store': 'store',
                'category': 'category',
                'notes': 'notes',
                'price': 'price',
                'recommendation': 'recommendation' // For BNB's Pick, etc.
            };
            const mappedHeader = header.map(h => keyMap[h] || h);

            const products = lines.slice(1).map(line => { // Start from the line after the header
                if (!line.trim()) return null;

                // This robust parser handles commas inside quoted fields, e.g., "Note, with a comma"
                const values = [];
                let currentValue = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        // Handle escaped quotes ("") by treating them as a single literal quote
                        if (inQuotes && line[i + 1] === '"') {
                            currentValue += '"';
                            i++; // Skip the next character
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue.trim());
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                values.push(currentValue.trim()); // Add the final value

                return mappedHeader.reduce((obj, key, index) => {
                    if (key) obj[key] = values[index];
                    return obj;
                }, {});
            }).filter(Boolean);

            if (products.length === 0 && fetchErrors.length === 0) {
                fetchErrors.push("The file was fetched, but no products were found after parsing. Please check the sheet's content and format.");
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
            const parsedProducts = parseCSV(await response.text());

            // Process and store products, ensuring price is a number for correct sorting
            allProducts = parsedProducts.map(product => ({
                ...product,
                price: product.price ? parseFloat(String(product.price).replace(/[^0-9.-]+/g, "")) : 0,
                // Split categories string into an array, trim whitespace, and remove any empty entries.
                category: product.category ? product.category.split(',').map(c => c.trim()).filter(Boolean) : []
            }));

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

    /**
     * Sanitizes text and converts URLs into clickable links.
     * @param {string} text The text to process.
     * @returns {string} HTML string with links.
     */
    function linkify(text) {
        if (!text) return '';
        // A simple sanitizer
        const sanitizedText = text.replace(/[&<>"']/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match]));

        // Find URLs and wrap them in <a> tags
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return sanitizedText.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    }

    function renderProducts(productsToRender) {
        grid.classList.add('grid--loading');

        // Use a short timeout to allow the loading animation to be visible
        setTimeout(() => {
        if (fetchErrors.length > 0) { grid.innerHTML = `<div class="error-box"><h3>Failed to Load Products</h3><ul>${fetchErrors.map(err => `<li>${err}</li>`).join('')}</ul></div>`; return; }
        // Check allProducts for the initial empty state message
        if (allProducts.length === 0) { 
            grid.innerHTML = '<p>No products found. Your sheet might be empty or the format is unreadable.</p>'; 
            grid.classList.remove('grid--loading');
            return; 
        }

        if (productsToRender.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i data-feather="frown"></i><p>No products match your search.</p></div>`;
            grid.classList.remove('grid--loading');
            feather.replace(); // Render the new icon
            return;
        }
        grid.innerHTML = productsToRender.map((product, index) => {
            const productUrl = getCleanProductUrl(product);
            const storeName = product.store || 'Store';

            // Find the original index of the product in the master list for stable referencing
            const originalIndex = allProducts.findIndex(p => p === product);

            let recommendationBadge = '';
            if (product.recommendation) {
                const rec = product.recommendation.toLowerCase().trim();
                if (rec === 'recommended') {
                    recommendationBadge = `
                        <div class="product-card__badge product-card__badge--recommended">
                            <i data-feather="award"></i> BNB's Pick
                        </div>`;
                } else if (rec === 'ok') {
                    recommendationBadge = `
                        <div class="product-card__badge product-card__badge--ok">
                            <i data-feather="thumbs-up"></i> Good Find
                        </div>`;
                } else if (rec === 'avoid') {
                    recommendationBadge = `
                        <div class="product-card__badge product-card__badge--avoid">
                            <i data-feather="thumbs-down"></i> Not Our Fave
                        </div>`;
                }
            }

            let notesHTML = '';
            if (product.notes) {
                let buttonText;
                let buttonIcon = 'message-square';
                let buttonClass = '';
                const rec = product.recommendation ? product.recommendation.toLowerCase().trim() : '';

                switch (rec) {
                    case 'recommended':
                        buttonText = 'Our Pawsitive Review';
                        buttonClass = 'notes-trigger--recommended';
                        break;
                    case 'ok':
                        buttonText = "BNB's Thoughts";
                        buttonClass = 'notes-trigger--ok';
                        break;
                    case 'avoid':
                        buttonText = 'Why We Avoid It';
                        buttonIcon = 'alert-circle'; // Use a warning icon for clarity
                        buttonClass = 'notes-trigger--avoid';
                        break;
                    default: // For products with notes but no recommendation status
                        buttonText = "Read Our Notes";
                        break;
                }
                notesHTML = `<button class="notes-trigger ${buttonClass}" data-product-index="${originalIndex}"><i data-feather="${buttonIcon}"></i> ${buttonText}</button>`;
            }

            let buttonHTML;

            if (storeName.toLowerCase() === 'amazon') {
                buttonHTML = `<a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-amazon">View on Amazon</a>`;
            } else {
                buttonHTML = `<a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="btn">View on ${storeName}</a>`;
            }

            const priceHTML = product.price > 0 ? `<p class="product-card__price">₹${product.price.toFixed(2)}</p>` : '';

            return `<div class="product-card" style="animation-delay: ${index * 50}ms">
                        ${recommendationBadge}
                        <a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="product-card__image-link">
                            <img class="product-card__image" src="${product.image}" alt="${product.title}" loading="lazy">
                        </a>
                        <div class="product-card__info">
                            <h3 class="product-card__title">${product.title}</h3>
                            ${priceHTML}
                        </div>
                        <div class="product-card__actions">
                            ${notesHTML}
                            ${buttonHTML}
                        </div>
                    </div>`;
        }).join('');
        grid.classList.remove('grid--loading');
        feather.replace();
        }, 200); // 200ms delay
    }

    function renderProfile() {
        if (!profileContainer) return;
        const socialsHTML = config.socials.map(social => {
            return `<a href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${social.name}"><img src="${social.icon}" class="social-icon-svg" alt="${social.name}"></a>`;
        }).join('');

        profileContainer.innerHTML = `
            <div class="profile-block">
                <img class="profile-block__avatar" src="${config.profile.avatar}" alt="Avatar">
                <h2 class="profile-block__name">${config.profile.name}</h2>
                <p class="profile-block__bio">${config.profile.bio.replace(/\n/g, '<br />')}</p>
                <div class="profile-block__socials">${socialsHTML}</div>
            </div>
        `;
    }

    function renderHero() {
        const heroTitle = document.getElementById('hero-title');
        const heroSubtitle = document.getElementById('hero-subtitle');
        const searchInput = document.getElementById('product-search');

        if (config.hero) {
            if (heroTitle && config.hero.title) {
                heroTitle.textContent = config.hero.title;
            }
            if (heroSubtitle && config.hero.subtitle) {
                heroSubtitle.textContent = config.hero.subtitle;
            }
        }
        // Also update search placeholder for consistency
        if (searchInput) {
            searchInput.placeholder = "Search our favorite finds...";
        }
    }

    function renderFilters() {
        if (!filterContainer) return;
        // Use flatMap to get all categories from all products into a single array,
        // then use a Set to get the unique values, and finally sort them alphabetically.
        const allCategoryInstances = allProducts.flatMap(p => p.category || []);
        const categories = [...new Set(allCategoryInstances)].sort();

        const defaultCategory = "Top Picks";

        const optionsHTML = categories.map(c =>
            `<option value="${c}" ${c === defaultCategory ? 'selected' : ''}>${c}</option>`
        ).join('');
        filterContainer.innerHTML = `
            <div class="category-filter">
                <label for="category-select">Category</label>
                <div class="select-wrapper">
                    <select id="category-select">
                        ${optionsHTML}
                    </select>
                    <i data-feather="chevron-down"></i>
                </div>
            </div>`;
    }

    function renderFooter() {
        if (!footerContainer) return;

        const logoName = config.profile.logoName || config.profile.name;

        const socialsListHTML = config.socials.map(social => {
            return `<a href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${social.name}"><img src="${social.icon}" class="social-icon-svg" alt="${social.name}"></a>`;
        }).join('');

        const brandHTML = `
            <div class="footer-column footer-brand">
                <h3 class="footer-logo">${logoName}</h3>
                <p>${config.profile.bio}</p>
                <div class="footer-social-icons">${socialsListHTML}</div>
            </div>`;

        const contactHTML = `
            <div class="footer-column">
                <h4 class="footer-heading">Get in Touch</h4>
                <p class="collaboration-message">For collabs, reach out on WhatsApp (messages only).</p>
            </div>`;

        const disclosureHTML = config.affiliateDisclosure ? `<p class="affiliate-disclosure">${config.affiliateDisclosure}</p>` : '';
        const footerTextHTML = config.footerText ? `<p class="footer-copyright">${config.footerText.replace('{year}', new Date().getFullYear())}</p>` : '';
        const bottomBarHTML = `
            <div class="footer-bottom-bar">
                ${footerTextHTML}
                ${disclosureHTML}
            </div>`;

        footerContainer.innerHTML = `
            <div class="footer-grid">
                ${brandHTML}
                ${contactHTML}
            </div>
            ${bottomBarHTML}`;

        feather.replace();
    }

    function renderUI() {
        document.title = `${config.profile.name} | Links`;
        const logoElement = document.getElementById('logo-text');
        if (logoElement) {
            logoElement.textContent = config.profile.logoName || config.profile.name;
        }

        renderHero();
        renderProfile();
        renderFilters();
        renderFooter();
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

    /**
     * Adds a class to the header when the user scrolls down.
     */
    function initHeaderScroll() {
        const header = document.querySelector('.header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            header.classList.toggle('header--scrolled', window.scrollY > 50);
        });
    }

    /**
     * Initializes the "Back to Top" button functionality.
     */
    function initBackToTopButton() {
        const backToTopButton = document.getElementById('back-to-top');
        if (!backToTopButton) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 3. INITIALIZATION ---

    async function init() {
        await loadAllProducts();
        renderUI();

        const categorySelect = document.getElementById('category-select');
        const sortSelect = document.getElementById('sort-select');

        function updateView() {
            const category = categorySelect.value;
            const query = searchInput.value.toLowerCase();
            const sortBy = sortSelect.value;

            // 1. Filter products based on category and search query
            let processedProducts = allProducts.filter(p =>
                (p.category && p.category.includes(category)) &&
                (p.title && p.title.toLowerCase().includes(query.trim()))
            );

            // 2. Sort the filtered products
            // A copy is not strictly needed here as `filter` already creates a new array,
            // but it's good practice if the logic changes.
            switch (sortBy) {
                case 'price-asc':
                    processedProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'price-desc':
                    processedProducts.sort((a, b) => b.price - a.price);
                    break;
                case 'name-asc':
                    processedProducts.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'name-desc':
                    processedProducts.sort((a, b) => b.title.localeCompare(a.title));
                    break;
                // 'default' case does nothing, preserving the original sheet order from the filtered list.
            }

            // 3. Render the final list of products
            renderProducts(processedProducts);
        }

        // Attach event listeners to all controls
        searchInput.addEventListener('input', updateView);
        categorySelect.addEventListener('change', updateView);
        sortSelect.addEventListener('change', updateView);
        // Event delegation for the notes modal trigger
        grid.addEventListener('click', e => {
            const notesButton = e.target.closest('.notes-trigger');
            if (notesButton) {
                e.preventDefault();
                const productIndex = notesButton.dataset.productIndex;
                if (productIndex !== undefined) {
                    const product = allProducts[productIndex];
                    if (product) {
                        document.getElementById('notes-modal-title').textContent = product.title;
                        // Use the new formatter to handle rich content like images, videos, and Instagram posts
                        document.getElementById('notes-modal-content').innerHTML = formatNotesContent(product.notes);
                        MicroModal.show('notes-modal');

                        // After the modal is shown and content is injected, tell the Instagram script to process any new embeds.
                        if (window.instgrm) {
                            window.instgrm.Embeds.process();
                        }
                    }
                }
            }
        });

        MicroModal.init({
            onClose: () => feather.replace(), // Redraw icons in main page if needed
            disableScroll: true,
            awaitCloseAnimation: true
        });
        initPawCursor();
        initBackToTopButton();
        initHeaderScroll();

        // Perform the initial render
        updateView();
    }
    init();
});