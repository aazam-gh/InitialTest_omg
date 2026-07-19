import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WalletPanel from './WalletPanel';
import {
  createKeystore,
  exportKeystore,
  importKeystore,
  loadKeystore,
  saveKeystore,
} from '../utils/wallet';

jest.mock('../utils/wallet', () => ({
  clearKeystore: jest.fn(),
  createKeystore: jest.fn(),
  decryptPrivateKey: jest.fn(),
  exportKeystore: jest.fn(),
  importKeystore: jest.fn(),
  loadKeystore: jest.fn(),
  saveKeystore: jest.fn(),
}));

const keystore = { address: '02abc', ciphertext: 'encrypted' };

beforeEach(() => {
  jest.clearAllMocks();
  loadKeystore.mockReturnValue(null);
});

test('creates and persists a browser-owned wallet', async () => {
  const onWalletChange = jest.fn();
  createKeystore.mockResolvedValue({ keystore, privateKey: 'private' });
  render(<WalletPanel onWalletChange={onWalletChange} />);
  fireEvent.change(screen.getByLabelText(/new wallet passphrase/i), { target: { value: 'correct horse battery staple' } });
  fireEvent.click(screen.getByRole('button', { name: /create encrypted wallet/i }));
  await waitFor(() => expect(saveKeystore).toHaveBeenCalledWith(keystore));
  expect(onWalletChange).toHaveBeenCalledWith({ address: keystore.address, privateKey: 'private' });
});

test('imports and exports an encrypted keystore', async () => {
  const onWalletChange = jest.fn();
  loadKeystore.mockReturnValue(keystore);
  importKeystore.mockResolvedValue(keystore);
  const { container } = render(<WalletPanel onWalletChange={onWalletChange} />);

  fireEvent.click(screen.getByRole('button', { name: /export backup/i }));
  expect(exportKeystore).toHaveBeenCalledWith(keystore);

  const file = new File(['{}'], 'wallet.json', { type: 'application/json' });
  fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
  await waitFor(() => expect(importKeystore).toHaveBeenCalledWith(file));
  expect(saveKeystore).toHaveBeenCalledWith(keystore);
  expect(onWalletChange).toHaveBeenCalledWith({ address: keystore.address, privateKey: null });
});
