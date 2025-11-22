/**
 * 🌟 SUPER MERGED THEME MANAGER 🌟
 * Handles Theme Switching, Font Scaling, and Initial Load Optimization.
 */

// --- ⚙️ Configuration & Constants ---
const CONFIG = {
    storageKey: 'site_theme',      // Unified key for local storage
    fontKey: 'site_font_size',     // Key for font size
    defaultTheme: 'dark',          // Fallback theme
    defaultFontSize: 16,           // Base font size in px
    minFontSize: 12,
    maxFontSize: 28,
    // List of available themes for validation/cycling
    themes: ['dark', 'light', 'sepia', 'midnight', 'ocean', 'forest', 'rose']
};

// --- ⚡ Core Logic (State-of-the-Art) ---

/**
 * Applies the theme to the HTML root element.
 * Uses 'data-theme' attribute for modern CSS support (e.g., [data-theme="dark"]).
 * @param {string} themeName 
 */
function applyThemeToDOM(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Optional: Update active states on buttons immediately if DOM is ready
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        updateActiveButtons(themeName);
    }
}

/**
 * Sets the theme, saves it, and handles UI updates.
 * @param {string} themeName 
 */
function setTheme(themeName) {
    if (!themeName) return;

    // 1. Save to LocalStorage 💾
    localStorage.setItem(CONFIG.storageKey, themeName);

    // 2. Apply visually 🎨
    applyThemeToDOM(themeName);

    // 3. Close Modal if open (User made a choice) 🚪
    const modalOverlay = document.getElementById('themeModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('visible');
    }
}

/**
 * Updates the visual 'active' state of theme buttons.
 * @param {string} activeTheme 
 */
function updateActiveButtons(activeTheme) {
    const buttons = document.querySelectorAll('.theme-button, .theme-option-button');
    buttons.forEach(btn => {
        if (btn.dataset.theme === activeTheme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Global function to adjust font size safely.
 * @param {number} amount - Positive or negative integer
 */
window.adjustFontSize = function(amount) {
    const htmlEl = document.documentElement;
    
    // Get current computed size
    let currentSize = parseFloat(window.getComputedStyle(htmlEl).fontSize) || CONFIG.defaultFontSize;
    let newSize = currentSize + amount;

    // 🛡️ Safety Limits
    if (newSize < CONFIG.minFontSize) newSize = CONFIG.minFontSize;
    if (newSize > CONFIG.maxFontSize) newSize = CONFIG.maxFontSize;

    // Apply and Save
    htmlEl.style.fontSize = `${newSize}px`;
    localStorage.setItem(CONFIG.fontKey, newSize);
    console.log(`📏 Font size updated to: ${newSize}px`);
};

// --- 🚀 1. Immediate Initialization (IIFE) ---
// Runs BEFORE content loads to prevent "Flash of Unstyled Content" (FOUC) 🕶️
(() => {
    // A. Restore Theme
    const savedTheme = localStorage.getItem(CONFIG.storageKey);
    const initialTheme = savedTheme || CONFIG.defaultTheme;
    
    // Apply immediately to the root <html> element
    applyThemeToDOM(initialTheme);

    // B. Restore Font Size
    const savedFont = localStorage.getItem(CONFIG.fontKey);
    if (savedFont) {
        document.documentElement.style.fontSize = `${savedFont}px`;
    }
})();

// --- 🎮 2. Event Listeners (DOM Ready) ---
document.addEventListener('DOMContentLoaded', () => {
    // 🔍 Grab Elements
    const themeButtons = document.querySelectorAll('.theme-button');
    const themeOptionButtons = document.querySelectorAll('.theme-option-button'); // Buttons inside modal
    const modalOverlay = document.getElementById('themeModalOverlay');
    const savedTheme = localStorage.getItem(CONFIG.storageKey);

    // A. Bind ALL Theme Buttons (Navbar + Modal)
    const allThemeBtns = [...themeButtons, ...themeOptionButtons];
    allThemeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setTheme(btn.dataset.theme);
        });
    });

    // B. Initialize Active Button State
    if (savedTheme) {
        updateActiveButtons(savedTheme);
    }

    // C. Modal Logic: First Time Visit Check 🕵️‍♂️
    // If no theme is saved AND the modal exists, show it.
    if (!savedTheme && modalOverlay) {
        console.log("👋 First visit detected! Showing theme selector.");
        modalOverlay.classList.add('visible');
        // Optional: Set a temporary default for preview
        applyThemeToDOM(CONFIG.defaultTheme); 
    } else if (!savedTheme) {
        // Fallback if no modal exists
        setTheme(CONFIG.defaultTheme);
    }
});
