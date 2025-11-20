// --- Configuration ---
const THEMES = ['dark', 'light', 'sepia', 'midnight', 'ocean', 'forest', 'rose'];
const DEFAULT_FONT_SIZE = 16;

// --- 1. Immediate Initialization (Runs instantly to prevent flashing) ---
(function initSettings() {
    // A. Apply Saved Theme
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
    }

    // B. Apply Saved Font Size
    const savedSize = localStorage.getItem('userFontSize');
    if (savedSize) {
        document.documentElement.style.fontSize = savedSize + 'px';
    } else {
        document.documentElement.style.fontSize = DEFAULT_FONT_SIZE + 'px';
    }
})();

// --- 2. Setup Event Listeners (Runs when page is ready) ---
document.addEventListener('DOMContentLoaded', () => {
    // Find all theme buttons
    const themeButtons = document.querySelectorAll('.theme-button');
    
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });
});

// --- 3. Helper Functions ---

// Function to safely switch themes
function setTheme(themeName) {
    // 1. Remove ALL known theme classes from body
    document.body.classList.remove(...THEMES);
    
    // 2. Add the chosen theme class
    if (themeName) {
        document.body.classList.add(themeName);
        localStorage.setItem('selectedTheme', themeName);
    } else {
        // If 'light' or default is chosen, we might just remove classes
        localStorage.removeItem('selectedTheme');
    }
}

// Function to adjust font size (Made global for HTML buttons)
window.adjustFontSize = function(amount) {
    const htmlEl = document.documentElement;
    
    // Get current size, default to 16 if weird
    let currentSize = parseFloat(window.getComputedStyle(htmlEl, null).getPropertyValue('font-size')) || DEFAULT_FONT_SIZE;
    
    let newSize = currentSize + amount;

    // Safety Limits
    if (newSize < 12) newSize = 12;
    if (newSize > 28) newSize = 28;

    // Apply and Save
    htmlEl.style.fontSize = newSize + 'px';
    localStorage.setItem('userFontSize', newSize);
    console.log(`Font size set to: ${newSize}px`);
};
