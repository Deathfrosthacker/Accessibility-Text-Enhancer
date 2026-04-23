// content-scripts/content.js
(function() {
    'use strict';

    const STATE = {
        currentSelection: null,
        isExtensionEnabled: true,
        currentFontStyle: 'sans-serif',
        isDarkMode: true,
        history: [],
        historyIndex: -1,
        currentDomain: window.location.hostname,
        siteSettings: {},
        toolbarTimeout: null,
        pageStyleEl: null
    };

    const CONFIG = {
        toolbarId: 'accessibility-toolbar',
        settingsPanelId: 'accessibility-settings-panel',
        settingsOverlayId: 'accessibility-settings-overlay',
        pageStyleId: 'accessibility-page-styles',
        selectionDelay: 150,
        toastDuration: 2000,
        maxHistorySize: 50,
        fontSizeMin: 8,
        fontSizeMax: 50
    };

    // ==================== INITIALIZATION ====================

    async function initialize() {
        try {
            await loadExtensionState();
            setupEventListeners();
            setupKeyboardShortcuts();
        } catch (error) {
            console.error('Accessibility Enhancer init error:', error);
        }
    }

    async function loadExtensionState() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['extensionEnabled', 'darkMode', 'siteSettings'], (result) => {
                STATE.isExtensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
                STATE.isDarkMode = result.darkMode !== undefined ? result.darkMode : true;
                STATE.siteSettings = result.siteSettings || {};

                if (!STATE.isExtensionEnabled) {
                    removeToolbar();
                } else {
                    applyAutoSettings();
                }
                resolve();
            });
        });
    }

    function applyAutoSettings() {
        const settings = STATE.siteSettings[STATE.currentDomain];
        if (!settings || !settings.autoSave) return;
        applyPageWideSettings(settings);
    }

    function saveSiteSettings(settings) {
        STATE.siteSettings[STATE.currentDomain] = {
            ...STATE.siteSettings[STATE.currentDomain],
            ...settings,
            lastUpdated: Date.now()
        };
        chrome.storage.local.set({ siteSettings: STATE.siteSettings });
        showToast('Settings saved for this website');
    }

    // ==================== MESSAGE HANDLERS ====================

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'setEnabled':
                STATE.isExtensionEnabled = request.value;
                chrome.storage.local.set({ extensionEnabled: STATE.isExtensionEnabled });
                if (!STATE.isExtensionEnabled) {
                    removeToolbar();
                    showToast('Extension disabled');
                } else {
                    showToast('Extension enabled');
                }
                sendResponse({ status: 'success' });
                break;

            case 'applySettings':
                if (request.settings) {
                    applyPageWideSettings(request.settings);
                }
                sendResponse({ status: 'success' });
                break;

            case 'applyPageWide':
                applyPageWideSettings(STATE.siteSettings[STATE.currentDomain] || {});
                sendResponse({ status: 'success' });
                break;

            case 'resetAll':
                resetAllEnhancements();
                sendResponse({ status: 'success' });
                break;
        }
        return true;
    });

    // ==================== PAGE-WIDE SETTINGS ====================

    function applyPageWideSettings(settings) {
        let existing = document.getElementById(CONFIG.pageStyleId);
        if (!existing) {
            existing = document.createElement('style');
            existing.id = CONFIG.pageStyleId;
            document.head.appendChild(existing);
        }

        const rules = [];

        if (settings.fontSize && settings.fontSize != 100) {
            const scale = settings.fontSize / 100;
            rules.push(`body, body * { font-size: calc(1em * ${scale}) !important; }`);
        }

        if (settings.lineHeight && settings.lineHeight != 1.5) {
            rules.push(`body, body * { line-height: ${settings.lineHeight} !important; }`);
        }

        if (settings.letterSpacing && settings.letterSpacing > 0) {
            rules.push(`body, body * { letter-spacing: ${settings.letterSpacing}px !important; }`);
        }

        if (settings.fontFamily && settings.fontFamily !== 'inherit') {
            rules.push(`body, body * { font-family: ${settings.fontFamily} !important; }`);
        }

        if (settings.boldText) {
            rules.push(`body, body * { font-weight: bold !important; }`);
        }

        if (settings.underlineLinks) {
            rules.push(`a { text-decoration: underline !important; }`);
        }

        if (settings.highlightLinks) {
            rules.push(`a { background-color: #fff3cd !important; outline: 1px solid #ffc107 !important; }`);
        }

        if (settings.contrast === 'high') {
            rules.push(`body { background-color: #fff !important; color: #000 !important; }`);
            rules.push(`p, span, div, h1, h2, h3, h4, h5, h6, li, td, th { color: #000 !important; }`);
        } else if (settings.contrast === 'very-high') {
            rules.push(`body { background-color: #000 !important; color: #fff !important; }`);
            rules.push(`p, span, div, h1, h2, h3, h4, h5, h6, li, td, th { color: #fff !important; background-color: #000 !important; }`);
        }

        if (settings.darkMode) {
            rules.push(`html { filter: invert(1) hue-rotate(180deg) !important; }`);
            rules.push(`img, video, canvas, iframe { filter: invert(1) hue-rotate(180deg) !important; }`);
        }

        if (settings.reduceAnimations) {
            rules.push(`*, *::before, *::after { animation: none !important; transition: none !important; }`);
        }

        if (settings.colorBlindnessFilter && settings.colorBlindnessFilter !== 'none') {
            const filter = getColorBlindnessFilter(settings.colorBlindnessFilter);
            if (filter) {
                rules.push(`html { filter: ${filter} !important; }`);
            }
        }

        existing.textContent = rules.join('\n');
        STATE.pageStyleEl = existing;
    }

    function getColorBlindnessFilter(type) {
        const filters = {
            protanopia: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'p\'><feColorMatrix type=\'matrix\' values=\'0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0\'/></filter></svg>#p")',
            deuteranopia: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'d\'><feColorMatrix type=\'matrix\' values=\'0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0\'/></filter></svg>#d")',
            tritanopia: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'t\'><feColorMatrix type=\'matrix\' values=\'0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0\'/></filter></svg>#t")',
            achromatopsia: 'grayscale(100%)'
        };
        return filters[type] || null;
    }

    function resetAllEnhancements() {
        const styleEl = document.getElementById(CONFIG.pageStyleId);
        if (styleEl) styleEl.remove();
        STATE.pageStyleEl = null;

        // Restore all inline style overrides from history
        STATE.history.forEach(entry => {
            if (entry.element && entry.styles) {
                Object.entries(entry.styles).forEach(([prop, value]) => {
                    const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                    if (value !== undefined) {
                        entry.element.style.setProperty(cssProp, value || '', value ? 'important' : '');
                    }
                });
            }
        });

        STATE.history = [];
        STATE.historyIndex = -1;
        updateToolbarState();
        showToast('All enhancements reset');
    }

    // ==================== TOOLBAR MANAGEMENT ====================

    function createToolbar() {
        if (!STATE.isExtensionEnabled) return null;
        removeToolbar();

        const toolbar = document.createElement('div');
        toolbar.id = CONFIG.toolbarId;
        toolbar.className = STATE.isDarkMode ? '' : 'light-mode';

        toolbar.innerHTML =
            '<div class="button-group">' +
                '<button data-command="undo" class="history-btn" data-tooltip="Undo (Ctrl+Z)"' + (STATE.historyIndex < 0 ? ' disabled' : '') + '>&#8630;</button>' +
                '<button data-command="redo" class="history-btn" data-tooltip="Redo (Ctrl+Y)"' + (STATE.historyIndex >= STATE.history.length - 1 ? ' disabled' : '') + '>&#8631;</button>' +
            '</div>' +
            '<div class="button-group">' +
                '<button data-command="bold" data-tooltip="Bold">Bold</button>' +
                '<button data-command="highlight" data-tooltip="Highlight">Highlight</button>' +
            '</div>' +
            '<div class="button-group">' +
                '<button data-command="sizeDown" class="size-btn" data-tooltip="Decrease Size">A-</button>' +
                '<button data-command="sizeUp" class="size-btn" data-tooltip="Increase Size">A+</button>' +
            '</div>' +
            '<div class="button-group">' +
                '<button data-command="fontStyle" class="icon-btn" data-tooltip="Toggle Font">Aa</button>' +
                '<button data-command="spacing" class="icon-btn" data-tooltip="Text Spacing">Sp</button>' +
                '<button data-command="contrast" class="icon-btn" data-tooltip="Fix Contrast">Co</button>' +
                '<button data-command="readAloud" class="icon-btn" data-tooltip="Read Aloud">Rd</button>' +
            '</div>' +
            '<div class="button-group">' +
                '<button data-command="settings" class="settings-btn" data-tooltip="Settings">Set</button>' +
                '<button data-command="toggleTheme" class="settings-btn" data-tooltip="Toggle Theme">' + (STATE.isDarkMode ? 'Lt' : 'Dk') + '</button>' +
            '</div>';

        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            e.stopPropagation();
            handleCommand(btn.getAttribute('data-command'));
        });

        document.body.appendChild(toolbar);
        requestAnimationFrame(() => toolbar.classList.add('show'));
        return toolbar;
    }

    function positionToolbar(toolbar, range) {
        if (!range) return;
        const viewportWidth = window.innerWidth;
        const toolbarWidth = 400;
        const rect = range.getBoundingClientRect();
        let left = rect.left + rect.width / 2;
        left = Math.max(toolbarWidth / 2 + 15, Math.min(left, viewportWidth - toolbarWidth / 2 - 15));
        toolbar.style.top = '15px';
        toolbar.style.left = left + 'px';
    }

    function removeToolbar() {
        const el = document.getElementById(CONFIG.toolbarId);
        if (el) el.remove();
    }

    function isClickOutsideToolbar(event) {
        const toolbar = document.getElementById(CONFIG.toolbarId);
        const panel = document.getElementById(CONFIG.settingsPanelId);
        return !(toolbar && toolbar.contains(event.target)) &&
               !(panel && panel.contains(event.target));
    }

    // ==================== COMMAND HANDLING ====================

    function handleCommand(command) {
        if (command === 'settings') { showSettingsPanel(); return; }
        if (command === 'toggleTheme') { toggleToolbarTheme(); return; }
        if (command === 'undo') { undo(); return; }
        if (command === 'redo') { redo(); return; }
        enhanceSelection(command);
    }

    function enhanceSelection(command) {
        if (!STATE.isExtensionEnabled) return;
        if (!STATE.currentSelection || STATE.currentSelection.rangeCount === 0) return;

        const range = STATE.currentSelection.getRangeAt(0);
        let el = range.commonAncestorContainer;
        while (el && el.nodeType !== 1) el = el.parentElement;
        if (!el) return;

        saveState(el, command);

        switch (command) {
            case 'bold': toggleBold(el); break;
            case 'highlight': toggleHighlight(el); break;
            case 'sizeDown': adjustFontSize(el, -2); break;
            case 'sizeUp': adjustFontSize(el, 2); break;
            case 'fontStyle': toggleFontStyle(el); break;
            case 'spacing': adjustTextSpacing(el); break;
            case 'contrast': fixTextContrast(el); break;
            case 'readAloud': readTextAloud(el); break;
        }

        updateToolbarState();
    }

    // ==================== ENHANCEMENT FUNCTIONS ====================

    function toggleBold(el) {
        const w = getComputedStyle(el).fontWeight;
        const newW = (w === 'bold' || parseInt(w) >= 700) ? 'normal' : 'bold';
        el.style.setProperty('font-weight', newW, 'important');
        showToast('Text ' + (newW === 'bold' ? 'bolded' : 'unbolded'));
    }

    function toggleHighlight(el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg === 'rgb(255, 255, 0)') {
            el.style.setProperty('background-color', '', '');
            showToast('Highlight removed');
        } else if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
            el.style.setProperty('background-color', 'rgb(255, 255, 0)', 'important');
            el.style.setProperty('color', '#000', 'important');
            showToast('Text highlighted');
        } else {
            el.style.setProperty('outline', '3px solid #FFD700', 'important');
            showToast('Outline applied');
        }
    }

    function adjustFontSize(el, change) {
        const current = parseFloat(getComputedStyle(el).fontSize);
        const next = Math.round(current + change);
        if (next >= CONFIG.fontSizeMin && next <= CONFIG.fontSizeMax) {
            el.style.setProperty('font-size', next + 'px', 'important');
            showToast('Font size: ' + next + 'px');
        } else {
            showToast('Size limit reached (' + CONFIG.fontSizeMin + '-' + CONFIG.fontSizeMax + 'px)');
        }
    }

    function toggleFontStyle(el) {
        if (STATE.currentFontStyle === 'sans-serif') {
            el.style.setProperty('font-family', 'Georgia, "Times New Roman", serif', 'important');
            STATE.currentFontStyle = 'serif';
            showToast('Font: Serif');
        } else {
            el.style.setProperty('font-family', 'Arial, Helvetica, sans-serif', 'important');
            STATE.currentFontStyle = 'sans-serif';
            showToast('Font: Sans-serif');
        }
    }

    function adjustTextSpacing(el) {
        const ls = getComputedStyle(el).letterSpacing;
        if (ls === 'normal' || parseFloat(ls) < 2) {
            el.style.setProperty('letter-spacing', '2px', 'important');
            el.style.setProperty('word-spacing', '4px', 'important');
            el.style.setProperty('line-height', '1.8', 'important');
            showToast('Spacing increased');
        } else {
            el.style.setProperty('letter-spacing', 'normal', 'important');
            el.style.setProperty('word-spacing', 'normal', 'important');
            el.style.setProperty('line-height', '', '');
            showToast('Spacing reset');
        }
    }

    function fixTextContrast(el) {
        const bg = getComputedStyle(el).backgroundColor;
        const bgMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        let useDark = true;

        if (bgMatch) {
            const r = parseInt(bgMatch[1]);
            const g = parseInt(bgMatch[2]);
            const b = parseInt(bgMatch[3]);
            const lum = (r * 299 + g * 587 + b * 114) / 1000;
            useDark = lum > 128;
        }

        el.style.setProperty('color', useDark ? '#000000' : '#ffffff', 'important');
        showToast('Contrast fixed: ' + (useDark ? 'black' : 'white') + ' text');
    }

    function readTextAloud(el) {
        if (!('speechSynthesis' in window)) {
            showToast('Speech synthesis not supported');
            return;
        }
        const text = (STATE.currentSelection && STATE.currentSelection.toString().trim()) || el.textContent.trim();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onstart = () => showToast('Reading...');
        utterance.onend = () => showToast('Done reading');
        window.speechSynthesis.speak(utterance);
    }

    // ==================== HISTORY MANAGEMENT ====================

    function saveState(element, command) {
        const state = {
            element,
            command,
            styles: {
                fontWeight: element.style.fontWeight,
                backgroundColor: element.style.backgroundColor,
                fontSize: element.style.fontSize,
                fontFamily: element.style.fontFamily,
                letterSpacing: element.style.letterSpacing,
                wordSpacing: element.style.wordSpacing,
                lineHeight: element.style.lineHeight,
                color: element.style.color,
                outline: element.style.outline
            },
            timestamp: Date.now()
        };

        STATE.history = STATE.history.slice(0, STATE.historyIndex + 1);
        STATE.history.push(state);
        STATE.historyIndex++;

        if (STATE.history.length > CONFIG.maxHistorySize) {
            STATE.history.shift();
            STATE.historyIndex--;
        }

        try {
            chrome.runtime.sendMessage({ action: 'incrementStats' });
        } catch (_) {}
    }

    function undo() {
        if (STATE.historyIndex < 0) { showToast('Nothing to undo'); return; }
        const state = STATE.history[STATE.historyIndex];
        restoreState(state);
        STATE.historyIndex--;
        updateToolbarState();
        showToast('Undone');
    }

    function redo() {
        if (STATE.historyIndex >= STATE.history.length - 1) { showToast('Nothing to redo'); return; }
        STATE.historyIndex++;
        const state = STATE.history[STATE.historyIndex];
        restoreState(state);
        updateToolbarState();
        showToast('Redone');
    }

    function restoreState(state) {
        if (!state.element) return;
        Object.entries(state.styles).forEach(([prop, value]) => {
            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            if (value) {
                state.element.style.setProperty(cssProp, value, 'important');
            } else {
                state.element.style.removeProperty(cssProp);
            }
        });
    }

    function updateToolbarState() {
        const toolbar = document.getElementById(CONFIG.toolbarId);
        if (!toolbar) return;
        const undoBtn = toolbar.querySelector('[data-command="undo"]');
        const redoBtn = toolbar.querySelector('[data-command="redo"]');
        if (undoBtn) undoBtn.disabled = STATE.historyIndex < 0;
        if (redoBtn) redoBtn.disabled = STATE.historyIndex >= STATE.history.length - 1;
    }

    // ==================== SETTINGS PANEL ====================

    function showSettingsPanel() {
        removeSettingsPanel();

        const overlay = document.createElement('div');
        overlay.id = CONFIG.settingsOverlayId;
        overlay.addEventListener('click', removeSettingsPanel);
        document.body.appendChild(overlay);

        const autoSave = !!(STATE.siteSettings[STATE.currentDomain] && STATE.siteSettings[STATE.currentDomain].autoSave);

        const panel = document.createElement('div');
        panel.id = CONFIG.settingsPanelId;
        panel.className = STATE.isDarkMode ? '' : 'light-mode';
        panel.innerHTML =
            '<h3>Accessibility Settings</h3>' +
            '<div class="setting-item"><label>' +
                '<input type="checkbox" id="ate-auto-save" ' + (autoSave ? 'checked' : '') + '>' +
                ' Auto-save settings for this website' +
            '</label></div>' +
            '<div class="setting-item"><label>' +
                '<input type="checkbox" id="ate-show-tooltips" checked>' +
                ' Show button tooltips' +
            '</label></div>' +
            '<div class="setting-item">' +
                '<button id="ate-export" style="width:100%;padding:10px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;">Export Settings</button>' +
            '</div>' +
            '<div class="setting-item">' +
                '<button id="ate-import" style="width:100%;padding:10px;background:#2196F3;color:white;border:none;border-radius:6px;cursor:pointer;">Import Settings</button>' +
            '</div>' +
            '<div class="setting-item">' +
                '<button id="ate-reset" style="width:100%;padding:10px;background:#f44336;color:white;border:none;border-radius:6px;cursor:pointer;">Reset All Enhancements</button>' +
            '</div>' +
            '<button class="close-btn" id="ate-close">Close</button>';

        document.body.appendChild(panel);

        panel.querySelector('#ate-close').addEventListener('click', removeSettingsPanel);
        panel.querySelector('#ate-auto-save').addEventListener('change', (e) => {
            saveSiteSettings({ autoSave: e.target.checked });
        });
        panel.querySelector('#ate-export').addEventListener('click', exportSettings);
        panel.querySelector('#ate-import').addEventListener('click', importSettings);
        panel.querySelector('#ate-reset').addEventListener('click', () => {
            resetAllEnhancements();
            removeSettingsPanel();
        });
    }

    function removeSettingsPanel() {
        const panel = document.getElementById(CONFIG.settingsPanelId);
        const overlay = document.getElementById(CONFIG.settingsOverlayId);
        if (panel) panel.remove();
        if (overlay) overlay.remove();
    }

    function exportSettings() {
        const data = {
            version: '1.1.0',
            exportDate: new Date().toISOString(),
            siteSettings: STATE.siteSettings,
            preferences: { darkMode: STATE.isDarkMode }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'accessibility-settings-' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Settings exported');
    }

    function importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (!data.siteSettings || typeof data.siteSettings !== 'object') throw new Error('Invalid format');
                    STATE.siteSettings = data.siteSettings;
                    if (data.preferences) STATE.isDarkMode = data.preferences.darkMode ?? true;
                    chrome.storage.local.set({ siteSettings: STATE.siteSettings, darkMode: STATE.isDarkMode });
                    showToast('Settings imported successfully');
                    removeSettingsPanel();
                } catch (err) {
                    showToast('Error importing settings: invalid file');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    function toggleToolbarTheme() {
        STATE.isDarkMode = !STATE.isDarkMode;
        chrome.storage.local.set({ darkMode: STATE.isDarkMode });
        const toolbar = document.getElementById(CONFIG.toolbarId);
        if (toolbar) {
            toolbar.className = STATE.isDarkMode ? 'show' : 'light-mode show';
            const themeBtn = toolbar.querySelector('[data-command="toggleTheme"]');
            if (themeBtn) themeBtn.textContent = STATE.isDarkMode ? 'Lt' : 'Dk';
        }
        showToast((STATE.isDarkMode ? 'Dark' : 'Light') + ' mode activated');
    }

    // ==================== TOAST ====================

    function showToast(message) {
        document.querySelectorAll('.accessibility-toast').forEach(t => t.remove());
        const toast = document.createElement('div');
        toast.className = 'accessibility-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 350);
        }, CONFIG.toastDuration);
    }

    // ==================== EVENT LISTENERS ====================

    function setupEventListeners() {
        document.addEventListener('selectionchange', handleSelectionChange);

        document.addEventListener('mousedown', (e) => {
            if (isClickOutsideToolbar(e)) removeToolbar();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { removeToolbar(); removeSettingsPanel(); }
        });

        const reposition = () => {
            const toolbar = document.getElementById(CONFIG.toolbarId);
            if (toolbar && STATE.currentSelection && STATE.currentSelection.rangeCount > 0) {
                positionToolbar(toolbar, STATE.currentSelection.getRangeAt(0));
            }
        };

        window.addEventListener('scroll', reposition, { passive: true });
        window.addEventListener('resize', reposition, { passive: true });
    }

    function handleSelectionChange() {
        if (!STATE.isExtensionEnabled) return;
        STATE.currentSelection = window.getSelection();

        if (STATE.toolbarTimeout) {
            clearTimeout(STATE.toolbarTimeout);
            STATE.toolbarTimeout = null;
        }

        if (!STATE.currentSelection || STATE.currentSelection.toString().trim().length === 0) {
            removeToolbar();
            return;
        }

        if (STATE.currentSelection.rangeCount > 0) {
            const range = STATE.currentSelection.getRangeAt(0);
            if (range.toString().trim().length > 0) {
                STATE.toolbarTimeout = setTimeout(() => {
                    if (STATE.currentSelection && STATE.currentSelection.toString().trim().length > 0) {
                        const toolbar = createToolbar();
                        if (toolbar) positionToolbar(toolbar, range);
                    }
                }, CONFIG.selectionDelay);
            }
        }
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!STATE.isExtensionEnabled) return;

            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                if (document.getElementById(CONFIG.toolbarId)) {
                    e.preventDefault();
                    undo();
                }
            }

            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
                if (document.getElementById(CONFIG.toolbarId)) {
                    e.preventDefault();
                    redo();
                }
            }
        });
    }

    // ==================== BOOT ====================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
