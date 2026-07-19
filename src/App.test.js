import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import useBlockchain from './hooks/useBlockchain';
import { fetchAccount, mineBlock } from './api/blockchain.api';

const refresh = jest.fn();

jest.mock('./hooks/useBlockchain');
jest.mock('./api/blockchain.api', () => ({ fetchAccount: jest.fn(), mineBlock: jest.fn() }));
jest.mock('./components/Header', () => () => <div>Header</div>);
jest.mock('./components/BlockchainViewer', () => () => <div>Chain</div>);
jest.mock('./components/TransactionForm', () => () => <div>Transaction</div>);
jest.mock('./components/WalletPanel', () => ({ onWalletChange }) => (
  <button onClick={() => onWalletChange({ address: '02wallet', privateKey: 'private' })}>Select wallet</button>
));
jest.mock('./components/StatsPanel', () => ({ onMine }) => <button onClick={onMine}>Mine selected</button>);

beforeEach(() => {
  jest.clearAllMocks();
  useBlockchain.mockReturnValue({
    chain: { chain: [], length: 0 },
    stats: { chainLength: 1, pendingTransactions: 0 },
    loading: false,
    error: null,
    refresh,
  });
  fetchAccount.mockResolvedValue({ confirmedBalance: '0', availableBalance: '0', nextNonce: 0 });
  mineBlock.mockResolvedValue({ success: true });
});

test('mines rewards to the selected wallet and refreshes the dashboard', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /select wallet/i }));
  await waitFor(() => expect(fetchAccount).toHaveBeenCalledWith('02wallet'));
  fireEvent.click(screen.getByRole('button', { name: /mine selected/i }));
  await waitFor(() => expect(mineBlock).toHaveBeenCalledWith('02wallet'));
  expect(refresh).toHaveBeenCalled();
});
