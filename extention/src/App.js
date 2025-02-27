import React, { useState, useEffect } from 'react';
import GoogleSignInButton from './components/GoogleSignInButton';
import UserProfile from './components/UserProfile';
import ItemsList from './components/ItemsList';
import LoadingSpinner from './components/LoadingSpinner';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated
    chrome.storage.local.get(['authToken', 'userInfo'], (result) => {
      if (result.authToken && result.userInfo) {
        setUser(result.userInfo);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });
  }, []);

  const handleSignIn = () => {
    setIsLoading(true);
    setError(null);

    chrome.runtime.sendMessage({ action: "authenticate" }, (response) => {
      if (response.success) {
        // Get user info after successful login
        fetch("https://your-vercel-app.vercel.app/api/login/verify", {
          headers: {
            "Authorization": `Bearer ${response.token}`
          }
        })
          .then(response => response.json())
          .then(data => {
            // Save user info
            chrome.storage.local.set({ userInfo: data.user }, () => {
              setUser(data.user);
              setIsAuthenticated(true);
              setIsLoading(false);
            });
          })
          .catch(err => {
            setError("Failed to get user information");
            setIsLoading(false);
          });
      } else {
        setError(response.error || "Authentication failed");
        setIsLoading(false);
      }
    });
  };

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ action: "logout" }, () => {
      chrome.storage.local.remove(['authToken', 'userInfo'], () => {
        setIsAuthenticated(false);
        setUser(null);
        setItems([]);
      });
    });
  };

  const handleFetchItems = () => {
    setIsLoading(true);
    setError(null);

    chrome.runtime.sendMessage({ action: "getItems" }, (response) => {
      setIsLoading(false);

      if (response.success) {
        setItems(response.items);
      } else {
        setError(response.error || "Failed to fetch items");
      }
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app-container">
      <h1>My Items Extension</h1>

      {!isAuthenticated ? (
        <GoogleSignInButton onClick={handleSignIn} />
      ) : (
        <>
          <UserProfile user={user} onSignOut={handleSignOut} />

          <div className="fetch-container">
            <button
              className="fetch-button"
              onClick={handleFetchItems}
            >
              Fetch My Items
            </button>
          </div>

          {items.length > 0 && <ItemsList items={items} />}
        </>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

export default App;
