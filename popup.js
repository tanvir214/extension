document.getElementById("toggleHelper").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Check if the content script is already injected by trying to send a message.
    // If it fails, inject the script.
    chrome.tabs.sendMessage(tab.id, { action: "ping" }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not injected yet.
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        }, () => {
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ["style.css"],
          }, () => {
            // After injecting, send the toggle message.
            chrome.tabs.sendMessage(tab.id, { action: "toggle" });
          });
        });
      } else {
        // Content script is already there, just send the toggle message.
        chrome.tabs.sendMessage(tab.id, { action: "toggle" });
      }
    });

    window.close();
  } catch (error) {
    console.error("Error:", error);
    alert("Error: " + error.message);
  }
});

