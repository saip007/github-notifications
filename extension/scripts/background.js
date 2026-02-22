import { generateKey, encrypt, decrypt, getKey } from "./crypto-utils.js";

const ALARM_NAME = "github-notifications-poll";
const POLL_INTERVAL_MINUTES = 5;

async function getStoredToken() {
  const { encryptedToken } = await chrome.storage.local.get("encryptedToken");
  if (!encryptedToken) return null;
  const key = await getKey();
  if (!key) return null;
  try {
    return await decrypt(encryptedToken, key);
  } catch {
    return null;
  }
}

async function updateBadge() {
  const token = await getStoredToken();
  if (!token) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  try {
    const res = await fetch("https://api.github.com/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      await chrome.storage.local.remove("encryptedToken");
      await chrome.storage.session.remove("githubCryptoKey");
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    if (!res.ok) return;

    const notifications = await res.json();
    const count = notifications.length;

    if (count === 0) {
      chrome.action.setBadgeText({ text: "" });
    } else {
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: "#d32f2f" });
    }
  } catch (err) {
    console.error("Badge update failed:", err);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    updateBadge();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: POLL_INTERVAL_MINUTES });
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

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

        updateBadge();
        sendResponse({ success: true, token: access_token });
      } catch (err) {
        console.error("OAuth failed:", err);
        sendResponse({ success: false });
      }
    });

    return true;
  }

  if (msg.action === "signout") {
    chrome.storage.local.remove("encryptedToken", () => {
      chrome.storage.session.remove("githubCryptoKey", () => {
        chrome.action.setBadgeText({ text: "" });
        sendResponse({ success: true });
      });
    });

    return true;
  }

  if (msg.action === "fetch-notifications") {
    (async () => {
      const token = await getStoredToken();
      if (!token) {
        sendResponse({ success: false, notifications: [] });
        return;
      }

      try {
        const res = await fetch("https://api.github.com/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          await chrome.storage.local.remove("encryptedToken");
          await chrome.storage.session.remove("githubCryptoKey");
          sendResponse({ success: false, unauthorized: true, notifications: [] });
          return;
        }

        if (!res.ok) {
          sendResponse({ success: false, status: res.status, notifications: [] });
          return;
        }

        const notifications = await res.json();
        const count = notifications.length;
        if (count === 0) {
          chrome.action.setBadgeText({ text: "" });
        } else {
          chrome.action.setBadgeText({ text: String(count) });
          chrome.action.setBadgeBackgroundColor({ color: "#d32f2f" });
        }
        sendResponse({ success: true, notifications });
      } catch (err) {
        console.error("fetch-notifications error:", err);
        sendResponse({ success: false, notifications: [] });
      }
    })();

    return true;
  }

  if (msg.action === "mark-read") {
    (async () => {
      const token = await getStoredToken();
      if (!token || !msg.threadId) {
        sendResponse({ success: false });
        return;
      }

      try {
        const res = await fetch(`https://api.github.com/notifications/threads/${msg.threadId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        });
        sendResponse({ success: res.ok });
      } catch (err) {
        console.error("mark-read error:", err);
        sendResponse({ success: false });
      }
    })();

    return true;
  }

  if (msg.action === "mark-all-read") {
    (async () => {
      const token = await getStoredToken();
      if (!token) {
        sendResponse({ success: false });
        return;
      }

      try {
        const res = await fetch("https://api.github.com/notifications", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Length": "0"
          }
        });
        chrome.action.setBadgeText({ text: "" });
        sendResponse({ success: res.ok });
      } catch (err) {
        console.error("mark-all-read error:", err);
        sendResponse({ success: false });
      }
    })();

    return true;
  }
});
