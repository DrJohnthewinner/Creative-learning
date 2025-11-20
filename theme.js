document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Theme Logic (Your existing theme code) ---
    const themeButtons = document.querySelectorAll('.theme-button');
    const body = document.body;

    // Load saved theme
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        body.className = savedTheme;
    }

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            // Clear old themes (assuming your classes work this way)
            body.className = ''; 
            if(theme) body.classList.add(theme);
            localStorage.setItem('selectedTheme', theme);
        });
    });
});


// --- 2. Font Logic (MUST BE OUTSIDE the 'DOMContentLoaded' block above) ---

// Run this immediately to set font size on page load
(function initFontSize() {
    const savedSize = localStorage.getItem('userFontSize');
    if (savedSize) {
        document.documentElement.style.fontSize = savedSize + 'px';
    } else {
        document.documentElement.style.fontSize = '16px'; // Default
    }
})();

// We attach this to 'window' to make sure the HTML button can see it
window.adjustFontSize = function(amount) {
    const htmlEl = document.documentElement;
    
    // Get current size (default to 16 if logic fails)
    let currentSize = parseFloat(window.getComputedStyle(htmlEl, null).getPropertyValue('font-size')) || 16;
    
    let newSize = currentSize + amount;

    // Safety Limits (Min 12px, Max 30px)
    if (newSize < 12) newSize = 12;
    if (newSize > 30) newSize = 30;

    // Apply the new size
    htmlEl.style.fontSize = newSize + 'px';
    
    // Save to memory
    localStorage.setItem('userFontSize', newSize);
    
    console.log("Font adjusted to: " + newSize + "px"); // Check your console for this!
};
