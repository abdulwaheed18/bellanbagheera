const config = {
    profile: {
        name: "Bella & Bagheera",
        bio: "🐾 B N B: Bella, Nawaab & Bagheera 🐾\n📍 Fur-family of 3\n📩 Collabs: bellaNbagheera@gmail.com",
        avatar: "images/profile_avatar.png"
    },
    socials: [
        { name: 'Instagram', url: 'https://instagram.com/bella_and_bagheera', icon: 'images/icons/instagram.svg' },
        { name: 'Threads', url: 'https://www.threads.com/bella_and_bagheera', icon: 'images/icons/threads.svg' },
        { name: 'YouTube', url: 'https://www.youtube.com/@bella_and_bagheera', icon: 'images/icons/youtube.svg' },
        { name: 'Facebook', url: 'https://www.facebook.com/bellaNbagheera', icon: 'images/icons/facebook.svg' },
        { name: 'WhatsApp', url: 'https://api.whatsapp.com/send?phone=919336536492', icon: 'images/icons/whatsapp.svg' },
        { name: 'Amazon', url: 'https://www.amazon.in/shop/bella_and_bagheera', icon: 'images/icons/amazon.svg' }
    ],
    // Categories for the filter chips. The 'id' should match the 'category' in your Google Sheet.
    categories: [
        { id: 'Cat-Bedding', name: 'Cat Bedding' },
        { id: 'home', name: 'Home' },
        { id: 'tech', name: 'Tech' }
    ],

    // Google Sheets sources.
    // 1. In Google Sheets, go to File > Share > Publish to web.
    // 2. Publish the specific sheet (e.g., 'Cat-Bedding') as a Comma-separated values (.csv) file.
    // 3. Copy the generated URL and paste it here.
    googleSheetSources: [
        {
            category: 'Cat-Bedding',
            url: 'https://docs.google.com/spreadsheets/d/10WAnoS6FqvHCk7tLRGpTw9h4RUSmCQpVAKtsfp0Gyi4/edit?usp=sharing'
        },
        {
            category: 'home',
            url: 'https://docs.google.com/spreadsheets/d/10WAnoS6FqvHCk7tLRGpTw9h4RUSmCQpVAKtsfp0Gyi4/edit?usp=sharing'
        },
        {
            category: 'tech',
            url: 'https://docs.google.com/spreadsheets/d/10WAnoS6FqvHCk7tLRGpTw9h4RUSmCQpVAKtsfp0Gyi4/edit?usp=sharing'
        }
    ],

    footerText: "© {year} Bella, Nawaab & Bagheera"
};