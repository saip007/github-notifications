chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "github-login") {
    console.log("Login trigger received in background (to be wired)");
    sendResponse({ error: "OAuth not yet connected" });
  }
});
