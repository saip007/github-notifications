

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const status = document.getElementById("status");

  loginBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "github-login" }, (response) => {
      if (response?.token) {
        status.textContent = "✅ Logged in!";
        // Next: fetch notifications and show them
      } else {
        status.textContent = "❌ Login failed or canceled.";
        console.error("Auth error:", response?.error);
      }
    });
  });
});
