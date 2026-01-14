document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('product-search');
    const categoriesContainer = document.querySelector('.categories');

    // Helper to generate social icons HTML
    function getSocialsHTML() {
        return config.socials.map(social => `
            <a href="${social.url}" target="_blank" aria-label="${social.name}">
                <img src="${social.icon}" alt="${social.name}">
            </a>
        `).join('');
    }

    function renderProducts(filter = 'all', query = '') {
        const filtered = config.products.filter(p => {
            const matchesTab = filter === 'all' || p.category.includes(filter);
            const matchesSearch = p.title.toLowerCase().includes(query.toLowerCase());
            return matchesTab && matchesSearch;
        });

        grid.innerHTML = filtered.map(product => `
            <a href="${product.url}" target="_blank" class="card">
                <img src="${product.image}" alt="${product.title}">
                <div class="card-content">
                    <div class="card-title">${product.title}</div>
                    <div class="btn">View on ${product.store}</div>
                </div>
            </a>
        `).join('');
    }

    function renderUI() {
        // Set page title
        document.title = `${config.profile.name} | Links`;

        // Render Header
        const header = document.querySelector('.header');
        header.innerHTML = `
            <img class="profile-avatar" src="${config.profile.avatar}" alt="Avatar" style="width:120px; height:120px; border-radius:50%; border:4px solid var(--accent-color);">
            <h1>${config.profile.name}</h1>
            <p>${config.profile.bio.replace(/\n/g, '<br />')}</p>
            <div class="social-links">${getSocialsHTML()}</div>
        `;

        // Render Categories
        let chips = '<div class="chip active" data-filter="all">All Items</div>';
        chips += config.categories.map(c => `<div class="chip" data-filter="${c.id}">${c.name}</div>`).join('');
        categoriesContainer.innerHTML = chips;

        // Render Footer
        const footer = document.querySelector('.footer');
        footer.innerHTML = `
            <div class="footer-socials">${getSocialsHTML()}</div>
            <p style="margin-top:20px; color:var(--text-secondary);">${config.footerText.replace('{year}', new Date().getFullYear())}</p>
        `;

        renderProducts();
    }

    // Events
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
        feather.replace();
    });

    // Init
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    renderUI();
    feather.replace();
});