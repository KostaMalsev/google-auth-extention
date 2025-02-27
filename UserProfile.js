import React from 'react';
import '../styles/components.css';

const UserProfile = ({ user, onSignOut }) => {
  if (!user) return null;

  return (
    <div className="user-profile">
      {user.picture && (
        <img 
          src={user.picture} 
          alt={user.name || 'User'} 
          className="user-avatar" 
        />
      )}
      <div className="user-info">
        <div className="user-name">{user.name}</div>
        <div className="user-email">{user.email}</div>
      </div>
      <button className="sign-out-button" onClick={onSignOut}>
        Sign Out
      </button>
    </div>
  );
};

export default UserProfile;
