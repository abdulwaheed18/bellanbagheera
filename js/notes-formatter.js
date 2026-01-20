/**
 * Parses a text string with simple markdown-like formatting and URLs into a
 * formatted, safe HTML string.
 * @param {string} text The plain text to format.
 * @returns {string} The formatted HTML string.
 */
function formatNotesContent(text) {
	if (!text || typeof text !== 'string') {
		return '<p>No notes available for this item.</p>';
	}

	const placeholders = new Map();
	let placeholderIndex = 0;

	// 1. Find all URLs and replace them with placeholders, storing their type (block/inline)
	const textWithPlaceholders = text.replace(/(https?:\/\/[^\s]+)/g, (url) => {
		const placeholder = `%%URL_${placeholderIndex++}%%`;
		
		let html;
		let isBlock = false;

		const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
		const youtubeMatch = url.match(youtubeRegex);

		// Updated regex to handle URLs with or without a username in the path (e.g., /username/reel/...)
		const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/.*?\/(p|reel|reels)\/([a-zA-Z0-9_-]+)/;
		const instagramMatch = url.match(instagramRegex);
		const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url);

		if (isImage) {
			html = `<img src="${url}" alt="Note image">`;
			isBlock = true;
		} else if (youtubeMatch && youtubeMatch[1]) {
			const videoId = youtubeMatch[1];
			html = `<div class="video-responsive"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
			isBlock = true;
		} else if (instagramMatch) {
			html = `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>`;
			isBlock = true;
		} else {
			html = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
			isBlock = false;
		}

		placeholders.set(placeholder, { html, isBlock });
		return placeholder;
	});

	// 2. Isolate block-level placeholders by surrounding them with newlines.
	// This ensures they are processed as separate paragraphs.
	let processedText = textWithPlaceholders;
	for (const [p, data] of placeholders.entries()) {
		if (data.isBlock) {
			processedText = processedText.replace(p, `\n\n${p}\n\n`);
		}
	}
	processedText = processedText.replace(/\n{3,}/g, '\n\n').trim();

	// 3. Process markdown line by line
	const lines = processedText.split('\n');
	let finalHtml = '';
	let inList = false;

	const applyInlineFormatting = (str) => {
		// Apply markdown for bold/italics first on the string with placeholders
		let formattedStr = str
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
			.replace(/_([^_]+)_/g, '<em>$1</em>') // Italics (underscore)
			.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>'); // Italics (asterisk)

		// Now, replace any INLINE placeholders with their HTML
		for (const [p, data] of placeholders.entries()) {
			if (!data.isBlock) {
				// Use a function with replace to avoid issues with special chars in the replacement string
				formattedStr = formattedStr.replace(p, () => data.html);
			}
		}
		return formattedStr;
	};

	lines.forEach(line => {
		const trimmedLine = line.trim();
		const placeholderData = placeholders.get(trimmedLine);

		// Case 1: The line is a block-level placeholder
		if (placeholderData && placeholderData.isBlock) {
			if (inList) {
				finalHtml += '</ul>';
				inList = false;
			}
			finalHtml += placeholderData.html;
		}
		// Case 2: The line is a list item
		else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
			if (!inList) {
				finalHtml += '<ul>';
				inList = true;
			}
			finalHtml += `<li>${applyInlineFormatting(trimmedLine.substring(2))}</li>`;
		}
		// Case 3: The line is a paragraph (or empty)
		else {
			if (inList) {
				finalHtml += '</ul>';
				inList = false;
			}
			if (trimmedLine) {
				finalHtml += `<p>${applyInlineFormatting(line)}</p>`;
			}
		}
	});

	if (inList) {
		finalHtml += '</ul>';
	}

	// Final step: Replace any block placeholders that were missed because they were inside a line with other text.
	for (const [p, data] of placeholders.entries()) {
		if (data.isBlock) {
			// This regex looks for a <p> tag that contains our placeholder.
			// It's made non-greedy (.*?) to avoid matching across multiple paragraphs.
			const escapedP = p.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			const regex = new RegExp(`<p>(.*?)${escapedP}(.*?)<\/p>`);

			finalHtml = finalHtml.replace(regex, (match, before, after) => {
				const beforeP = before.trim() ? `<p>${before.trim()}</p>` : '';
				const afterP = after.trim() ? `<p>${after.trim()}</p>` : '';
				return `${beforeP}${data.html}${afterP}`;
			});
		}
	}
	return finalHtml.replace(/<p>\s*<\/p>/g, ''); // Clean up any empty paragraphs created
}