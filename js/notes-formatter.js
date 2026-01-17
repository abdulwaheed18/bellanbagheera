/**
 * Parses a text string with simple markdown-like formatting and URLs 
 * into an HTML string.
 * Supports:
 * - Bold: **text**
 * - Italics: *text* or _text_
 * - Unordered lists: starting lines with * or -
 * - Image URL previews: .png, .jpg, .jpeg, .gif, .webp
 * - YouTube video embeds
 * - Other URLs are converted to clickable links.
 *
 * @param {string} text The plain text to format.
 * @returns {string} The formatted HTML string.
 */
function formatNotesContent(text) {
    if (!text || typeof text !== 'string') {
        return '<p>No notes available for this item.</p>';
    }

    // Convert URLs to media or links first
    let processedText = text.replace(/(https?:\/\/[^\s]+)/g, (url) => {
        // Image URLs
        if (/\.(jpeg|jpg|gif|png|webp)$/i.test(url)) {
            return `<img src="${url}" alt="Note image">`;
        }
        
        // YouTube URL
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) {
            const videoId = youtubeMatch[1];
            return `
                <div class="video-responsive">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>`;
        }

        // Instagram URL (handles /p/ and /reel/)
        const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel)\/([a-zA-Z0-9_-]+)/;
        const instagramMatch = url.match(instagramRegex);
        if (instagramMatch) {
            // Use the official blockquote method, which requires instagram's embed.js script
            return `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="max-width:500px; width:calc(100% - 2px); margin: 1rem auto;"></blockquote>`;
        }

        // Default to a simple link
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // Process lines for lists and paragraphs
    const lines = processedText.split('\n');
    let html = '';
    let inList = false;

    const applyInlineFormatting = (str) => {
        return str
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/_([^_]+)_/g, '<em>$1</em>') // Italics (underscore)
            .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>'); // Italics (asterisk), avoids conflict with **
    };

    lines.forEach(line => {
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${applyInlineFormatting(line.trim().substring(2))}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (line.trim()) {
                html += `<p>${applyInlineFormatting(line)}</p>`;
            }
        }
    });

    if (inList) html += '</ul>';

    return html;
}