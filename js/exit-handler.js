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
            window.location.href = 'index.html';
        }
    };

    zone.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        trigger(); 
    });
    zone.addEventListener('mousedown', trigger);
});
