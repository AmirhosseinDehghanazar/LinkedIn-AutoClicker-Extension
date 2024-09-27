document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const delayInput = document.getElementById("delay");
  const maxClicksInput = document.getElementById("maxClicks");
  const statusMessage = document.getElementById("statusMessage");

  // Start the clicking process
  startBtn.addEventListener("click", () => {
    const delay = parseInt(delayInput.value);
    const maxClicks = parseInt(maxClicksInput.value);

    // Send a message to the background script to start the process
    chrome.runtime.sendMessage({
      action: "startClicking",
      delay: delay,
      maxClicks: maxClicks,
    });

    // Update UI
  });

  // Stop the clicking process
  stopBtn.addEventListener("click", () => {
    // Send a message to the background script to stop the process
    chrome.runtime.sendMessage({ action: "stopClicking" });

    // Update UI
    statusMessage.textContent = "Auto-clicking paused.";
    stopBtn.style.display = "none";
    startBtn.style.display = "inline";
  });

  // Listen for error messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "noButtonsFound") {
      statusMessage.textContent = "Error: No invite buttons found on the page.";
    }
  });
});
