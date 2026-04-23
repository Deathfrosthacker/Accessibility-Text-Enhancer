# Releasing Accessibility Text Enhancer

This project uses GitHub Actions to package the extension and attach a ZIP file to each GitHub release.

## Create a release

1. Update `manifest.json` with the new version number.
2. Commit the change to `main`.
3. Create and push a matching Git tag, for example:

```bash
git tag v1.0.1
git push origin v1.0.1
```

4. Open the GitHub repository's Releases page.
5. Publish a new release for that tag.

When the release is published, the workflow will:

- copy the extension files into a clean package directory
- create `accessibility-text-enhancer-v<version>.zip`
- upload the ZIP file to the GitHub release assets

## Manual packaging

The workflow can also be run manually from the GitHub Actions tab with an optional version override.

## What gets packaged

The release ZIP includes:

- `manifest.json`
- `background.js`
- `content-scripts/`
- `popup/`
- `icons/`

Project-only files such as `.github/`, `docs/`, and Markdown documentation are not included in the extension package.
