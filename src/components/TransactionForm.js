import React, { useState } from 'react';
import './TransactionForm.css';
import { addTransaction, fetchAccount } from '../api/blockchain.api';
import { signedTransaction } from '../utils/wallet';

const TransactionForm = ({ wallet, onTransactionAdded }) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setMessage('');
    if (!wallet?.privateKey) { setMessage('Unlock a local wallet before signing a transaction.'); return; }
    setLoading(true);
    try {
      if (!/^[1-9][0-9]*$/.test(amount)) throw new Error('Amount must be a positive whole number of base units.');
      const account = await fetchAccount(wallet.address);
      const transaction = signedTransaction({ privateKey: wallet.privateKey, toAddress, amount, nonce: account.nextNonce });
      await addTransaction(transaction);
      setToAddress(''); setAmount(''); setMessage('Signed locally and queued for mining.'); await onTransactionAdded();
    } catch (error) { setMessage(error.message || 'Unable to submit transaction.'); } finally { setLoading(false); }
  };
  return <section className="transaction-form" aria-labelledby="transaction-title"><span className="eyebrow">Signed locally</span><h2 id="transaction-title" className="panel-title">Create transaction</h2>
    <p className="panel-subtitle">Use your unlocked wallet to sign and queue test units for mining.</p>
    <form onSubmit={submit}><div className="form-group"><label htmlFor="toAddress">Recipient address</label><input id="toAddress" value={toAddress} onChange={(event) => setToAddress(event.target.value)} placeholder="02… or 03…" required /></div>
      <div className="form-group"><label htmlFor="amount">Amount</label><input id="amount" type="text" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100" required /></div>
      {message && <p className={`form-message ${message.startsWith('Signed') ? 'success' : 'error'}`} role="status">{message}</p>}
      <button type="submit" className="submit-button" disabled={loading}>{loading ? 'Signing…' : 'Sign and queue transaction'}</button>
    </form></section>;
};
export default TransactionForm;
