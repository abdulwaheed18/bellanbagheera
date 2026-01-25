/**
 * BNB Game Utilities v2.0
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
        window.addEventListener('touchstart', startAudio, {once:true});
        window.addEventListener('click', startAudio, {once:true});
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    requestFullscreen() {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e=>{});
        }
    }

    // Main Loop
    start(updateFn, drawFn) {
        const loop = (timestamp) => {
            this.dt = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;
            if(this.dt > 0.1) this.dt = 0.1; // Cap lag

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
            if(e.buttons === 1) handleMove(e.clientX, e.clientY);
        });
        window.addEventListener('mouseup', handleEnd);

        // Touch
        window.addEventListener('touchstart', e => {
            // e.preventDefault(); // Don't block potential scroll unless GAME decides to
            for(let i=0; i<e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                handleStart(t.clientX, t.clientY);
                // Track multimap
                this.touches[t.identifier] = {x: t.clientX, y: t.clientY};
            }
        }, {passive:false});

        window.addEventListener('touchmove', e => {
             // e.preventDefault();
             for(let i=0; i<e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                handleMove(t.clientX, t.clientY);
             }
        }, {passive:false});
        
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
        if(this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type='sine', duration=0.1, vol=0.1) {
        if(this.ctx.state !== 'running') return;
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
        this.playTone(800 + Math.random()*400, 'square', 0.1, 0.05);
    }
    
    playPop() {
        this.playTone(600 + Math.random()*200, 'sine', 0.15, 0.2);
    }
}

// Visual Helpers
export const Draw = {
    circle(ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fillStyle = color;
        ctx.fill();
    },
    
    glow(ctx, color, blur=20) {
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
