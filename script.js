document.addEventListener('DOMContentLoaded', function() {
    // Select DOM elements
    const header = document.querySelector('.header');
    const categoriesContainer = document.querySelector('.categories');
    const grid = document.querySelector('.grid');
    const themeToggle = document.getElementById('theme-toggle');
    const footer = document.querySelector('.footer');

    // --- 1. RENDER DYNAMIC CONTENT ---

    function renderContent() {
        // Set page title
        document.title = `${config.profile.name} | Links`;

        // Create social links HTML
        const socialLinksHTML = config.socials.map(social => `
            <a href="${social.url}" target="_blank" aria-label="${social.name}" title="${social.name}">
                <img src="${social.icon}" alt="${social.name} icon">
            </a>
        `).join('');

        // Render Header
        header.innerHTML = `
            <img src="${config.profile.avatar}" alt="${config.profile.name}'s avatar">
            <h1>${config.profile.name}</h1>
            <p>${config.profile.bio.replace(/\n/g, '<br />')}</p>
            <div class="social-links">
                ${socialLinksHTML}
            </div>
        `;

        // Render Category Chips
        let categoryChipsHTML = '<div class="chip active" data-filter="all">All</div>';
        categoryChipsHTML += config.categories.map(cat => `
            <div class="chip" data-filter="${cat.id}">${cat.name}</div>
        `).join('');
        categoriesContainer.innerHTML = categoryChipsHTML;

        // Render Product Cards
        grid.innerHTML = config.products.map(product => `
            <a href="${product.url}" target="_blank" class="card" data-category="${product.category}">
                <img src="${product.image}" alt="${product.alt}">
                <div class="card-content">
                    <div class="card-title">${product.title}</div>
                    <div class="btn">
                        ${ (config.buttonMap[product.store] && config.buttonMap[product.store].icon)
                            ? `<img src="${config.buttonMap[product.store].icon}" alt="${product.store} icon">`
                            : ''
                        }
                        <span>${(config.buttonMap[product.store] && config.buttonMap[product.store].text) || 'View Item'}</span>
                    </div>
                </div>
            </a>
        `).join('');

        // Render Footer
        if (config.footerText) {
            footer.innerHTML = `
                <div class="footer-socials">
                    ${socialLinksHTML}
                </div>
                <p>${config.footerText.replace('{year}', new Date().getFullYear())}</p>
            `;
        }
    }

    // --- 2. SETUP EVENT LISTENERS ---

    function setupEventListeners() {
        // Category Filtering
        const categoryChips = document.querySelectorAll('.categories .chip');
        const productCards = document.querySelectorAll('.grid .card');

        categoriesContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('chip')) return;

            const clickedChip = e.target;
            categoryChips.forEach(c => c.classList.remove('active'));
            clickedChip.classList.add('active');

            const filter = clickedChip.getAttribute('data-filter');

            productCards.forEach(card => {
                const categories = card.getAttribute('data-category');
                const shouldShow = filter === 'all' || (categories && categories.split(' ').includes(filter));
                
                card.classList.toggle('hidden', !shouldShow);
            });
        });

        // Theme Toggling
        themeToggle.addEventListener('click', toggleTheme);
    }

    // --- 3. THEME FUNCTIONALITY ---

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const icon = theme === 'dark' ? 'sun' : 'moon';
        themeToggle.innerHTML = `<i data-feather="${icon}"></i>`;
        feather.replace();
    }

    function applyInitialTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    // --- 4. INITIALIZATION ---

    function init() {
        applyInitialTheme();
        renderContent();
        setupEventListeners();
        feather.replace();
    }

    init();
});