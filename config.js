const config = {
    // Profile details
    profile: {
        name: "Bella & Bagheera",
        bio: "🐾 B N B: Bella, Nawaab & Bagheera 🐱🐾 Fur-family of 3,\n💌 Collabs: DM: bellaNbagheera@gmail.com\n📸 Kitty adventures & cuddles 🐾",
        avatar: "images/profile_avatar.png"
    },

    // Social media links
    // Added an 'icon' property to each social link
    socials: [
        { name: 'Instagram', url: 'https://instagram.com/bella_and_bagheera', icon: 'images/icons/instagram.svg' },
        { name: 'Threads', url: 'https://www.threads.com/bella_and_bagheera', icon: 'images/icons/threads.svg' }, // TODO: Add your Threads URL
        { name: 'YouTube', url: 'https://www.youtube.com/@bella_and_bagheera', icon: 'images/icons/youtube.svg' },
        { name: 'Facebook', url: 'https://www.facebook.com/bellaNbagheera', icon: 'images/icons/facebook.svg' },
        { name: 'WhatsApp', url: 'https://api.whatsapp.com/send?phone=919336536492', icon: 'images/icons/whatsapp.svg' }, // TODO: Add your WhatsApp URL
        { name: 'Amazon', url: 'https://www.amazon.com/shop/bella_and_bagheera', icon: 'images/icons/amazon.svg' } // TODO: Add your Amazon Storefront URL
    ],

    // Product categories
    // The 'id' should be a short, unique identifier.
    categories: [
        { id: 'cat-gear', name: 'Cat Gear' },
        { id: 'home', name: 'Home' },
        { id: 'tech', name: 'Tech' }
    ],

    // Your affiliate products
    products: [
        {
            category: 'cat-gear',
            image: "https://via.placeholder.com/300x200/FFC0CB/000000?text=Cat+Toy",
            alt: "Interactive Cat Toy",
            title: "Interactive Cat Toy",
            url: "YOUR_AFFILIATE_LINK_1",
            store: "Amazon"
        },
        {
            category: 'home',
            image: "https://via.placeholder.com/300x200/ADD8E6/000000?text=Pet+Bed",
            alt: "Cozy Pet Bed",
            title: "Cozy Pet Bed",
            url: "YOUR_AFFILIATE_LINK_2",
            store: "Amazon"
        },
        {
            // This product belongs to two categories
            category: 'tech home',
            image: "https://via.placeholder.com/300x200/90EE90/000000?text=Pet+Camera",
            alt: "Smart Pet Camera",
            title: "Smart Pet Camera",
            url: "YOUR_AFFILIATE_LINK_3",
            store: "Flipkart"
        },
        {
            category: 'cat-gear',
            image: "https://via.placeholder.com/300x200/D3D3D3/000000?text=Cat+Tree",
            alt: "Modern Cat Tree",
            title: "Modern Cat Tree",
            url: "YOUR_AFFILIATE_LINK_4",
            store: "Amazon"
        },
        {
            category: 'tech',
            image: "https://via.placeholder.com/300x200/E6E6FA/000000?text=Auto+Feeder",
            alt: "Automatic Pet Feeder",
            title: "Automatic Pet Feeder",
            url: "YOUR_AFFILIATE_LINK_5",
            store: "Other Store"
        }
    ],

    // Button text mapping
    // This allows you to customize the button text for each store.
    // Now includes an 'icon' for a richer button appearance.
    buttonMap: {
        "Amazon": { text: "View on Amazon", icon: "images/icons/amazon.svg" },
        "Flipkart": { text: "View on Flipkart", icon: "" }, // Add icon path when available
        "Other Store": { text: "View Store", icon: "" } // Add icon path when available
    },

    // Footer text. Use {year} to dynamically insert the current year.
    footerText: "© {year} Bella & Bagheera"
};