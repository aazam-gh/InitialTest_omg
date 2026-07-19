import React from 'react';
import './Header.css';

const Header = ({ searchQuery = '', onSearchChange = () => {} }) => (
  <header className="header">
    <div className="header-content">
      <a className="brand" href="#dashboard" aria-label="ChainScope dashboard">
        <span className="brand-mark" aria-hidden="true">↔</span>
        <span>ChainScope</span>
      </a>
      <nav className="main-nav" aria-label="Primary navigation">
        <a className="nav-link active" href="#dashboard">Dashboard</a>
        <a className="nav-link" href="#blocks">Blocks</a>
        <a className="nav-link" href="#transactions">Transactions</a>
      </nav>
      <div className="header-tools">
        <label className="search-control">
          <span className="sr-only">Search blocks or transactions</span>
          <span aria-hidden="true">⌕</span>
          <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search blocks, hashes, addresses" />
        </label>
        <span className="network-status"><i /> Local network</span>
      </div>
    </div>
  </header>
);

export default Header;
