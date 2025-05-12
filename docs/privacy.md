# Privacy Policy

**Last updated: May 12, 2025**

## Introduction  
GitHub Notifications (“we”, “us”, or “our”) is a lightweight Chrome extension designed to surface your GitHub pull requests, issues, comments, and mentions in a single click. This Privacy Policy explains what information we collect, how we use it, and your choices regarding that information.

## Information We Collect  
We limit data collection to only what’s necessary to deliver the core functionality—no more, no less.

### 1. Authentication Information  
- **OAuth Access Token**  
  - Obtained via Chrome’s `identity` API when you sign in with GitHub.  
  - Stored securely in `chrome.storage.local`.  
  - Used only to authenticate requests to the GitHub API.  

### 2. Basic GitHub Profile Data  
- **Username, User ID, Avatar URL**  
  - Retrieved under the `read:user` OAuth scope.  
  - Used solely to personalize your extension experience (e.g., showing your avatar).

### 3. Notification Payloads  
- **Issue titles, PR titles, comment snippets, @mentions**  
  - Fetched as JSON from `https://api.github.com/notifications`.  
  - Displayed only within the extension popup.  

## How We Use Your Information  
- **Authentication**: Verify your identity and authorize API calls.  
- **Display**: Render your GitHub notifications and profile info in the popup.  
- **Configuration**: Remember your settings for a seamless experience.

## Data Sharing & Disclosure  
- We do **not** sell, rent, or share your data with any third parties.  
- We do **not** use your data for advertising, analytics, or any purpose beyond the extension’s single purpose.  
- API requests go directly to GitHub’s servers (and an optional CORS proxy you configure); we do not proxy or log your data on our own servers.

## Data Retention  
- **Local Storage**: OAuth token and preferences remain until you uninstall the extension or explicitly clear storage.  
- **In-Memory**: Notification payloads are fetched on-demand and never persist beyond the active browser session.

## Data Security  
- All code (JavaScript, HTML, CSS) ships within the extension—no remote code is ever executed at runtime.  
- OAuth tokens and preferences are stored in Chrome’s secure extension storage.  
- We request the minimum permissions needed and justify each in our listing.

## Third-Party Services  
- **GitHub API** (`api.github.com`): to fetch notifications and profile data.  


## Children’s Privacy  
This extension is not intended for use by children under 13. We do not knowingly collect information from minors.

## Changes to This Policy  
We may update this policy to reflect changes in functionality or legal requirements. When we do, we will revise the “Last updated” date. Your continued use constitutes acceptance of any changes.

## Contact Us  
If you have questions or concerns about this Privacy Policy, please email us at:  
**saip4622@outlook.com**
