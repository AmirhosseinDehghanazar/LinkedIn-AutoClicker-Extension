function autoClick(delay, maxClicks) {
  const buttons = document.querySelectorAll('[aria-label*="Invite"]');
  let index = 0;
  let clickedCount = 0;

  function clickNextButton() {
    // Check if the stop signal is received
    chrome.runtime.sendMessage({ action: "getStopState" }, (response) => {
      if (
        response.isStopped ||
        clickedCount >= maxClicks ||
        index >= buttons.length
      ) {
        chrome.runtime.sendMessage({ action: "finished" }); // Notify when finished
        return; // Stop the loop
      }

      const button = buttons[index];
      if (button && button.getAttribute("aria-label").includes("to connect")) {
        button.click();
        clickedCount++;
        console.log(`Clicked button ${clickedCount}`);
      }

      index++;
      setTimeout(clickNextButton, delay * 1000); // Call next click with delay
    });
  }

  clickNextButton();
}
