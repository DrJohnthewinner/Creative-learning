/**
 * Shared tools for note.html, detail.html and favorites.html
 * - Text helpers (escapeHtml, getSnippet, highlightText)
 * - Favourites: ONE storage key ('boom_fav_notes'); old 'favoriteNotes' is merged in once
 * - Streak helper, safe calculator (no eval), unit converter, display settings
 * Pages that want the toolbar add:  <div id="tools-slot" class="toolbar"></div>
 */
(function () {
    'use strict';
    if (window.__boomToolsLoaded) return;
    window.__boomToolsLoaded = true;

    /* ---------- storage ---------- */
    function readArray(key) {
        try { var v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; }
        catch (e) { return []; }
    }
    function writeJSON(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    }

    /* ---------- text helpers ---------- */
    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    // Full note (may contain HTML) -> short plain-text preview. DOMParser runs no scripts and loads no images.
    function getSnippet(html, maxLen) {
        maxLen = maxLen || 160;
        var doc = new DOMParser().parseFromString(html || '', 'text/html');
        var text = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length > maxLen) text = text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
        return text;
    }
    function highlightText(text, query) {
        var safe = escapeHtml(text);
        if (!query) return safe;
        var q = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return safe.replace(new RegExp('(' + q + ')', 'gi'), '<mark class="search-highlight">$1</mark>');
    }
    function formatSubject(id) {
        return String(id || '').replace(/-/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    }

    /* ---------- favourites (single source of truth) ---------- */
    var FAV_KEY = 'boom_fav_notes', OLD_FAV_KEY = 'favoriteNotes';
    function getFavs() {
        var cur = readArray(FAV_KEY);
        var old = readArray(OLD_FAV_KEY);
        if (old.length) {
            old.forEach(function (id) { if (cur.indexOf(id) < 0) cur.push(id); });
            writeJSON(FAV_KEY, cur);
        }
        if (localStorage.getItem(OLD_FAV_KEY) !== null) { try { localStorage.removeItem(OLD_FAV_KEY); } catch (e) {} }
        return cur;
    }
    // returns true if the note is now a favourite
    function toggleFav(id) {
        var favs = getFavs();
        var i = favs.indexOf(id);
        if (i < 0) favs.push(id); else favs.splice(i, 1);
        writeJSON(FAV_KEY, favs);
        return i < 0;
    }

    /* ---------- streak (same data format as subjects.html) ---------- */
    function touchStreak() {
        var today = new Date().toDateString();
        var data = {};
        try { data = JSON.parse(localStorage.getItem('boom_streak') || '{}') || {}; } catch (e) {}
        if (data.lastDate !== today) {
            var y = new Date(); y.setDate(y.getDate() - 1);
            data.count = data.lastDate === y.toDateString() ? (data.count || 0) + 1 : 1;
            data.lastDate = today;
            try { localStorage.setItem('boom_streak', JSON.stringify(data)); } catch (e) {}
        }
        return data.count || 1;
    }

    /* ---------- display preferences ---------- */
    function getPrefs() {
        return {
            fontSize: localStorage.getItem('boom_pref_fontsize') || '1.1rem',
            lineHeight: localStorage.getItem('boom_pref_lineheight') || '1.9',
            dataSaver: localStorage.getItem('boom_pref_datasaver') === 'true'
        };
    }
    function applyUserPreferences() {
        var fs = document.getElementById('prefFontSize').value;
        var lh = document.getElementById('prefLineHeight').value;
        var ds = document.getElementById('prefDataSaver').checked;
        try {
            localStorage.setItem('boom_pref_fontsize', fs);
            localStorage.setItem('boom_pref_lineheight', lh);
            localStorage.setItem('boom_pref_datasaver', ds);
        } catch (e) {}
        document.dispatchEvent(new CustomEvent('boom:prefs'));
    }
    function resetAllSettings() {
        ['boom_pref_fontsize', 'boom_pref_lineheight', 'boom_pref_datasaver', 'site_theme', 'site_font_size']
            .forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
        location.reload();
    }

    /* ---------- safe calculator (replaces eval) ---------- */
    function safeCalc(expr) {
        var s = String(expr).replace(/\s+/g, ''), i = 0;
        function peek() { return s.charAt(i); }
        function number() {
            var m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
            if (!m) throw new Error('num');
            i += m[0].length;
            return parseFloat(m[0]);
        }
        function factor() {
            if (peek() === '-') { i++; return -factor(); }
            if (peek() === '(') { i++; var v = expression(); if (peek() !== ')') throw new Error('paren'); i++; return v; }
            return number();
        }
        function term() {
            var v = factor();
            while (peek() === '*' || peek() === '/') {
                var op = s.charAt(i++), r = factor();
                if (op === '/' && r === 0) throw new Error('div0');
                v = op === '*' ? v * r : v / r;
            }
            return v;
        }
        function expression() {
            var v = term();
            while (peek() === '+' || peek() === '-') { var op = s.charAt(i++), r = term(); v = op === '+' ? v + r : v - r; }
            return v;
        }
        var result = expression();
        if (i !== s.length) throw new Error('trailing');
        return Math.round(result * 1e10) / 1e10;
    }

    var calcMemory = 0, calcLog = [];
    function calcInput() { return document.getElementById('calc-input'); }
    function appendCalc(v) { calcInput().value += v; }
    function clearCalc() { calcInput().value = ''; }
    function backCalc() { var el = calcInput(); el.value = el.value.slice(0, -1); }
    function calculateResult() {
        var input = calcInput();
        if (!input.value) return;
        try {
            var res = safeCalc(input.value);
            calcLog.unshift(input.value + ' = ' + res);
            calcLog = calcLog.slice(0, 3);
            document.getElementById('calc-history-log').textContent = calcLog.join('\n');
            input.value = res;
        } catch (e) { input.value = 'Error'; }
    }
    function calcValue() { var n = parseFloat(calcInput().value); return isNaN(n) ? 0 : n; }
    function calcMemClear() { calcMemory = 0; showToast('Memory cleared'); }
    function calcMemRecall() { appendCalc(String(calcMemory)); }
    function calcMemAdd() { calcMemory += calcValue(); showToast('Added to memory'); }
    function calcMemSub() { calcMemory -= calcValue(); showToast('Subtracted from memory'); }

    function convertUnits() {
        var type = document.getElementById('convType').value;
        var raw = document.getElementById('convInput').value;
        var val = parseFloat(raw);
        var out = document.getElementById('convResult');
        if (isNaN(val)) { out.textContent = 'Enter a number to convert'; return; }
        var res = type === 'length' ? val / 1000 + ' km' : type === 'mass' ? val / 1000 + ' kg' : val / 10000 + ' hectares';
        out.textContent = res;
    }

    /* ---------- popups ---------- */
    function closePopups(except) {
        ['calc-box', 'converter-box'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el && id !== except) el.classList.remove('open');
        });
    }
    function togglePopup(id, focusSel) {
        var el = document.getElementById(id);
        if (!el) return;
        var willOpen = !el.classList.contains('open');
        closePopups(willOpen ? id : null);
        el.classList.toggle('open', willOpen);
        if (willOpen && focusSel) { var f = el.querySelector(focusSel); if (f) f.focus(); }
    }
    function toggleCalculator() { togglePopup('calc-box', '.popup-close'); }
    function toggleConverter() { togglePopup('converter-box', '#convInput'); }
    function toggleSettingsModal() {
        var m = document.getElementById('settingsModal');
        if (!m) return;
        var open = !m.classList.contains('open');
        m.classList.toggle('open', open);
        if (open) document.getElementById('prefFontSize').focus();
    }

    /* ---------- injected styles + markup ---------- */
    var CSS = '' +
        '.toolbar{display:flex;align-items:center;gap:var(--sp-2);margin-left:auto}' +
        '.tools-popup{position:fixed;right:var(--sp-4);bottom:var(--sp-4);width:min(320px,calc(100vw - 2*var(--sp-4)));' +
        'background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--sp-4);' +
        'box-shadow:var(--shadow-3);z-index:var(--z-popover);display:none}' +
        '.tools-popup.open{display:block;animation:tools-in var(--dur-slow) var(--ease)}' +
        '@keyframes tools-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
        '.popup-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-3);font-weight:var(--fw-semibold);color:var(--heading)}' +
        '.tools-popup input,.tools-popup select{width:100%;margin:0 0 var(--sp-2)}' +
        '#calc-input{text-align:right;font-size:var(--fs-4)}' +
        '#calc-history-log{min-height:3.6em;margin-bottom:var(--sp-2);font-size:var(--fs-1);color:var(--text-muted);white-space:pre-line;text-align:right}' +
        '.calc-buttons{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-2)}' +
        '.calc-buttons button{min-height:var(--tap);border:1px solid var(--border);border-radius:var(--r-inner-lg);background:var(--surface-2);' +
        'color:var(--text);font:inherit;font-weight:var(--fw-semibold);cursor:pointer}' +
        '.calc-buttons button:hover{background:var(--accent);color:var(--on-accent)}' +
        '.calc-buttons button:active{transform:scale(.95)}' +
        '#convResult{margin-top:var(--sp-2);font-weight:var(--fw-semibold);font-variant-numeric:tabular-nums}' +
        '.settings-modal{position:fixed;inset:0;background:rgb(0 0 0/.6);z-index:var(--z-modal);display:none;align-items:center;justify-content:center;padding:var(--sp-4)}' +
        '.settings-modal.open{display:flex}' +
        '.settings-card{width:100%;max-width:440px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--sp-5);box-shadow:var(--shadow-3)}' +
        '.settings-card h2{font-size:var(--fs-4);margin:0 0 var(--sp-4)}' +
        '.settings-group{margin-bottom:var(--sp-4)}' +
        '.settings-group label{display:block;font-weight:var(--fw-semibold);margin-bottom:var(--sp-2)}' +
        '.settings-group select{width:100%}' +
        '.settings-check{display:flex!important;align-items:center;gap:var(--sp-3);min-height:var(--tap)}' +
        '.settings-check input{width:20px;height:20px;min-height:0;accent-color:var(--accent)}' +
        '.settings-actions{display:flex;justify-content:space-between;gap:var(--sp-3);flex-wrap:wrap}';

    function inject() {
        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var slot = document.getElementById('tools-slot');
        if (slot) {
            var onFavPage = /favorites\.html/.test(location.pathname);
            slot.innerHTML =
                (onFavPage ? '' : '<a class="icon-btn" href="favorites.html" aria-label="Favourites" title="Favourites"><i class="fas fa-heart"></i></a>') +
                '<button type="button" class="icon-btn" onclick="toggleConverter()" aria-label="Unit converter" title="Unit converter"><i class="fas fa-ruler"></i></button>' +
                '<button type="button" class="icon-btn" onclick="toggleCalculator()" aria-label="Calculator" title="Calculator"><i class="fas fa-calculator"></i></button>' +
                '<button type="button" class="icon-btn" onclick="toggleSettingsModal()" aria-label="Reading settings" title="Reading settings"><i class="fas fa-sliders"></i></button>';
        }

        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<div class="tools-popup" id="calc-box" role="dialog" aria-label="Calculator">' +
              '<div class="popup-head"><span>Calculator</span><button type="button" class="icon-btn popup-close" onclick="toggleCalculator()" aria-label="Close calculator"><i class="fas fa-xmark"></i></button></div>' +
              '<div id="calc-history-log" aria-live="polite"></div>' +
              '<input type="text" id="calc-input" readonly placeholder="0" aria-label="Calculator display">' +
              '<div class="calc-buttons">' +
                '<button type="button" onclick="calcMemClear()" aria-label="Memory clear">MC</button><button type="button" onclick="calcMemRecall()" aria-label="Memory recall">MR</button><button type="button" onclick="calcMemAdd()" aria-label="Memory add">M+</button><button type="button" onclick="calcMemSub()" aria-label="Memory subtract">M-</button>' +
                '<button type="button" onclick="appendCalc(\'7\')">7</button><button type="button" onclick="appendCalc(\'8\')">8</button><button type="button" onclick="appendCalc(\'9\')">9</button><button type="button" onclick="appendCalc(\'/\')" aria-label="Divide">÷</button>' +
                '<button type="button" onclick="appendCalc(\'4\')">4</button><button type="button" onclick="appendCalc(\'5\')">5</button><button type="button" onclick="appendCalc(\'6\')">6</button><button type="button" onclick="appendCalc(\'*\')" aria-label="Multiply">×</button>' +
                '<button type="button" onclick="appendCalc(\'1\')">1</button><button type="button" onclick="appendCalc(\'2\')">2</button><button type="button" onclick="appendCalc(\'3\')">3</button><button type="button" onclick="appendCalc(\'-\')" aria-label="Subtract">−</button>' +
                '<button type="button" onclick="appendCalc(\'0\')">0</button><button type="button" onclick="appendCalc(\'.\')" aria-label="Decimal point">.</button><button type="button" onclick="calculateResult()" aria-label="Equals">=</button><button type="button" onclick="appendCalc(\'+\')" aria-label="Add">+</button>' +
                '<button type="button" onclick="appendCalc(\'(\')">(</button><button type="button" onclick="appendCalc(\')\')">)</button><button type="button" onclick="backCalc()" aria-label="Delete last"><i class="fas fa-delete-left"></i></button><button type="button" onclick="clearCalc()" aria-label="Clear">C</button>' +
              '</div>' +
            '</div>' +
            '<div class="tools-popup" id="converter-box" role="dialog" aria-label="Unit converter">' +
              '<div class="popup-head"><span>Unit converter</span><button type="button" class="icon-btn popup-close" onclick="toggleConverter()" aria-label="Close converter"><i class="fas fa-xmark"></i></button></div>' +
              '<select id="convType" onchange="convertUnits()" aria-label="Conversion type"><option value="length">Metres to kilometres</option><option value="mass">Grams to kilograms</option><option value="area">Square metres to hectares</option></select>' +
              '<input type="number" id="convInput" placeholder="Enter a value" oninput="convertUnits()" aria-label="Value to convert">' +
              '<div id="convResult" aria-live="polite">Enter a number to convert</div>' +
            '</div>' +
            '<div class="settings-modal" id="settingsModal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">' +
              '<div class="settings-card">' +
                '<h2 id="settingsTitle">Reading settings</h2>' +
                '<div class="settings-group"><label for="prefFontSize">Text size</label><select id="prefFontSize" onchange="applyUserPreferences()"><option value="1rem">Small</option><option value="1.1rem">Medium</option><option value="1.25rem">Large</option></select></div>' +
                '<div class="settings-group"><label for="prefLineHeight">Line spacing</label><select id="prefLineHeight" onchange="applyUserPreferences()"><option value="1.5">Compact</option><option value="1.9">Normal</option><option value="2.2">Spacious</option></select></div>' +
                '<div class="settings-group"><label class="settings-check"><input type="checkbox" id="prefDataSaver" onchange="applyUserPreferences()"> Data saver: don\'t load images until I ask</label></div>' +
                '<div class="settings-actions"><button type="button" class="btn btn-danger" onclick="resetAllSettings()">Reset settings</button><button type="button" class="btn btn-primary" onclick="toggleSettingsModal()">Done</button></div>' +
              '</div>' +
            '</div>';
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

        var p = getPrefs();
        document.getElementById('prefFontSize').value = p.fontSize;
        document.getElementById('prefLineHeight').value = p.lineHeight;
        document.getElementById('prefDataSaver').checked = p.dataSaver;

        // Backdrop click closes settings
        document.getElementById('settingsModal').addEventListener('click', function (e) {
            if (e.target === this) toggleSettingsModal();
        });
    }

    document.addEventListener('keydown', function (e) {
        var calc = document.getElementById('calc-box');
        if (e.key === 'Escape') {
            var m = document.getElementById('settingsModal');
            if (m && m.classList.contains('open')) { toggleSettingsModal(); return; }
            closePopups(null);
            return;
        }
        if (!calc || !calc.classList.contains('open')) return;
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'SELECT' || (tag === 'INPUT' && document.activeElement.id !== 'calc-input') || tag === 'TEXTAREA') return;
        if (/^[0-9+\-*/.()]$/.test(e.key)) { appendCalc(e.key); }
        else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calculateResult(); }
        else if (e.key === 'Backspace') { backCalc(); }
        else if (e.key.toLowerCase() === 'c') { clearCalc(); }
    });

    document.addEventListener('DOMContentLoaded', inject);

    // Fallback if theme.js is missing
    function showToast(msg) { if (window.showToast) window.showToast(msg); }

    window.escapeHtml = escapeHtml;
    window.getSnippet = getSnippet;
    window.highlightText = highlightText;
    window.formatSubject = formatSubject;
    window.getFavs = getFavs;
    window.toggleFav = toggleFav;
    window.touchStreak = touchStreak;
    window.getPrefs = getPrefs;
    window.applyUserPreferences = applyUserPreferences;
    window.resetAllSettings = resetAllSettings;
    window.toggleCalculator = toggleCalculator;
    window.toggleConverter = toggleConverter;
    window.toggleSettingsModal = toggleSettingsModal;
    window.appendCalc = appendCalc;
    window.clearCalc = clearCalc;
    window.backCalc = backCalc;
    window.calculateResult = calculateResult;
    window.calcMemClear = calcMemClear;
    window.calcMemRecall = calcMemRecall;
    window.calcMemAdd = calcMemAdd;
    window.calcMemSub = calcMemSub;
    window.convertUnits = convertUnits;
    window.safeCalc = safeCalc;
})();
