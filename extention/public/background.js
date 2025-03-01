// Handle OAuth flow and token management
let authToken = null;

// Listen for messages from React components
// In your background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "authenticate") {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        console.error("Auth error:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      // Use the token to get user info
      fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => response.json())
        .then(userInfo => {
          // Send token to your backend for verification
          fetch("https://google-auth-extention.vercel.app/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token })
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                chrome.storage.local.set({
                  authToken: data.token,
                  userInfo: userInfo
                }, () => {
                  sendResponse({ success: true, user: userInfo });
                });
              } else {
                sendResponse({ success: false, error: data.error });
              }
            });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
    });

    return true; // Keep the connection open for the async response
  }

  if (request.action === "getItems") {
    chrome.storage.local.get('authToken', (result) => {
      if (!result.authToken) {
        sendResponse({ success: false, error: "Not authenticated" });
        return;
      }

      fetchItems(result.authToken)
        .then(items => {
          sendResponse({ success: true, items });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
    });

    return true; // Keep the connection open for the async response
  }

});





// Function to fetch items from our backend
async function fetchItems(token) {
  const response = await fetch("https://google-auth-extention.vercel.app/api/items", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to fetch items");
  }

  return response.json();
}
