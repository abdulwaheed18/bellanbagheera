![Bella, Nawaab & Bagheera](images/profile_avatar.png)

# Curated Product Showcase

This project is a customizable, single-page product showcase website designed for creators and influencers. It dynamically loads a curated list of products from a Google Sheet and displays them in a searchable, filterable, and sortable grid. It's built with vanilla JavaScript, HTML, and CSS, making it lightweight, fast, and easy to deploy on any static hosting service.

The live version of this project is a showcase for Bella, Nawaab & Bagheera's favorite pet products.

## ✨ Features

- **Google Sheets as a CMS**: Easily manage your product list from a Google Sheet. No need to touch the code to add, remove, or update products.
- **Dynamic Product Grid**: Products are fetched and rendered automatically on page load.
- **Advanced Filtering & Sorting**:
  - Real-time search by product title.
  - Filter products by category.
  - Sort products by Price (Low to High, High to Low) and Name (A-Z, Z-A).
- **Configuration-Driven UI**: All personal details, social links, and the Google Sheet URL are managed in a single `js/config.js` file.
- **Product Details Modal**: Add detailed notes or descriptions to products, which appear in a clean pop-up modal.
- **Affiliate Friendly**: Includes a customizable affiliate disclosure and automatically cleans Amazon URLs for better mobile app integration.
- **Engaging UI/UX**:
  - Fun paw-print cursor trail effect.
  - Smooth animations, a sticky header, and a "Back to Top" button.
- **Static & Serverless**: 100% static. Deploy it easily on services like Vercel, Netlify, or GitHub Pages.

## 🚀 Getting Started

Follow these steps to set up your own version of the site.

### 1. Set Up Your Google Sheet

1.  Create a new Google Sheet.
2.  The first row **must** be a header row with the following column titles (case-insensitive, order doesn't matter):
    - `title` (or `name`): The name of the product.
    - `product url`: The affiliate or direct link to the product.
    - `image url`: A direct link to the product image.
    - `category`: The category for filtering (e.g., "Toys", "Treats").
    - `price`: The numerical price of the item. The currency symbol is set in the code.
    - `store`: The name of the store (e.g., "Amazon").
    - `notes`: Optional detailed description. Can include links.
3.  Fill in your product data in the rows below the header.
4.  Publish the sheet to the web:
    - Go to `File` > `Share` > `Publish to web`.
    - In the `Link` tab, select the specific sheet you are using.
    - Choose `Comma-separated values (.csv)`.
    - Click `Publish` and copy the generated URL.

### 2. Configure the Project

1.  Open the `js/config.js` file.
2.  Paste the Google Sheet URL you copied into the `googleSheetUrl` field.
3.  Customize the `profile`, `hero`, `socials`, and `footerText` objects with your own information.

### 3. Deploy

Since this is a static website, you can host it on any service that serves HTML, CSS, and JavaScript files.

- **Drag & Drop**: Services like Netlify Drop or Vercel allow you to drag and drop the entire project folder for instant deployment.
- **Git-based**: Fork this repository, connect it to a hosting provider (like Vercel, Netlify, or GitHub Pages), and it will automatically deploy on every push.

## 🛠️ Customization

### Styling
All styles are located in `style.css`. You can modify this file to change fonts, colors, layout, and more. The CSS variables at the top of the file make it easy to change the primary color scheme.

### Functionality
The core application logic is in `js/script.js`. While it's designed to work out-of-the-box with the config file, you can edit this file to add or change functionality.

### Currency
To change the currency symbol from Indian Rupees (₹) to something else, find the `renderProducts` function in `js/script.js` and edit the following line:
```javascript
const priceHTML = product.price > 0 ? `<p class="product-card__price">₹${product.price.toFixed(2)}</p>` : '';
```

## 📁 File Structure

```
/
├── index.html          # The main HTML structure
├── style.css           # All styles for the application
├── images/             # Folder for profile avatar, icons, etc.
└── js/
    ├── config.js       # Main configuration file (profile, links, sheet URL)
    └── script.js       # Core application logic (fetching, rendering, events)
```

## Acknowledgements

- Icons by [Feather](https://feathericons.com/).
- Modal functionality by [MicroModal.js](https://micromodal.now.sh/).

---