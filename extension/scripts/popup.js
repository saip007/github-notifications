document.addEventListener("DOMContentLoaded", () => {
  try {
    const loginBtn = document.getElementById("login-btn");
    const signoutBtn = document.getElementById("signout-btn");
    const markAllBtn = document.getElementById("mark-all-btn");
    const refreshBtn = document.getElementById("refresh-btn");
    const status = document.getElementById("status");
    const list = document.getElementById("notification-list");

    function setLoggedIn(loggedIn) {
      if (loggedIn) {
        loginBtn.classList.add("hidden");
        signoutBtn.classList.remove("hidden");
      } else {
        loginBtn.classList.remove("hidden");
        signoutBtn.classList.add("hidden");
        if (markAllBtn) markAllBtn.classList.add("hidden");
      }
    }

    function showSkeleton() {
      list.innerHTML = "";
      for (let i = 0; i < 3; i++) {
        const sk = document.createElement("div");
        sk.className = "skeleton";
        list.appendChild(sk);
      }
    }

    function buildNotificationUrl(n) {
      if (!n.subject.url) return "https://github.com/notifications";
      return n.subject.url
        .replace("api.github.com/repos", "github.com")
        .replace("/pulls/", "/pull/")
        .replace("/commits/", "/commit/");
    }

    function getTypeIcon(type) {
      switch (type) {
        case "PullRequest": return "🔃";
        case "Issue":       return "🐞";
        case "Commit":      return "📦";
        case "Release":     return "🏁";
        default:            return "🔔";
      }
    }

    function getTypeBadgeClass(type) {
      switch (type) {
        case "PullRequest": return "type-badge type-pr";
        case "Issue":       return "type-badge type-issue";
        case "Commit":      return "type-badge type-commit";
        case "Release":     return "type-badge type-release";
        default:            return "type-badge";
      }
    }

    function renderNotifications(notifications) {
      list.innerHTML = "";

      if (notifications.length === 0) {
        status.textContent = "📭 No notifications.";
        if (markAllBtn) markAllBtn.classList.add("hidden");
        return;
      }

      status.textContent = "";
      if (markAllBtn) markAllBtn.classList.remove("hidden");

      // Group by repository
      const groups = {};
      notifications.forEach((n) => {
        const repo = n.repository.full_name;
        if (!groups[repo]) groups[repo] = [];
        groups[repo].push(n);
      });

      Object.entries(groups).forEach(([repo, items]) => {
        const details = document.createElement("details");
        details.open = true;
        const summary = document.createElement("summary");
        summary.className = "repo-group-header";
        summary.textContent = `📁 ${repo} (${items.length})`;
        details.appendChild(summary);

        items.forEach((n) => {
          const webUrl = buildNotificationUrl(n);
          const typeIcon = getTypeIcon(n.subject.type);
          const badgeClass = getTypeBadgeClass(n.subject.type);

          const item = document.createElement("div");
          item.className = "notification bg-white p-2 rounded shadow";
          item.dataset.threadId = n.id;

          item.innerHTML = `
            <div class="notification-header">
              <span class="${badgeClass}">${typeIcon} ${n.subject.type}</span>
            </div>
            <a href="${webUrl}" target="_blank" rel="noopener noreferrer">${n.subject.title}</a>
            <button class="mark-read-btn" aria-label="Mark as read" data-thread-id="${n.id}">✓ Mark read</button>
          `;

          item.querySelector(".mark-read-btn").addEventListener("click", (e) => {
            e.preventDefault();
            const threadId = e.currentTarget.dataset.threadId;
            chrome.runtime.sendMessage({ action: "mark-read", threadId }, (res) => {
              if (res?.success) {
                const card = list.querySelector(`[data-thread-id="${threadId}"]`);
                if (card) {
                  const parent = card.parentElement;
                  card.remove();
                  // Remove group if empty
                  if (parent && parent.tagName === "DETAILS" && parent.querySelectorAll(".notification").length === 0) {
                    parent.remove();
                  }
                }
                if (list.querySelectorAll(".notification").length === 0) {
                  status.textContent = "📭 No notifications.";
                  if (markAllBtn) markAllBtn.classList.add("hidden");
                }
              }
            });
          });

          details.appendChild(item);
        });

        list.appendChild(details);
      });
    }

    function fetchNotifications() {
      showSkeleton();
      status.textContent = "📡 Fetching notifications...";
      chrome.runtime.sendMessage({ action: "fetch-notifications" }, (response) => {
        if (!response) {
          status.textContent = "❌ Error fetching notifications.";
          list.innerHTML = "";
          return;
        }
        if (response.unauthorized) {
          setLoggedIn(false);
          status.textContent = "🔐 Token expired. Please login again.";
          list.innerHTML = "";
          return;
        }
        if (!response.success) {
          status.textContent = response.status
            ? `⚠️ Failed to fetch notifications (${response.status})`
            : "❌ Error fetching notifications.";
          list.innerHTML = "";
          return;
        }
        renderNotifications(response.notifications);
      });
    }

    loginBtn.addEventListener("click", () => {
      status.textContent = "🔄 Authenticating with GitHub...";
      chrome.runtime.sendMessage({ action: "start-oauth" }, (response) => {
        if (response?.success) {
          setLoggedIn(true);
          status.textContent = "✅ Logged in! Fetching notifications...";
          fetchNotifications();
        } else {
          setLoggedIn(false);
          status.textContent = "❌ Login failed.";
        }
      });
    });

    signoutBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "signout" }, () => {
        setLoggedIn(false);
        status.textContent = "🔐 Signed out successfully.";
        list.innerHTML = "";
      });
    });

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        fetchNotifications();
      });
      refreshBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") fetchNotifications();
      });
    }

    if (markAllBtn) {
      markAllBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "mark-all-read" }, (res) => {
          if (res?.success) {
            list.innerHTML = "";
            status.textContent = "📭 No notifications.";
            markAllBtn.classList.add("hidden");
          }
        });
      });
    }

    (async () => {
      const { encryptedToken } = await chrome.storage.local.get("encryptedToken");
      if (!encryptedToken) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      fetchNotifications();
    })();
  } catch (err) {
    console.error("Popup error:", err);
    const errCard = document.createElement("div");
    errCard.className = "notification bg-white p-2 rounded shadow";
    errCard.textContent = "⚠️ Something went wrong. Please reload the extension.";
    const list = document.getElementById("notification-list");
    if (list) {
      list.innerHTML = "";
      list.appendChild(errCard);
    }
  }
});
