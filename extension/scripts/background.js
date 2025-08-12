"use strict";

import { generateKey, encrypt, clearKey } from "./crypto-utils.js";

const CLIENT_ID = "Ov23liiB4QYeeqkkv09r";
const SERVICE_URL = "https://service.saiprashanth0528.workers.dev/";
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ success: false });
    return false;
  }

  switch (msg.action) {
    case "start-oauth":
      handleOAuth(sendResponse);
      return true;
    case "signout":
      handleSignOut(sendResponse);
      return true;
    default:
      sendResponse({ success: false });
      return false;
  }
});

function handleOAuth(sendResponse) {
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=notifications`;

  chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (redirectUrl) => {
    if (chrome.runtime.lastError || !redirectUrl) {
      sendResponse({ success: false });
      return;
    }

    const code = new URL(redirectUrl).searchParams.get("code");
    if (!code) {
      sendResponse({ success: false });
      return;
    }

    try {
      const res = await fetch(SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });

      const { access_token: token } = await res.json();
      if (!token) throw new Error("No token");

      const key = await generateKey();
      const encrypted = await encrypt(token, key);
      await chrome.storage.local.set({ encryptedToken: encrypted });

      sendResponse({ success: true, token });
    } catch (err) {
      console.error("OAuth failed:", err);
      sendResponse({ success: false });
    }
  });
}

async function handleSignOut(sendResponse) {
  try {
    await chrome.storage.local.remove("encryptedToken");
    await clearKey();
    sendResponse({ success: true });
  } catch (err) {
    console.error("Signout failed:", err);
    sendResponse({ success: false });
  }
}
