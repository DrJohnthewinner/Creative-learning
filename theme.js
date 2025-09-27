// theme.js
function setTheme(themeName) {
    // Store the theme choice in localStorage
    localStorage.setItem('theme', themeName);
    
    // Apply the theme to the body by setting the data-theme attribute
    document.body.setAttribute('data-theme', themeName);
    
    // Update the 'active' class on the theme switcher buttons
    document.querySelectorAll('.theme-button').forEach(btn => {
        if (btn.dataset.theme === themeName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // If the theme modal is present, hide it after a selection is made
    const modalOverlay = document.getElementById('themeModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('visible');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherButtons = document.querySelectorAll('.theme-button');
    const themeModalOverlay = document.getElementById('themeModalOverlay');
    const themeOptionButtons = document.querySelectorAll('.theme-option-button');

    // Add click event listeners for the top-right theme switcher
    themeSwitcherButtons.forEach(button => {
        button.addEventListener('click', () => {
            setTheme(button.dataset.theme);
        });
    });

    // Add click event listeners for the initial theme selection modal
    if (themeOptionButtons.length > 0) {
        themeOptionButtons.forEach(button => {
            button.addEventListener('click', () => {
                setTheme(button.dataset.theme);
            });
        });
    }

    // Check for a saved theme in localStorage when the page loads
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        // If a theme is found, apply it
        setTheme(savedTheme);
    } else if (themeModalOverlay) {
        // If no theme is saved AND we are on the index page (where the modal exists), show the modal.
        // We set a default 'dark' theme just for the modal's appearance before a choice is made.
        document.body.setAttribute('data-theme', 'dark'); 
        themeModalOverlay.classList.add('visible');
    } else {
        // Fallback for any other page if no theme is set (defaults to dark via CSS)
        setTheme('dark');
    }
});