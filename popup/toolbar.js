// popup/toolbar.js

// Event listener for Bold button
document.getElementById('boldBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "enhanceSelection", command: "bold" });
});

// Event listener for Highlight button
document.getElementById('highlightBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "enhanceSelection", command: "highlight" });
});

// Event listener for Decrease Font Size button
document.getElementById('sizeDownBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "enhanceSelection", command: "sizeDown" });
});

// Event listener for Increase Font Size button
document.getElementById('sizeUpBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "enhanceSelection", command: "sizeUp" });
});

// Event listener for Font Style Toggle button
document.getElementById('fontStyleBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "enhanceSelection", command: "fontStyle" });
});

// Event listener for Text Spacing button
document.getElementById('spacingBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "enhanceSelection", command: "spacing" });
});

// Event listener for Contrast Fixer button
document.getElementById('contrastBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "enhanceSelection", command: "contrast" });
});

// Event listener for Read Aloud button
document.getElementById('readAloudBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "enhanceSelection", command: "readAloud" });
});