import React from 'react';
import './BlockchainViewer.css';
import { formatAddress, formatTimestamp, truncateHash } from '../utils/formatters';

const copyText = async (value) => {
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
};

const CopyableValue = ({ value, className = '' }) => (
  <div className={`copyable-value ${className}`} title={value}>
    <span>{value}</span>
    <button type="button" onClick={() => copyText(value)} aria-label="Copy value" title="Copy value">⧉</button>
  </div>
);

const TransactionCard = ({ tx }) => (
  <article className="transaction-record">
    <div className="transaction-record-top">
      <div><span className="record-label">Transaction hash</span><span className="transaction-hash mono">{truncateHash(tx.id || tx.hash || 'Pending transaction', 12)}</span></div>
      <span className="confirmed-badge">Confirmed</span>
    </div>
    <div className="transaction-divider" />
    <div className="transaction-flow">
      <div><span className="record-label">From</span><span className={`address-chip mono ${!tx.fromAddress ? 'mining-reward' : ''}`}>{formatAddress(tx.fromAddress)}</span></div>
      <span className="flow-arrow" aria-hidden="true">→</span>
      <div><span className="record-label">To</span><span className="address-chip mono">{formatAddress(tx.toAddress)}</span></div>
      <div className="transaction-amount"><span className="record-label">Amount</span><strong>{tx.amount}</strong><span>units</span></div>
    </div>
  </article>
);

const BlockchainViewer = ({ blockchain, searchQuery = '' }) => {
  if (!blockchain || !blockchain.chain) return <section className="blockchain-viewer"><p>Loading blockchain data...</p></section>;

  const query = searchQuery.trim().toLowerCase();
  const visibleBlocks = !query ? blockchain.chain : blockchain.chain.filter((block, index) => {
    const searchable = [index, block.hash, block.previousHash, ...(block.transactions || []).flatMap((tx) => [tx.id, tx.hash, tx.fromAddress, tx.toAddress, tx.amount])].join(' ').toLowerCase();
    return searchable.includes(query);
  });

  return (
    <section className="blockchain-viewer" id="blocks" aria-labelledby="blockchain-title">
      <div className="explorer-heading"><div><span className="eyebrow">Live ledger</span><h1 id="blockchain-title">Blockchain <span>({blockchain.length} blocks)</span></h1></div><p>{query ? `${visibleBlocks.length} matching block${visibleBlocks.length === 1 ? '' : 's'}` : 'Proof-of-work ledger'}</p></div>
      <div className="blocks-container">
        {visibleBlocks.length === 0 && <div className="empty-search"><strong>No ledger entries match “{searchQuery}”.</strong><span>Search a block number, hash, address, or transaction amount.</span></div>}
        {visibleBlocks.map((block, index) => (
          <article key={`${block.hash}-${index}`} className="block-card">
            <header className="block-header"><h2>Block #{blockchain.chain.indexOf(block)}</h2>{blockchain.chain.indexOf(block) === 0 && <span className="genesis-badge">Genesis</span>}</header>
            <div className="block-content">
              <div className="block-field"><span className="field-label">Hash</span><CopyableValue value={block.hash} className="hash" /></div>
              <div className="block-field"><span className="field-label">Previous hash</span><CopyableValue value={block.previousHash || '0'} className="hash" /></div>
              <div className="block-field compact"><span className="field-label">Timestamp</span><span className="field-value plain">{formatTimestamp(block.timestamp)}</span></div>
              <div className="block-field compact"><span className="field-label">Nonce</span><span className="field-value plain mono">{block.nonce}</span></div>
              <div className="block-field compact"><span className="field-label">Transactions</span><span className="field-value plain mono">{block.transactions?.length || 0}</span></div>
            </div>
            {block.transactions?.length > 0 && <div className="transactions-list" id="transactions"><h3>Transactions <span>({block.transactions.length})</span></h3>{block.transactions.map((tx, txIndex) => <TransactionCard key={tx.id || `${index}-${txIndex}`} tx={tx} />)}</div>}
          </article>
        ))}
      </div>
    </section>
  );
};

export default BlockchainViewer;
