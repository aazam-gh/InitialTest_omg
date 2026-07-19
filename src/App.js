import React, { useEffect, useState } from 'react';
import './App.css';

import BlockchainViewer from './components/BlockchainViewer';
import TransactionForm from './components/TransactionForm';
import WalletPanel from './components/WalletPanel';
import StatsPanel from './components/StatsPanel';
import Header from './components/Header';

import useBlockchain from './hooks/useBlockchain';
import { fetchAccount, mineBlock } from './api/blockchain.api';

function App() {
  const { chain, stats, loading, error, refresh } = useBlockchain();
  const [wallet, setWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [actionError, setActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!wallet?.address) { setAccount(null); return; }
    fetchAccount(wallet.address).then(setAccount).catch((requestError) => setActionError(requestError.message));
  }, [wallet?.address, stats?.chainLength, stats?.pendingTransactions]);

  const handleMine = async () => {
    try {
      setActionError('');
      if (!wallet?.address) throw new Error('Create or import a wallet before mining rewards.');
      await mineBlock(wallet.address);
      await refresh();
    } catch (err) {
      setActionError(err.message || 'Mining failed.');
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading Blockchain...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="app-container" id="dashboard">
        {(error || actionError) && (
          <div className="error-banner">
            <p>{error || actionError}</p>
          </div>
        )}

        <div className="main-content">
          <div className="left-panel">
            <StatsPanel stats={stats} account={account} onMine={handleMine} />
            <WalletPanel onWalletChange={setWallet} />
            <TransactionForm wallet={wallet} onTransactionAdded={refresh} />
          </div>

          <div className="right-panel">
            <BlockchainViewer blockchain={chain} searchQuery={searchQuery} />
          </div>
        </div>
        <footer className="app-footer"><a className="brand" href="#dashboard"><span className="brand-mark" aria-hidden="true">↔</span><span>ChainScope</span></a><span>Local blockchain explorer</span></footer>
      </main>
    </div>
  );
}

export default App;
