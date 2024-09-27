let isStopped = false;

// Inject content script when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"], // Inject content script if necessary
  });
});

// Listen for start/stop messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startClicking") {
    isStopped = false; // Reset stop state

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        // Ensure tabs array is not empty
        const currentTab = tabs[0];
        const targetUrl = "https://www.linkedin.com/mynetwork/grow/";

        // Check if the user is on the correct page
        if (!currentTab.url || !currentTab.url.startsWith(targetUrl)) {
          // Redirect the user to the correct LinkedIn page
          chrome.tabs.update(currentTab.id, { url: targetUrl }, () => {
            // Wait for the page to load before starting the process
            chrome.tabs.onUpdated.addListener(function listener(
              tabId,
              changeInfo,
              tab
            ) {
              if (
                tabId === currentTab.id &&
                changeInfo.status === "complete" &&
                tab.url.startsWith(targetUrl)
              ) {
                chrome.tabs.onUpdated.removeListener(listener); // Remove the listener once the page is loaded
                waitForButtonsAndStartClicking(
                  currentTab.id,
                  message.delay,
                  message.maxClicks
                );
              }
            });
          });
        } else {
          // If already on the right page, wait for the buttons and start the process
          waitForButtonsAndStartClicking(
            currentTab.id,
            message.delay,
            message.maxClicks
          );
        }
      } else {
        console.error("No active tabs found.");
      }
    });
  } else if (message.action === "stopClicking") {
    isStopped = true; // Stop the clicking process
  } else if (message.action === "getStopState") {
    sendResponse({ isStopped: isStopped });
  }
});

// Function to wait for the "Invite" buttons to appear and then start the auto-clicking process
function waitForButtonsAndStartClicking(tabId, delay, maxClicks) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      func: () =>
        document.querySelectorAll('[aria-label*="Invite"]').length > 0,
    },
    (results) => {
      if (results && results.length > 0 && results[0].result) {
        // Buttons are present, start the clicking process
        startClickingProcess(tabId, delay, maxClicks);
      } else {
        // Poll every second until the buttons are found
        const intervalId = setInterval(() => {
          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              func: () =>
                document.querySelectorAll('[aria-label*="Invite"]').length > 0,
            },
            (results) => {
              if (results && results.length > 0 && results[0].result) {
                clearInterval(intervalId); // Stop polling once buttons are found
                startClickingProcess(tabId, delay, maxClicks);
              }
            }
          );
        }, 1000); // Check every 1 second
      }
    }
  );
}

function startClickingProcess(tabId, delay, maxClicks) {
  // Inject the autoClick function into the active tab's context
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: function (delay, maxClicks) {
      const buttons = document.querySelectorAll('[aria-label*="Invite"]');

      if (buttons.length === 0) {
        // If no buttons are found, send an error message to the background script
        chrome.runtime.sendMessage({
          action: "noButtonsFound",
          error: "No invite buttons found on the page.",
        });
        return; // Stop execution
      }

      let index = 0;
      let clickedCount = 0;

      function clickNextButton() {
        chrome.runtime.sendMessage({ action: "getStopState" }, (response) => {
          if (
            response.isStopped || // Stop if the background script indicates stop
            clickedCount >= maxClicks || // Stop if maxClicks reached
            index >= buttons.length // Stop if no more buttons
          ) {
            chrome.runtime.sendMessage({ action: "finished" }); // Notify when finished
            return; // Stop the loop
          }

          const button = buttons[index];
          if (
            button &&
            button.getAttribute("aria-label").includes("to connect")
          ) {
            button.click();
            clickedCount++;
            console.log(`Clicked button ${clickedCount}`);
          }

          index++;
          setTimeout(clickNextButton, delay * 1000); // Call next click with delay
        });
      }

      clickNextButton();
    },
    args: [delay, maxClicks], // Pass necessary arguments
  });
}
console.log(`
          .  .
          |\\_|\\
          | a_a\\
          | | "]
      ____| '-\\___
     /.----.___.-'\\
    //        _    \\
   //   .-. (~v~) /|
  |'|  /\\:  .--  / \\
 // |-/  \\_/____/\\/~|
|/  \\ |  []_|_|_] \\ |
| \\  | \\ |___   _\\ ]_}
| |  '-' /   '.'  |
| |     /    /|:  | 
| |     |   / |:  /\\
| |     /  /  |  /  \\
| |    |  /  /  |    \\
\\ |    |/\\/  |/|/\\    \\
 \\|\\ |\\|  |  | / /\\/\\__\\
  \\ \\| | /   | |__
jesus  / |   |____)
       |_/
    In the shadows of silence, we find the power to connect what others cannot see.
`);
