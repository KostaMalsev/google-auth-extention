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
          fetch("https://your-vercel-app.vercel.app/api/login", {
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
});

// Function to handle authentication with Google
async function authenticate() {
  return new Promise((resolve, reject) => {
    const clientId = chrome.runtime.getManifest().oauth2.client_id;
    //const redirectUri = '';//chrome.identity.getRedirectURL("oauth2");
    const redirectUri = chrome.identity.getRedirectURL('callback');

    const scopes = chrome.runtime.getManifest().oauth2.scopes;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes.join(" "));

    chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true
    }, (responseUrl) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      if (!responseUrl) {
        reject(new Error("Authentication failed"));
        return;
      }

      const url = new URL(responseUrl);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get("access_token");

      if (!accessToken) {
        reject(new Error("No access token found"));
        return;
      }

      // Send the token to our backend to validate and create a session
      fetch("https://your-vercel-app.vercel.app/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: accessToken })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Store the session token from our backend
            chrome.storage.local.set({ authToken: data.token }, () => {
              resolve(data.token);
            });
          } else {
            reject(new Error(data.error || "Backend authentication failed"));
          }
        })
        .catch(error => {
          reject(new Error("Failed to authenticate with backend"));
        });
    });
  });
}

// Function to fetch items from our backend
async function fetchItems(token) {
  const response = await fetch("https://your-vercel-app.vercel.app/api/items", {
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
