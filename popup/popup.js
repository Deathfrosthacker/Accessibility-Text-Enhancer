// popup/popup.js - Enhanced version with full accessibility features

document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('toggle');
    const statusDiv = document.getElementById('status');
    const enhancementCount = document.getElementById('enhancementCount');
    const currentDomain = document.getElementById('currentDomain');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Get current tab information
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            const url = new URL(tabs[0].url);
            currentDomain.textContent = url.hostname || 'N/A';
        }
    });

    // Retrieve and apply saved extension state
    chrome.storage.local.get([
        'extensionEnabled', 
        'sessionStats',
        'globalSettings',
        'siteSettings'
    ], function(result) {
        const isEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
        toggle.checked = isEnabled;
        updateStatus(isEnabled);

        if (result.sessionStats) {
            enhancementCount.textContent = result.sessionStats.totalEnhancements || 0;
        }

        // Load global settings
        loadGlobalSettings(result.globalSettings || {});
        loadSiteSettings(result.siteSettings || {});
    });

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    function switchTab(tabName) {
        // Update buttons
        tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    // Handle main toggle
    toggle.addEventListener('change', function() {
        const isEnabled = this.checked;
        updateStatus(isEnabled);
        chrome.storage.local.set({ extensionEnabled: isEnabled });

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "setEnabled",
                    value: isEnabled
                }).catch(err => console.log('Content script not ready'));
            }
        });
    });

    function updateStatus(isEnabled) {
        statusDiv.textContent = isEnabled ? '✓ Active' : '✗ Disabled';
        statusDiv.style.background = isEnabled 
            ? 'rgba(76, 175, 80, 0.3)' 
            : 'rgba(244, 67, 54, 0.3)';
    }

    // Load global settings
    function loadGlobalSettings(settings) {
        document.getElementById('autoSave').checked = settings.autoSave !== false;
        document.getElementById('syncAcrossTab').checked = settings.syncAcrossTabs || false;
        document.getElementById('darkMode').checked = settings.darkMode || false;
        document.getElementById('reduceAnimations').checked = settings.reduceAnimations || false;
    }

    // Load site settings
    function loadSiteSettings(siteSettings) {
        const currentDomain = new URL(chrome.runtime.getURL('')).hostname;
        const settings = siteSettings[currentDomain] || {};

        document.getElementById('fontSize').value = settings.fontSize || 100;
        document.getElementById('lineHeight').value = settings.lineHeight || 1.5;
        document.getElementById('letterSpacing').value = settings.letterSpacing || 0;
        document.getElementById('fontFamily').value = settings.fontFamily || 'inherit';
        document.getElementById('boldText').checked = settings.boldText || false;
        document.getElementById('underlineLinks').checked = settings.underlineLinks || false;
        document.getElementById('contrast').value = settings.contrast || 'normal';
        document.getElementById('colorBlindnessFilter').value = settings.colorBlindnessFilter || 'none';
        document.getElementById('highlightLinks').checked = settings.highlightLinks || false;
        document.getElementById('textToSpeech').checked = settings.textToSpeech || false;

        updateSliderValues();
    }

    // Update slider display values
    function updateSliderValues() {
        document.getElementById('fontSizeValue').textContent = document.getElementById('fontSize').value;
        document.getElementById('lineHeightValue').textContent = document.getElementById('lineHeight').value;
        document.getElementById('letterSpacingValue').textContent = document.getElementById('letterSpacing').value;
    }

    // Slider change listeners
    document.getElementById('fontSize').addEventListener('input', function() {
        document.getElementById('fontSizeValue').textContent = this.value;
        applySettings();
    });

    document.getElementById('lineHeight').addEventListener('input', function() {
        document.getElementById('lineHeightValue').textContent = this.value;
        applySettings();
    });

    document.getElementById('letterSpacing').addEventListener('input', function() {
        document.getElementById('letterSpacingValue').textContent = this.value;
        applySettings();
    });

    // Select and checkbox change listeners
    ['fontFamily', 'boldText', 'underlineLinks', 'contrast', 'colorBlindnessFilter', 'highlightLinks', 'textToSpeech', 'darkMode', 'reduceAnimations'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applySettings);
        }
    });

    // Apply current settings
    function applySettings() {
        const settings = {
            fontSize: document.getElementById('fontSize').value,
            lineHeight: document.getElementById('lineHeight').value,
            letterSpacing: document.getElementById('letterSpacing').value,
            fontFamily: document.getElementById('fontFamily').value,
            boldText: document.getElementById('boldText').checked,
            underlineLinks: document.getElementById('underlineLinks').checked,
            contrast: document.getElementById('contrast').value,
            colorBlindnessFilter: document.getElementById('colorBlindnessFilter').value,
            highlightLinks: document.getElementById('highlightLinks').checked,
            textToSpeech: document.getElementById('textToSpeech').checked,
            darkMode: document.getElementById('darkMode').checked,
            reduceAnimations: document.getElementById('reduceAnimations').checked
        };

        // Save settings
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "applySettings",
                    settings: settings
                }).catch(err => console.log('Content script not ready'));
            }
        });

        saveSiteSettings(settings);
    }

    // Save site-specific settings
    function saveSiteSettings(settings) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                const url = new URL(tabs[0].url);
                const domain = url.hostname;

                chrome.storage.local.get(['siteSettings'], function(result) {
                    const siteSettings = result.siteSettings || {};
                    siteSettings[domain] = settings;
                    chrome.storage.local.set({ siteSettings: siteSettings });
                });
            }
        });
    }

    // Preset buttons
    document.getElementById('preset-reading').addEventListener('click', function() {
        applyPreset('reading');
    });

    document.getElementById('preset-dyslexia').addEventListener('click', function() {
        applyPreset('dyslexia');
    });

    document.getElementById('preset-high-contrast').addEventListener('click', function() {
        applyPreset('highContrast');
    });

    document.getElementById('preset-focus').addEventListener('click', function() {
        applyPreset('focus');
    });

    function applyPreset(presetName) {
        const presets = {
            reading: {
                fontSize: 120,
                lineHeight: 1.8,
                letterSpacing: 1,
                fontFamily: 'Georgia, serif',
                boldText: false,
                contrast: 'high',
                colorBlindnessFilter: 'none',
                darkMode: true,
                reduceAnimations: true
            },
            dyslexia: {
                fontSize: 130,
                lineHeight: 2,
                letterSpacing: 2,
                fontFamily: "'OpenDyslexic', sans-serif",
                boldText: true,
                contrast: 'high',
                colorBlindnessFilter: 'none',
                darkMode: true,
                reduceAnimations: true
            },
            highContrast: {
                fontSize: 110,
                lineHeight: 1.6,
                letterSpacing: 1,
                fontFamily: 'Arial, sans-serif',
                boldText: true,
                contrast: 'very-high',
                colorBlindnessFilter: 'none',
                darkMode: true,
                highlightLinks: true
            },
            focus: {
                fontSize: 115,
                lineHeight: 1.7,
                letterSpacing: 0.5,
                fontFamily: 'Arial, sans-serif',
                boldText: false,
                contrast: 'high',
                colorBlindnessFilter: 'none',
                darkMode: false,
                reduceAnimations: true
            }
        };

        const preset = presets[presetName];
        Object.assign(preset, {
            boldText: preset.boldText,
            underlineLinks: false,
            textToSpeech: false
        });

        // Update UI
        document.getElementById('fontSize').value = preset.fontSize;
        document.getElementById('lineHeight').value = preset.lineHeight;
        document.getElementById('letterSpacing').value = preset.letterSpacing;
        document.getElementById('fontFamily').value = preset.fontFamily;
        document.getElementById('boldText').checked = preset.boldText;
        document.getElementById('contrast').value = preset.contrast;
        document.getElementById('colorBlindnessFilter').value = preset.colorBlindnessFilter;
        document.getElementById('darkMode').checked = preset.darkMode;
        document.getElementById('reduceAnimations').checked = preset.reduceAnimations;
        document.getElementById('highlightLinks').checked = preset.highlightLinks;

        updateSliderValues();
        applySettings();
    }

    // Apply to entire page button
    document.getElementById('apply-page-wide').addEventListener('click', function() {
        applySettings();
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "applyPageWide"
                }).catch(err => console.log('Content script not ready'));
            }
        });
    });

    // Reset all button
    document.getElementById('reset-page').addEventListener('click', function() {
        if (confirm('Reset all accessibility enhancements for this page?')) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "resetAll"
                    }).catch(err => console.log('Content script not ready'));
                }
            });
        }
    });

    // Export settings
    document.getElementById('export-settings').addEventListener('click', function() {
        chrome.storage.local.get(null, function(data) {
            const exportData = {
                version: '2.0.0',
                exportDate: new Date().toISOString(),
                globalSettings: data.globalSettings,
                siteSettings: data.siteSettings
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `accessibility-settings-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    });

    // Import settings
    document.getElementById('import-settings').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    chrome.storage.local.set({
                        globalSettings: importedData.globalSettings,
                        siteSettings: importedData.siteSettings
                    }, function() {
                        alert('Settings imported successfully!');
                        location.reload();
                    });
                } catch (error) {
                    alert('Error importing settings: ' + error.message);
                }
            };
            reader.readAsText(file);
        });

        input.click();
    });

    // Clear all settings
    document.getElementById('clear-all-settings').addEventListener('click', function() {
        if (confirm('This will delete ALL accessibility settings and presets. Are you sure?')) {
            chrome.storage.local.clear(function() {
                alert('All data cleared!');
                location.reload();
            });
        }
    });

    // Listen for stat updates
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (changes.sessionStats) {
            const stats = changes.sessionStats.newValue;
            if (stats) {
                enhancementCount.textContent = stats.totalEnhancements || 0;
            }
        }
    });
});