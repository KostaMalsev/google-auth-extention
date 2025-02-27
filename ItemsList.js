import React from 'react';
import '../styles/components.css';

const ItemsList = ({ items }) => {
  return (
    <div className="items-list-container">
      <h2>Your Items</h2>
      <ul className="items-list">
        {items.map(item => (
          <li key={item.id} className="item">
            <div className="item-name">{item.name}</div>
            {item.description && (
              <div className="item-description">{item.description}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemsList;
