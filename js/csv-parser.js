// Shared CSV Parser for BNB
window.parseCSV = function(text) {
    const lines = text.trim().split(/\r?\n(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const keyMap = { 
        'title': 'title', 
        'name': 'title', 
        'product url': 'url', 
        'image url': 'image', 
        'store': 'store', 
        'category': 'category', 
        'notes': 'notes', 
        'price': 'price', 
        'recommendation': 'recommendation' 
    };
    const mappedHeader = header.map(h => keyMap[h] || h);

    return lines.slice(1).map(line => {
        let values = [], current = '', inQuote = false;
        for (let char of line) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) { 
                values.push(current.trim().replace(/^"|"$/g, '')); 
                current = ''; 
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        
        const obj = mappedHeader.reduce((o, k, i) => { 
            if (k) {
                // Number conversion for price
                if (k === 'price') {
                    const num = parseFloat(values[i].replace(/[^\d.-]/g, ''));
                    o[k] = isNaN(num) ? 0 : num;
                } else {
                    o[k] = values[i]; 
                }
            }
            return o; 
        }, {});

        // --- MULTI-CATEGORY LOGIC ---
        // Store original string but also parse into array
        if (obj.category) {
            obj.categories = obj.category.split(',').map(c => c.trim()).filter(Boolean);
        } else {
            obj.categories = ['Uncategorized'];
            obj.category = 'Uncategorized';
        }
        return obj;
    }).filter(Boolean);
};
