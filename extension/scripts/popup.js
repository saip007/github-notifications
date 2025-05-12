import { decrypt, getKey } from "./crypto-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const signoutBtn = document.getElementById("signout-btn"); 
  const status = document.getElementById("status");
  const list = document.getElementById("notification-list");

  async function checkLoginStatus() {
    const { encryptedToken } = await chrome.storage.local.get("encryptedToken");
    if (encryptedToken) {
      loginBtn.style.display = "none";
      signoutBtn.style.display = "block";  
    } else {
      loginBtn.style.display = "block";
      signoutBtn.style.display = "none"; 
    }
  }

  loginBtn.addEventListener("click", () => {
    status.textContent = "🔄 Authenticating with GitHub...";
    chrome.runtime.sendMessage({ action: "start-oauth" }, async (response) => {
      if (response?.success && response.token) {
        loginBtn.style.display = "none";
        signoutBtn.style.display = "block";
        status.textContent = "✅ Logged in! Fetching notifications...";
        fetchNotifications(response.token);
      } else {
        loginBtn.style.display = "block";
        signoutBtn.style.display = "none";
        status.textContent = "❌ Login failed.";
      }
    });
  });

  signoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove("encryptedToken", () => {
      chrome.storage.session.remove("githubCryptoKey", () => {
        loginBtn.style.display = "block";
        signoutBtn.style.display = "none";
        status.textContent = "🔐 Signed out successfully.";
        list.innerHTML = "";
      });
    });
  });

  (async () => {
    await checkLoginStatus(); 
    const { encryptedToken } = await chrome.storage.local.get("encryptedToken");
    if (!encryptedToken) {
      return;
    }

    const key = await getKey();
    if (!key) {
      loginBtn.style.display = "block";
      signoutBtn.style.display = "none";
      status.textContent = "🔐 Login session expired.";
      return;
    }

    try {
      const token = await decrypt(encryptedToken, key);
      loginBtn.style.display = "none";
      signoutBtn.style.display = "block";
      status.textContent = "📡 Fetching notifications...";
      fetchNotifications(token);
    } catch (err) {
      console.error("Decryption failed:", err);
      loginBtn.style.display = "block";
      signoutBtn.style.display = "none";
      status.textContent = "⚠️ Decryption failed.";
    }
  })();

  async function fetchNotifications(token) {
    try {
      const res = await fetch("https://api.github.com/notifications", {
        headers: { Authorization: `token ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Access token expired or revoked.");
          status.textContent = "🔐 Token expired. Please login again.";
          loginBtn.style.display = "block";
          signoutBtn.style.display = "none";
          await chrome.storage.local.remove("encryptedToken");
          await chrome.storage.session.remove("githubCryptoKey");
        } else {
          status.textContent = `⚠️ Failed to fetch notifications (${res.status})`;
        }
        return;
      }

      const notifications = await res.json();
      list.innerHTML = "";

      if (notifications.length === 0) {
        status.textContent = "📭 No notifications.";
        return;
      }

      status.textContent = "";

      notifications.forEach((n) => {
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

        list.appendChild(item);
      });
    } catch (err) {
      console.error("Fetch error:", err);
      loginBtn.style.display = "block";
      signoutBtn.style.display = "none";
      status.textContent = "❌ Error fetching notifications.";
    }
  }
});
