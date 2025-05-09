import { generateKey, encrypt } from "./crypto-utils.js";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "start-oauth") {
    const clientId = "Ov23liiB4QYeeqkkv09r";
    const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=notifications`;

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        sendResponse({ success: false });
        return;
      }

      const code = new URL(redirectUrl).searchParams.get("code");

      try {
        const res = await fetch("https://service.saiprashanth0528.workers.dev/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code })
        });

        const { access_token } = await res.json();
        if (!access_token) throw new Error("No token");

        const key = await generateKey();
        const encrypted = await encrypt(access_token, key);
        await chrome.storage.local.set({ encryptedToken: encrypted });

        sendResponse({ success: true, token: access_token });
      } catch (err) {
        console.error("OAuth failed:", err);
        sendResponse({ success: false });
      }
    });

    return true;
  }
});
