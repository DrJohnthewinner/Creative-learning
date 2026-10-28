/**
 * Theme + font-size manager
 * - Load this in <head> (right after theme.css) so the saved theme applies before first paint.
 * - Safe to include more than once (guarded).
 * - Clicks are handled by ONE delegated listener, so buttons work no matter when they
 *   were added to the page or when this script ran.
 */
(function () {
    'use strict';

    if (window.__themeManagerLoaded) return;
    window.__themeManagerLoaded = true;

    var CONFIG = {
        storageKey: 'site_theme',
        fontKey: 'site_font_size',
        defaultTheme: 'dark',
        defaultFontSize: 16,
        minFontSize: 12,
        maxFontSize: 28,
        themes: ['dark', 'light', 'sepia', 'midnight', 'ocean', 'forest', 'rose']
    };

    // ---------- storage helpers (never throw) ----------
    function load(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function save(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* private mode etc. */ }
    }
    function remove(key) {
        try { localStorage.removeItem(key); } catch (e) {}
    }

    // ---------- theme ----------
    function updateActiveButtons(activeTheme) {
        var buttons = document.querySelectorAll('.theme-button, .theme-option-button');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('active', buttons[i].getAttribute('data-theme') === activeTheme);
        }
    }

    function applyTheme(name) {
        if (CONFIG.themes.indexOf(name) === -1) name = CONFIG.defaultTheme;
        // Set on <html> (what theme.css targets) and on <body> (covers any older cached CSS).
        document.documentElement.setAttribute('data-theme', name);
        if (document.body) document.body.setAttribute('data-theme', name);
        updateActiveButtons(name);
        return name;
    }

    function closeModal() {
        var overlay = document.getElementById('themeModalOverlay');
        if (overlay) overlay.classList.remove('visible');
    }

    function setTheme(name) {
        if (!name) return;
        name = applyTheme(name);
        save(CONFIG.storageKey, name);
        closeModal();
    }

    // ---------- font size ----------
    function applyFontSize(px) {
        document.documentElement.style.fontSize = px + 'px';
    }

    function adjustFontSize(amount) {
        var current = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || CONFIG.defaultFontSize;
        var next = Math.min(CONFIG.maxFontSize, Math.max(CONFIG.minFontSize, current + amount));
        applyFontSize(next);
        save(CONFIG.fontKey, next);
    }

    function resetFontSize() {
        remove(CONFIG.fontKey);
        document.documentElement.style.fontSize = '';
    }

    // Expose for inline onclick attributes and for testing in the console
    window.setTheme = setTheme;
    window.adjustFontSize = adjustFontSize;
    window.resetFontSize = resetFontSize;

    // ---------- 1. Run immediately (before the page paints) ----------
    var savedTheme = load(CONFIG.storageKey);
    applyTheme(savedTheme || CONFIG.defaultTheme);

    var savedFont = parseFloat(load(CONFIG.fontKey));
    if (savedFont) applyFontSize(savedFont);

    // ---------- 2. One delegated click listener for every theme button ----------
    document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || !target.closest) return;

        var button = target.closest('.theme-button, .theme-option-button');
        if (button) {
            setTheme(button.getAttribute('data-theme'));
            return;
        }

        // Clicking the dark backdrop of the first-visit modal keeps the default theme
        if (target.id === 'themeModalOverlay') {
            setTheme(load(CONFIG.storageKey) || CONFIG.defaultTheme);
        }
    });

    // ---------- 3. Once the DOM exists ----------
    document.addEventListener('DOMContentLoaded', function () {
        var current = load(CONFIG.storageKey) || CONFIG.defaultTheme;
        applyTheme(current); // now <body> exists, so it gets the attribute too

        // First visit: show the picker if this page has one
        var overlay = document.getElementById('themeModalOverlay');
        if (!load(CONFIG.storageKey) && overlay) {
            overlay.classList.add('visible');
        }
    });
})();
