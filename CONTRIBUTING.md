# Contributing to AI Accessibility Enhancer

First off, thank you for considering contributing to AI Accessibility Enhancer! It's people like you that make the web more accessible for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to accessibility and inclusivity. By participating, you are expected to uphold this code. Please report unacceptable behavior to [your-email@example.com].

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 10, macOS 12.0]
 - Browser: [e.g. Chrome 120, Edge 120]
 - Extension Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List some examples** of how this enhancement would be used
- **Specify which version** you're using

### Your First Code Contribution

Unsure where to begin? You can start by looking through these beginner and help-wanted issues:

- `good-first-issue` - issues which should only require a few lines of code
- `help-wanted` - issues which should be a bit more involved than beginner issues

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code follows the existing style
4. Update the README.md with details of changes if needed
5. The PR will be merged once you have the sign-off of the maintainer

## Development Setup

### Prerequisites

- Chrome/Chromium browser (v88+)
- Git
- Text editor (VS Code recommended)
- Basic knowledge of JavaScript and Chrome Extension APIs

### Setting Up Your Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR-USERNAME/accessibility-text-enhancer.git
   cd accessibility-text-enhancer
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Load Extension**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

4. **Make Changes**
   - Edit files in your preferred editor
   - The extension will auto-reload on content script changes
   - For other changes, click the reload icon in `chrome://extensions/`

5. **Test Thoroughly**
   - Test on multiple websites
   - Verify keyboard shortcuts work
   - Check for console errors
   - Test with different screen sizes

## Coding Standards

### JavaScript Style Guide

We follow modern ES6+ JavaScript conventions:

```javascript
// ✅ Good
const handleClick = (event) => {
    event.preventDefault();
    // Implementation
};

// ❌ Bad
var handleClick = function(event) {
    event.preventDefault();
}
```

### Key Principles

1. **Use Descriptive Names**
   ```javascript
   // ✅ Good
   const calculateContrastRatio = (foreground, background) => { ... }
   
   // ❌ Bad
   const calc = (fg, bg) => { ... }
   ```

2. **Add Comments for Complex Logic**
   ```javascript
   /**
    * Calculates WCAG 2.0 contrast ratio
    * @param {string} color1 - RGB color string
    * @param {string} color2 - RGB color string
    * @returns {number} Contrast ratio (1-21)
    */
   function calculateContrast(color1, color2) {
       // Implementation
   }
   ```

3. **Keep Functions Small and Focused**
   - Each function should do one thing well
   - Aim for < 50 lines per function
   - Extract complex logic into helper functions

4. **Use Modern JavaScript Features**
   - Prefer `const` and `let` over `var`
   - Use arrow functions where appropriate
   - Use template literals for string interpolation
   - Use destructuring for cleaner code

5. **Error Handling**
   ```javascript
   try {
       const result = await riskyOperation();
       handleSuccess(result);
   } catch (error) {
       console.error('Operation failed:', error);
       showToast('An error occurred');
   }
   ```

### CSS Style Guide

```css
/* ✅ Good: Clear, organized, commented */
.accessibility-toolbar {
    /* Layout */
    display: flex;
    gap: 8px;
    
    /* Positioning */
    position: fixed;
    z-index: 2147483647;
    
    /* Visual */
    background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
    border-radius: 12px;
}

/* ❌ Bad: Unorganized, no comments */
.accessibility-toolbar {
    z-index: 2147483647;
    display: flex;
    background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
    position: fixed;
    border-radius: 12px;
    gap: 8px;
}
```

### File Organization

```
project/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── popup/
│   ├── popup.html        # Popup UI
│   └── popup.js          # Popup logic
├── content-scripts/
│   ├── content.js        # Main enhancement engine
│   └── content.css       # Toolbar styling
└── icons/                # Extension icons
```

## Commit Guidelines

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(toolbar): add undo/redo functionality

Implement history tracking for all enhancements with keyboard shortcuts.
Users can now undo (Ctrl+Z) and redo (Ctrl+Y) changes.

Closes #123
```

```bash
fix(contrast): improve contrast calculation accuracy

The previous implementation only checked text color brightness.
Now analyzes both foreground and background colors for accurate
WCAG compliance.

Fixes #456
```

```bash
docs(readme): update installation instructions

Add detailed steps for manual installation and troubleshooting.
```

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Comments added for complex logic
- [ ] No console.log statements (use proper logging)
- [ ] Tested on multiple websites
- [ ] No breaking changes (or clearly documented if unavoidable)
- [ ] Documentation updated if needed

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
Describe the tests you ran and how to reproduce them

## Screenshots (if applicable)
Add screenshots showing the changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested on multiple websites
```

### Review Process

1. A maintainer will review your PR within 7 days
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release!

## Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Given our heartfelt thanks for making the web more accessible! 🎉

## Questions?

Feel free to open an issue with the `question` label, or reach out via:
- GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make the web accessible for everyone!** ♿