document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('product-search');
    const tabsContainer = document.getElementById('category-tabs');
    const sortSelect = document.getElementById('sort-select');
    const footerSocials = document.getElementById('footer-socials');

    // UI Elements for States
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const noResultsMessage = document.getElementById('no-results');

    let allProducts = [];
    let currentCategory = 'All';
    const fetchErrors = [];
    let favorites = new Set(JSON.parse(localStorage.getItem('bnb_favorites') || '[]'));

    // --- 0. UTILS ---
    function showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i data-feather="check-circle" style="color: var(--color-primary)"></i> ${message}`;

        container.appendChild(toast);
        feather.replace();

        // Animate out
        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function toggleFavorite(productTitle) {
        if (favorites.has(productTitle)) {
            favorites.delete(productTitle);
        } else {
            favorites.add(productTitle);
        }
        localStorage.setItem('bnb_favorites', JSON.stringify([...favorites]));
        updateView();

        // Animate heart
        const btns = document.querySelectorAll(`[data-u-favorite="${productTitle}"]`);
        btns.forEach(btn => {
            btn.classList.toggle('active', favorites.has(productTitle));
        });
    }

    async function shareProduct(product) {
        const shareData = {
            title: product.title,
            text: `Check out this royal treasure: ${product.title}`,
            url: product.url
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${product.title} - ${product.url}`);
                showToast('Link copied to royal scroll!');
            }
        } catch (err) {
            console.log('Error sharing:', err);
        }
    }

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

        // Show Skeleton Loading, Hide Error/Grid
        loadingIndicator.classList.add('hidden'); // Hide default spinner
        errorMessage.classList.add('hidden');
        grid.style.opacity = '1';

        // Render Skeletons
        const skeletonCount = 8;
        grid.innerHTML = Array(skeletonCount).fill(0).map(() => `
            <div class="skeleton-card">
                <div class="skeleton-img"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
        `).join('');

        try {
            const response = await fetch(config.googleSheetUrl);
            const text = await response.text();

            const parsedProducts = parseCSV(text);
            allProducts = parsedProducts.map(product => ({
                ...product,
                price: product.price ? parseFloat(String(product.price).replace(/[^0-9.-]+/g, "")) : 0,
                category: product.category ? product.category.split(',').map(c => c.trim()).filter(Boolean) : []
            }));

            // Hide Loading, Show Grid
            loadingIndicator.classList.add('hidden');
            grid.style.opacity = '1';

        } catch (error) {
            console.error("Fetch Error", error);
            loadingIndicator.classList.add('hidden');
            errorMessage.classList.remove('hidden');
        }
    }

    // --- 2. RENDERERS ---

    function renderCategoryDropdown() {
        const categorySelect = document.getElementById('category-select');
        if (!categorySelect) return;

        // Extract unique categories
        const allCats = allProducts.flatMap(p => p.category || []);
        const categories = [...new Set(allCats)].filter((v, i, a) => a.indexOf(v) === i); // Unique

        let optionsHTML = `<option value="All">All Categories</option>`;

        // Add Favorites Option
        optionsHTML += `<option value="Favorites">❤ Favorites</option>`;

        if (categories.includes("Top Picks")) {
            optionsHTML += `<option value="Top Picks">Top Picks</option>`;
            categories.splice(categories.indexOf("Top Picks"), 1);
        }

        categories.forEach(c => {
            optionsHTML += `<option value="${c}">${c}</option>`;
        });

        categorySelect.innerHTML = optionsHTML;
        categorySelect.value = currentCategory;

        // Listener
        categorySelect.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            updateView();
        });
    }

    function renderSpotlight() {
        const spotlightSection = document.getElementById('spotlight-section');
        if (!spotlightSection) return;

        // Find recommended products
        const recommended = allProducts.filter(p => p.recommendation && p.recommendation.toLowerCase() === 'recommended');
        // Fallback to all if no recommended
        const pool = recommended.length > 0 ? recommended : allProducts;

        if (pool.length === 0) return;

        const randomProduct = pool[Math.floor(Math.random() * pool.length)];

        spotlightSection.innerHTML = `
            <div class="spotlight-card">
                <div class="spotlight-img-wrapper">
                    <a href="${randomProduct.url}" target="_blank">
                        <img src="${randomProduct.image}" class="spotlight-img" alt="${randomProduct.title}">
                    </a>
                </div>
                <div class="spotlight-content">
                    <h2>${randomProduct.title}</h2>
                    <p>${randomProduct.notes ? randomProduct.notes.substring(0, 150) + '...' : ' a royal favorite.'}</p>
                    <a href="${randomProduct.url}" target="_blank" class="btn btn-primary">
                        Shop Now <i data-feather="arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
        spotlightSection.classList.remove('hidden');
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
        const container = footerSocials.parentElement;
        const existingDisclosure = container.querySelector('.affiliate-disclosure');
        if (existingDisclosure) existingDisclosure.remove();

        if (disclosureHTML) {
            footerSocials.insertAdjacentHTML('afterend', disclosureHTML);
        }
    }

    function renderProducts(productsToRender) {
        if (!grid) return;

        // No Results Handling
        if (productsToRender.length === 0) {
            grid.innerHTML = '';
            noResultsMessage.classList.remove('hidden');
            return;
        } else {
            noResultsMessage.classList.add('hidden');
        }

        // Staggered entry animation is handled by CSS nth-child or JS delay
        grid.innerHTML = productsToRender.map((product, index) => {
            const delay = index * 50; // Faster stagger for smoother feel

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

            const isFav = favorites.has(product.title);

            return `
            <div class="edit-card" style="animation-delay: ${delay}ms">
                <div class="edit-card__img-wrapper">
                    ${badge}
                    
                    <button class="love-btn ${isFav ? 'active' : ''}" data-u-favorite="${product.title}" aria-label="Add to favorites">
                        <i data-feather="heart"></i>
                    </button>

                    <a href="${product.url}" target="_blank">
                        <img src="${product.image}" class="edit-card__img" loading="lazy" alt="${product.title}">
                    </a>
                </div>
                <div class="edit-card__details">
                    <h3 class="edit-card__title">${product.title}</h3>
                    <p class="edit-card__price">₹${product.price.toFixed(2)}</p>
                    
                    <div class="edit-card__meta-actions">
                         ${noteBtn}
                         <button class="icon-btn share-trigger" data-title="${product.title}" aria-label="Share">
                            <i data-feather="share-2"></i>
                         </button>
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
            if (currentCategory === 'Favorites') {
                return favorites.has(p.title);
            }
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
        renderCategoryDropdown();
        renderFooterSocials();
        updateView();

        // Listeners
        const debouncedUpdate = debounce(updateView, 300);
        searchInput.addEventListener('input', debouncedUpdate);
        sortSelect.addEventListener('change', updateView);

        // Modal
        MicroModal.init({
            openTrigger: 'data-custom-open',
            closeTrigger: 'data-close-modal',
            disableScroll: true,
            awaitCloseAnimation: true
        });

        // Event delegation for Notes, Favorites, and Share
        grid.addEventListener('click', e => {
            const favBtn = e.target.closest('.love-btn');
            if (favBtn) {
                e.preventDefault(); // Stop link click if inside
                const title = favBtn.dataset.uFavorite;
                toggleFavorite(title);
                return;
            }

            const shareBtn = e.target.closest('.share-trigger');
            if (shareBtn) {
                e.preventDefault();
                const title = shareBtn.dataset.title;
                const product = allProducts.find(p => p.title === title);
                if (product) shareProduct(product);
                return;
            }

            const trigger = e.target.closest('.notes-trigger');
            if (trigger) {
                const idx = trigger.dataset.productIndex;
                const product = allProducts[idx];

                // Enhanced Modal Logic
                const modalContainer = document.querySelector('.modal__container');
                // Temporarily save close button logic if needed, but easier to recreate structure.
                // Re-creating structure ensures clean state.

                modalContainer.innerHTML = '';

                // Close Button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'modal__close';
                closeBtn.dataset.closeModal = '';
                closeBtn.innerHTML = '×';
                modalContainer.appendChild(closeBtn);

                // Image Col
                const imgCol = document.createElement('div');
                imgCol.className = 'modal__image-col';
                imgCol.innerHTML = `<img src="${product.image}" alt="${product.title}">`;

                // Content Col
                const contentCol = document.createElement('div');
                contentCol.className = 'modal__content-col';
                contentCol.innerHTML = `
                    <h2 class="modal__title" id="notes-modal-title">${product.title}</h2>
                    <div class="modal__content" id="notes-modal-content">${formatNotesContent(product.notes)}</div>
                    <a href="${product.url}" target="_blank" class="btn btn-primary" style="margin-top:2rem; align-self:flex-start;">
                        Buy Now <i data-feather="arrow-right"></i>
                    </a>
                `;

                modalContainer.appendChild(imgCol);
                modalContainer.appendChild(contentCol);

                // Re-bind close listener for the newly created button (though delegation handles it, 
                // the delegation listener is on document.querySelectorAll... created at init time.
                // Wait! existing delegation: `document.querySelectorAll('[data-close-modal]').forEach...` 
                // This ONLY works for elements existing AT INIT.
                // Dynamic elements won't be caught.
                // I MUST Attach listener to new close button OR change delegation to be on document/body.

                // Attaching listener directly:
                closeBtn.addEventListener('click', () => {
                    const modal = document.getElementById('notes-modal');
                    modal.classList.remove('is-open');
                    setTimeout(() => modal.setAttribute('aria-hidden', 'true'), 300);
                });

                const modal = document.getElementById('notes-modal');
                modal.classList.add('is-open');
                modal.setAttribute('aria-hidden', 'false');

                // Instagram logic
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
                        s.onload = () => { if (window.instgrm) window.instgrm.Embeds.process(); };
                        document.body.appendChild(s);
                    }
                }
            }
        });

        // Custom Modal Close Logic
        document.querySelectorAll('[data-close-modal]').forEach(b => {
            b.addEventListener('click', () => {
                const modal = document.getElementById('notes-modal');
                modal.classList.remove('is-open');
                setTimeout(() => modal.setAttribute('aria-hidden', 'true'), 300);
            });
        });

        // --- Scroll Top Button Logic ---
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        if (scrollTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 500) {
                    scrollTopBtn.classList.add('visible');
                } else {
                    scrollTopBtn.classList.remove('visible');
                }
            });

            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
            // Re-render icons to ensure arrow-up shows
            if (window.feather) feather.replace();
        }

        // --- Parallax Hero ---
        const hero = document.querySelector('.hero');
        const heroTitle = document.getElementById('hero-title');
        const heroSubtitle = document.getElementById('hero-subtitle');

        if (hero && heroTitle && heroSubtitle) {
            hero.addEventListener('mousemove', (e) => {
                const x = (window.innerWidth / 2 - e.pageX) / 20;
                const y = (window.innerHeight / 2 - e.pageY) / 20;

                heroTitle.style.transform = `translate(${x}px, ${y}px)`;
                heroSubtitle.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
            });

            // Reset on leave for cleanliness
            hero.addEventListener('mouseleave', () => {
                heroTitle.style.transform = `translate(0, 0)`;
                heroSubtitle.style.transform = `translate(0, 0)`;
            });
        }

        // --- Paw Cursor Trail ---
        let lastPawTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastPawTime > 100) { // Throttle: 1 paw every 100ms
                lastPawTime = now;

                const paw = document.createElement('div');
                paw.classList.add('paw-trail');
                paw.style.left = `${e.pageX}px`;
                paw.style.top = `${e.pageY}px`;
                document.body.appendChild(paw);

                // Fade and remove
                setTimeout(() => {
                    paw.style.opacity = '0';
                    setTimeout(() => paw.remove(), 500); // Wait for transition
                }, 500);
            }
        });
    }

    init();
});