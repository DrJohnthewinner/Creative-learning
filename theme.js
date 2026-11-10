/**
 * Theme + font-size manager (+ small shared UI helpers)
 * - Load in <head> right after theme.css so the saved theme applies before first paint.
 * - Safe to include more than once (guarded).
 * - Theme buttons are handled by ONE delegated click listener.
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

    // Browser UI colour per theme (matches --bg in theme.css)
    var CHROME_COLOR = {
        dark: '#0E1116', light: '#F5F7FA', sepia: '#F3E9D2', midnight: '#000000',
        ocean: '#0B1C26', forest: '#14261D', rose: '#FCEBEF'
    };

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
            var isActive = buttons[i].getAttribute('data-theme') === activeTheme;
            buttons[i].classList.toggle('active', isActive);
            buttons[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
        }
    }

    function setChromeColor(name) {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            if (!document.head) return;
            meta = document.createElement('meta');
            meta.setAttribute('name', 'theme-color');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', CHROME_COLOR[name] || CHROME_COLOR.dark);
    }

    function applyTheme(name) {
        if (CONFIG.themes.indexOf(name) === -1) name = CONFIG.defaultTheme;
        document.documentElement.setAttribute('data-theme', name);
        if (document.body) document.body.setAttribute('data-theme', name);
        updateActiveButtons(name);
        setChromeColor(name);
        return name;
    }

    function closeModal() {
        var overlay = document.getElementById('themeModalOverlay');
        if (overlay) overlay.classList.remove('visible');
    }

    function setTheme(name) {
        if (!name) return;
        // Brief colour transition only on a user action, never on page load
        if (!reduceMotion) {
            document.documentElement.classList.add('theme-anim');
            setTimeout(function () { document.documentElement.classList.remove('theme-anim'); }, 300);
        }
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

    // ---------- shared feedback helpers (replace alert()) ----------
    // showToast('Saved')  ->  slides in, auto-dismisses in ~2.5s
    function showToast(message, ms) {
        var old = document.querySelector('.toast');
        if (old) old.remove();
        var el = document.createElement('div');
        el.className = 'toast';
        el.setAttribute('role', 'status');
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(function () {
            el.classList.add('is-leaving');
            setTimeout(function () { el.remove(); }, 200);
        }, ms || 2500);
    }

    // confirmButton(btn, 'Saved') -> label changes briefly, then returns
    function confirmButton(btn, label, ms) {
        if (!btn) return;
        var original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> ' + label;
        btn.classList.add('is-done');
        setTimeout(function () {
            btn.innerHTML = original;
            btn.classList.remove('is-done');
        }, ms || 1800);
    }

    // setLoading(btn, true) -> spinner + disabled; setLoading(btn, false) restores
    function setLoading(btn, on) {
        if (!btn) return;
        btn.classList.toggle('is-loading', !!on);
        btn.disabled = !!on;
        if (btn.hasAttribute('aria-busy') || on) btn.setAttribute('aria-busy', on ? 'true' : 'false');
    }

    // Expose for inline onclick attributes and for testing in the console
    window.setTheme = setTheme;
    window.adjustFontSize = adjustFontSize;
    window.resetFontSize = resetFontSize;
    window.showToast = showToast;
    window.confirmButton = confirmButton;
    window.setLoading = setLoading;

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

        // Neutral icon for midnight (was a religious symbol), fixes every page without editing each one
        var midnightIcons = document.querySelectorAll('[data-theme="midnight"] .fa-star-of-david');
        for (var i = 0; i < midnightIcons.length; i++) {
            midnightIcons[i].classList.remove('fa-star-of-david');
            midnightIcons[i].classList.add('fa-star');
        }

        // Accessible names for every theme button that lacks a visible label
        var names = { dark: 'Dark', light: 'Light', sepia: 'Sepia', midnight: 'Midnight', ocean: 'Ocean', forest: 'Forest', rose: 'Rose' };
        var themeButtons = document.querySelectorAll('.theme-button');
        for (var j = 0; j < themeButtons.length; j++) {
            var t = themeButtons[j].getAttribute('data-theme');
            if (!themeButtons[j].getAttribute('aria-label')) themeButtons[j].setAttribute('aria-label', (names[t] || t) + ' theme');
            themeButtons[j].setAttribute('title', (names[t] || t) + ' theme');
        }

        // First visit: show the picker if this page has one
        var overlay = document.getElementById('themeModalOverlay');
        if (!load(CONFIG.storageKey) && overlay) {
            overlay.classList.add('visible');
        }
    });
})();
