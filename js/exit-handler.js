document.addEventListener('DOMContentLoaded', () => {
    // Shared Triple-Tap Exit Logic for BNB Cat Games
    const zone = document.getElementById('exit-zone');
    if (!zone) return;

    let taps = 0;
    let timer;

    const trigger = () => {
        taps++;
        clearTimeout(timer);
        timer = setTimeout(() => taps = 0, 600);
        if (taps >= 3) {
            showPostGameCTA();
        }
    };

    zone.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        trigger(); 
    });
    zone.addEventListener('mousedown', trigger);

    function showPostGameCTA() {
        // Pause game logic if possible (depends on the game implementing it)
        if (window.gameInstance && typeof window.gameInstance.pause === 'function') {
            window.gameInstance.pause();
        }

        const overlayStyles = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(5, 5, 5, 0.95); z-index: 10000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: sans-serif; text-align: center; backdrop-filter: blur(10px);
        `;

        const overlay = document.createElement('div');
        overlay.id = 'post-game-overlay';
        overlay.style.cssText = overlayStyles;

        // Determine current game and simple recommendations
        const currentPath = window.location.pathname;
        let nextGame = 'gravity.html';
        let nextGameName = 'Gravity Giggles';
        if (currentPath.includes('gravity')) { nextGame = 'yarn.html'; nextGameName = 'Yarn Spinner'; }
        if (currentPath.includes('yarn')) { nextGame = 'peek.html'; nextGameName = 'Whiskers in the Wall'; }
        if (currentPath.includes('peek')) { nextGame = 'chase.html'; nextGameName = 'The Ultimate Chase'; }
        if (currentPath.includes('chase')) { nextGame = 'bughunt.html'; nextGameName = 'The Fly-Zapper'; }

        overlay.innerHTML = `
            <h1 style="color: #FFD700; margin-bottom: 2rem; font-size: 2.5rem;">Game Paused 🐾</h1>
            <p style="color: #ccc; margin-bottom: 3rem; font-size: 1.2rem; max-width: 80%;">
                Treat your king or queen to royal treasures, or keep the fun going!
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 80%; max-width: 300px;">
                <a href="index.html#product-grid" style="background: #FFD700; color: #000; padding: 1rem; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="dataLayer.push({'event': 'cta_shop_post_game'})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    Treat Them Now
                </a>
                
                <a href="${nextGame}" style="background: rgba(255,255,255,0.1); color: #fff; padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); font-weight: bold; text-decoration: none; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Play ${nextGameName}
                </a>

                <button id="resume-btn" style="background: transparent; border: none; color: #888; margin-top: 1rem; cursor: pointer; text-decoration: underline; font-size: 1rem;">
                    Resume Current Game
                </button>
                <a href="index.html" style="background: transparent; border: none; color: #888; margin-top: 0.5rem; cursor: pointer; text-decoration: underline; font-size: 1rem;">
                    Exit to Main Menu
                </a>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('resume-btn').addEventListener('click', () => {
            overlay.remove();
            if (window.gameInstance && typeof window.gameInstance.resume === 'function') {
                window.gameInstance.resume();
            }
        });
    }
});
