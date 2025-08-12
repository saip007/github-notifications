"use strict";

import { decrypt, getKey, clearKey } from "./crypto-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const ui = {
    loginBtn: document.getElementById("login-btn"),
    signoutBtn: document.getElementById("signout-btn"),
    status: document.getElementById("status"),
    list: document.getElementById("notification-list"),
  };

  async function updateLoginUI() {
    const { encryptedToken } = await chrome.storage.local.get("encryptedToken");
    ui.loginBtn.style.display = encryptedToken ? "none" : "block";
    ui.signoutBtn.style.display = encryptedToken ? "block" : "none";
  }

  ui.loginBtn.addEventListener("click", async () => {
    ui.status.textContent = "🔄 Authenticating with GitHub...";
    chrome.runtime.sendMessage({ action: "start-oauth" }, async (response) => {
      if (response?.success && response.token) {
        ui.status.textContent = "✅ Logged in! Fetching notifications...";
        await updateLoginUI();
        fetchNotifications(response.token);
      } else {
        ui.status.textContent = "❌ Login failed.";
        await updateLoginUI();
      }
    });
  });

  ui.signoutBtn.addEventListener("click", async () => {
    await chrome.storage.local.remove("encryptedToken");
    await clearKey();
    ui.list.innerHTML = "";
    ui.status.textContent = "🔐 Signed out successfully.";
    await updateLoginUI();
  });

  (async () => {
    await updateLoginUI();
    const { encryptedToken } = await chrome.storage.local.get("encryptedToken");
    if (!encryptedToken) return;

    const key = await getKey();
    if (!key) {
      ui.status.textContent = "🔐 Login session expired.";
      await updateLoginUI();
      return;
    }

    try {
      const token = await decrypt(encryptedToken, key);
      ui.status.textContent = "📡 Fetching notifications...";
      fetchNotifications(token);
    } catch (err) {
      console.error("Decryption failed:", err);
      ui.status.textContent = "⚠️ Decryption failed.";
      await updateLoginUI();
    }
  })();

  async function fetchNotifications(token) {
    try {
      const res = await fetch("https://api.github.com/notifications", {
        headers: { Authorization: `token ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Access token expired or revoked.");
          ui.status.textContent = "🔐 Token expired. Please login again.";
          await chrome.storage.local.remove("encryptedToken");
          await clearKey();
          await updateLoginUI();
        } else {
          ui.status.textContent = `⚠️ Failed to fetch notifications (${res.status})`;
        }
        return;
      }

      const notifications = await res.json();
      ui.list.innerHTML = "";

      if (notifications.length === 0) {
        ui.status.textContent = "📭 No notifications.";
        return;
      }

      ui.status.textContent = "";

      for (const n of notifications) {
        const item = document.createElement("div");
        item.className = "notification bg-white p-2 rounded shadow";

        let webUrl = "https://github.com/notifications";
        if (n.subject.url) {
          webUrl = n.subject.url
            .replace("api.github.com/repos", "github.com")
            .replace("/pulls/", "/pull/")
            .replace("/issues/", "/issues/")
            .replace("/commits/", "/commit/");
        }

        let typeIcon = "🔔";
        switch (n.subject.type) {
          case "PullRequest": typeIcon = "🔃"; break;
          case "Issue":       typeIcon = "🐞"; break;
          case "Commit":      typeIcon = "📦"; break;
          case "Release":     typeIcon = "🏁"; break;
        }

        item.innerHTML = `
          <strong>${typeIcon} ${n.repository.full_name}</strong><br/>
          <a href="${webUrl}" target="_blank" rel="noopener noreferrer">${n.subject.title}</a>
        `;

        ui.list.appendChild(item);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      ui.status.textContent = "❌ Error fetching notifications.";
      await updateLoginUI();
    }
  }
});
