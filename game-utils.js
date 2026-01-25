/**
 * BNB Game Utilities v2.1
 * Shared logic for Feline Enrichment Suite
 */

export class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.lastTime = 0;
        this.dt = 0;

        // Modules
        this.input = new InputManager(this.canvas);
        this.audio = new AudioManager();

        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Auto-start audio context on first user interaction
        const startAudio = () => {
            this.audio.resume();
            this.requestFullscreen();
            window.removeEventListener('touchstart', startAudio);
            window.removeEventListener('click', startAudio);
        };
        window.addEventListener('touchstart', startAudio, { once: true });
        window.addEventListener('click', startAudio, { once: true });
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    requestFullscreen() {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => { });
        }
    }

    // Main Loop
    start(updateFn, drawFn) {
        const loop = (timestamp) => {
            this.dt = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;
            if (this.dt > 0.1) this.dt = 0.1; // Cap lag

            updateFn(this.dt);
            drawFn(this.ctx);

            this.input.resetFrame(); // Clear single-frame flags
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.isDown = false;
        this.justPressed = false;
        this.touches = []; // Multi-touch support

        // Bindings
        const updatePos = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            this.x = clientX - rect.left;
            this.y = clientY - rect.top;
        };

        const handleStart = (x, y) => {
            updatePos(x, y);
            this.isDown = true;
            this.justPressed = true;
        };

        const handleMove = (x, y) => {
            updatePos(x, y);
        };

        const handleEnd = () => {
            this.isDown = false;
        };

        // Mouse
        window.addEventListener('mousedown', e => handleStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => {
            if (e.buttons === 1) handleMove(e.clientX, e.clientY);
        });
        window.addEventListener('mouseup', handleEnd);

        // Touch
        window.addEventListener('touchstart', e => {
            // e.preventDefault(); // Don't block potential scroll unless GAME decides to
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                handleStart(t.clientX, t.clientY);
                // Track multimap
                this.touches[t.identifier] = { x: t.clientX, y: t.clientY };
            }
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            // e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                handleMove(t.clientX, t.clientY);
            }
        }, { passive: false });

        window.addEventListener('touchend', handleEnd);
    }

    resetFrame() {
        this.justPressed = false;
    }
}

class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type = 'sine', duration = 0.1, vol = 0.1) {
        if (this.ctx.state !== 'running') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.type = type;

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playZap() {
        this.playTone(800 + Math.random() * 400, 'square', 0.1, 0.05);
    }

    playPop() {
        this.playTone(600 + Math.random() * 200, 'sine', 0.15, 0.2);
    }
}

export class UI {
    static createFullscreenButton() {
        const btn = document.createElement('button');
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
        btn.style.cssText = `
            position: absolute; top: 20px; right: 20px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: white; padding: 10px; border-radius: 50%;
            cursor: pointer; z-index: 1000; touch-action: manipulation;
        `;
        document.body.appendChild(btn);

        btn.onclick = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => { });
                UI.showToast("Swipe down or press ESC to exit");
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        };
    }

    static showToast(msg) {
        let toast = document.getElementById('bnb-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'bnb-toast';
            toast.style.cssText = `
                position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.8); color: white; padding: 10px 20px;
                border-radius: 20px; font-family: sans-serif; font-size: 14px;
                pointer-events: none; opacity: 0; transition: opacity 0.5s; z-index: 2000;
                border: 1px solid rgba(255,215,0,0.3); text-align: center; white-space: nowrap;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = msg;
        toast.style.opacity = '1';

        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }
}

export class Patterns {
    static createWood(width, height) {
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        const ctx = c.getContext('2d');

        // Base
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(0, 0, width, height);

        // Planks
        ctx.strokeStyle = '#281815';
        ctx.lineWidth = 2;
        const plankH = 60;
        for (let y = 0; y < height; y += plankH) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Grain
            ctx.globalAlpha = 0.1;
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                const ry = y + Math.random() * plankH;
                ctx.moveTo(0, ry);
                ctx.bezierCurveTo(width * 0.3, ry + Math.random() * 10, width * 0.7, ry - Math.random() * 10, width, ry);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        return ctx.createPattern(c, 'no-repeat');
    }

    static createTiles(width, height) {
        const c = document.createElement('canvas');
        const size = 60;
        c.width = size * 2; c.height = size * 2;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#eee';
        ctx.fillRect(0, 0, size * 2, size * 2);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, size, size);
        ctx.fillRect(size, size, size, size);

        return ctx.createPattern(c, 'repeat');
    }

    static createSky(width, height) {
        const c = document.createElement('canvas');
        c.width = 1; c.height = height;
        const ctx = c.getContext('2d');

        const g = ctx.createLinearGradient(0, 0, 0, height);
        g.addColorStop(0, '#87CEEB');
        g.addColorStop(1, '#E0F7FA');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1, height);

        return ctx.createPattern(c, 'repeat-x');
    }

    static createDark(width, height) {
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
        g.addColorStop(0, '#222');
        g.addColorStop(1, '#000');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
        return ctx.createPattern(c, 'no-repeat');
    }
}

// Visual Helpers
export const Draw = {
    circle(ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    },

    glow(ctx, color, blur = 20) {
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
    },

    resetGlow(ctx) {
        ctx.shadowBlur = 0;
    }
};

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}
