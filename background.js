// Handle OAuth flow and token management
let authToken = null;

// Listen for messages from React components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "authenticate") {
    authenticate().then(token => {
      authToken = token;
      sendResponse({success: true, token});
    }).catch(error => {
      sendResponse({success: false, error: error.message});
    });
    return true; // Required for async response
  }
  
  if (request.action === "getItems") {
    if (!authToken) {
      sendResponse({success: false, error: "Not authenticated"});
      return true;
    }
    
    fetchItems(authToken).then(items => {
      sendResponse({success: true, items});
    }).catch(error => {
      sendResponse({success: false, error: error.message});
    });
    return true; // Required for async response
  }

  if (request.action === "logout") {
    authToken = null;
    sendResponse({success: true});
    return true;
  }
});

// Function to handle authentication with Google
async function authenticate() {
  return new Promise((resolve, reject) => {
    const clientId = chrome.runtime.getManifest().oauth2.client_id;
    const redirectUri = chrome.identity.getRedirectURL("oauth2");
    const scopes = chrome.runtime.getManifest().oauth2.scopes;
    
    const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
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
