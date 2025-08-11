# GitHub Notifications Browser Extension

## Overview

This project bundles a lightweight browser extension and a minimal Cloudflare Worker service.
The extension displays your GitHub notifications from within the browser, while the worker in
`service/` exchanges OAuth codes for access tokens so secrets never live in the extension.
Tokens are encrypted with AES‑GCM before they are stored locally.

## Browser support

- **Chrome:** ✅
- **Brave:** `comming soon`
- **Firefox:** `comming soon`

## Features

- **OAuth sign‑in:** Authenticate with GitHub through the worker service.
- **Encrypted token storage:** Access tokens are encrypted via WebCrypto and removed on sign out.
- **Notification display:** Presents unread notifications with icons and direct links to GitHub.
- **Manual refresh:** Reload notifications from the popup when needed.

## Installation

### Chrome

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the extension directory.

### Brave

1. Clone or download this repository.
2. Open Brave and navigate to `brave://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the extension directory.

## Usage

- Click on the extension icon to view your GitHub notifications.
- Notifications are displayed with clickable links for easy navigation to GitHub pages.

## Development

### Extension

1. Modify the files under `extension/` (`manifest.json`, scripts, styles and popup markup`).
2. Load the unpacked extension in your browser for quick testing.

### Service

1. `cd service`
2. Run `npx vitest --run` to execute the test suite.
3. Use `npm run dev` to start the Cloudflare Worker locally with Wrangler.

## Comming Soon

- Brave and Firefox builds
- Options for adjusting refresh intervals and notification filters

## Contribution

Contributions are welcome! If you find any issues or want to suggest enhancements, please:
- Fork this repository
- Create a new branch (`git checkout -b feature`)
- Make changes and commit (`git commit -am 'Add feature'`)
- Push to the branch (`git push origin feature`)
- Create a pull request

Contribution Guidelines:

- Please ensure that changes follow best practices for accessibility and usability.
- Submit PRs with detailed descriptions of the changes made.
- Ensure all PRs are tested and do not break existing functionality.

Looking forward to your contributions during Hacktoberfest!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Credits

This extension utilizes the GitHub API and browser extension APIs to provide a seamless experience for users.
