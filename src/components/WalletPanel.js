import React, { useEffect, useRef, useState } from 'react';
import './TransactionForm.css';
import { clearKeystore, createKeystore, decryptPrivateKey, exportKeystore, importKeystore, loadKeystore, saveKeystore } from '../utils/wallet';

const WalletPanel = ({ onWalletChange }) => {
  const [keystore, setKeystore] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    try { setKeystore(loadKeystore()); }
    catch (error) { setMessage(`Stored keystore is invalid: ${error.message}`); }
  }, []);
  const setWallet = (next, privateKey = null) => { setKeystore(next); onWalletChange(next ? { address: next.address, privateKey } : null); };

  const create = async () => {
    setBusy(true); setMessage('');
    try { const wallet = await createKeystore(passphrase); saveKeystore(wallet.keystore); setWallet(wallet.keystore, wallet.privateKey); setPassphrase(''); setMessage('Wallet created and unlocked locally. Export a backup before continuing.'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const unlock = async () => {
    setBusy(true); setMessage('');
    try { const privateKey = await decryptPrivateKey(keystore, passphrase); setWallet(keystore, privateKey); setPassphrase(''); setMessage('Wallet unlocked in this browser tab.'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const lock = () => { setWallet(keystore); setMessage('Wallet locked.'); };
  const remove = () => { clearKeystore(); setWallet(null); setMessage('Local keystore removed from this browser.'); };
  const upload = async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try { const imported = await importKeystore(file); saveKeystore(imported); setWallet(imported); setMessage('Keystore imported. Unlock it to sign transactions.'); }
    catch (error) { setMessage(error.message); }
    event.target.value = '';
  };

  return <section className="transaction-form wallet-panel" aria-labelledby="wallet-title">
    <span className="eyebrow">Browser-owned keys</span><h2 id="wallet-title" className="panel-title">Wallet studio</h2>
    <p className="panel-subtitle">Create, restore, and unlock an encrypted local wallet. Keys never leave this browser.</p>
    {keystore && <><label>Public address</label><div className="field-value hash">{keystore.address}</div></>}
    <label htmlFor="wallet-passphrase">{keystore ? 'Passphrase to unlock' : 'New wallet passphrase'}</label>
    <input id="wallet-passphrase" type="password" autoComplete="new-password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder="At least 12 characters" />
    {!keystore ? <button type="button" className="submit-button" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create encrypted wallet'}</button> : <div className="wallet-actions">
      <button type="button" className="submit-button" onClick={unlock} disabled={busy}>{busy ? 'Unlocking…' : 'Unlock wallet'}</button>
      <button type="button" className="copy-button" onClick={() => exportKeystore(keystore)}>Export backup</button>
      <button type="button" className="copy-button" onClick={lock}>Lock</button>
      <button type="button" className="copy-button" onClick={() => fileInput.current?.click()}>Import</button>
      <button type="button" className="copy-button" onClick={remove}>Delete local copy</button>
      <input ref={fileInput} type="file" accept="application/json" hidden onChange={upload} />
    </div>}
    {message && <p className="form-message" role="status">{message}</p>}
  </section>;
};

export default WalletPanel;
