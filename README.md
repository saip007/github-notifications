# GitHub Notifications Browser Extension

## Overview
The GitHub Notifications Browser Extension surfaces your GitHub notifications in a compact popup. It uses GitHub OAuth to authenticate, fetches notifications from the GitHub API, and keeps your access token encrypted in browser storage so that only the extension can read it.

## Status

- **Chrome:** ✅ Supported
- **Brave:** ✅ Supported
- **Firefox:** ⚠️ _comming soon_

## Features

- **Secure OAuth Login:** Uses a Cloudflare Worker to exchange the OAuth code for an access token and AES‑GCM to encrypt it in local storage.
- **Real‑Time Notifications:** Fetches the latest notifications with the GitHub API and displays them with repository names and context‑specific icons.
- **Direct Links:** Clicking a notification opens the related issue, pull request, commit, or release on GitHub in a new tab.
- **Sign‑Out Support:** Easily revoke local credentials and clear stored keys from the extension.

## Architecture

The project consists of two parts:

1. **Browser Extension** (Manifest V3) – background service worker, popup UI, and scripts under `extension/`.
2. **OAuth Service** – a Cloudflare Worker located in `service/` that exchanges OAuth authorization codes for access tokens.

## Installation

### Extension (Chrome/Brave)

1. Clone or download this repository.
2. Open `chrome://extensions/` or `brave://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `extension/` directory.

### OAuth Service (optional)

The extension expects an endpoint that trades an OAuth code for an access token. A ready-made Cloudflare Worker is included:

1. `cd service`
2. `npm install`
3. `npm run dev` to start a local worker or `npm run deploy` to publish it to Cloudflare.

## Usage

1. Click the extension icon.
2. Press **Sign in with GitHub** to start the OAuth flow.
3. After authorization, your notifications appear in the popup as clickable links.
4. Use **Sign out** to clear the encrypted token from local storage.

## Privacy

See [docs/privacy.md](docs/privacy.md) for details on what data is stored and how it is used.

## Development

To customize or extend the project:

1. Modify the browser extension sources in `extension/`.
2. Adjust the Cloudflare Worker in `service/` if you need different OAuth behavior.
3. Test your changes locally.
4. Commit your changes and push to your GitHub repository.

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

## Comming Soon

- Firefox support
- Mark notifications as read
- Advanced filtering options

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Credits

This extension utilizes the GitHub API and browser extension APIs to provide a seamless experience for users.
