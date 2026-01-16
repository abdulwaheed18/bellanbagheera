document.addEventListener('DOMContentLoaded', () => {
    // Store products to avoid re-fetching
    let allProducts = [];

    // DOM elements
    const container = document.getElementById('product-grid');
    const sortSelect = document.getElementById('sort-select');

    /**
     * Fetches, parses, and renders product data from the Google Sheet.
     */
    const fetchAndRenderProducts = async () => {
        if (!config.googleSheetUrl) {
            console.error("Google Sheet URL is not defined in config.js");
            container.innerHTML = '<p>Error: Product data source is not configured.</p>';
            return;
        }

        try {
            const response = await fetch(config.googleSheetUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const csvText = await response.text();
            const products = parseCsv(csvText);

            // Process and store products
            allProducts = products.map(product => ({
                ...product,
                // Ensure price is a number for correct sorting.
                // This handles various formats like '25.99', '$15', '€8.50'.
                price: product.price ? parseFloat(String(product.price).replace(/[^0-9.-]+/g, "")) : 0
            }));

            renderProducts(allProducts);
        } catch (error) {
            console.error('Error fetching or processing products:', error);
            container.innerHTML = '<p>Could not load products. Please try again later.</p>';
        }
    };

    /**
     * Renders an array of products to the DOM.
     * @param {Array} products - The array of product objects to render.
     */
    const renderProducts = (products) => {
        container.innerHTML = ''; // Clear existing content
        products.forEach(product => {
            // IMPORTANT: Customize this section to match your product card HTML structure.
            const productElement = document.createElement('div');
            productElement.className = 'product-card'; // Example class
            productElement.innerHTML = `
                <a href="${product.url}" target="_blank" rel="noopener noreferrer">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <h3>${product.name}</h3>
                    ${product.price ? `<p class="price">$${product.price.toFixed(2)}</p>` : ''}
                </a>
            `;
            container.appendChild(productElement);
        });
    };

    /**
     * Sorts the products based on the selected option and re-renders them.
     */
    const sortAndRender = () => {
        const sortBy = sortSelect.value;
        // Create a new array to avoid modifying the original
        let sortedProducts = [...allProducts];

        switch (sortBy) {
            case 'price-asc':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                // For 'default', we don't need to sort, just use the original order.
                break;
        }

        renderProducts(sortedProducts);
    };

    /**
     * A simple CSV parser.
     * @param {string} csvText - The CSV content as a string.
     * @returns {Array<Object>} An array of objects.
     */
    const parseCsv = (csvText) => {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(header => header.trim());
        const data = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
                return obj;
            }, {});
        });
        return data;
    };

    // Initial fetch and render
    fetchAndRenderProducts();

    // Attach event listener for sorting
    sortSelect.addEventListener('change', sortAndRender);
});