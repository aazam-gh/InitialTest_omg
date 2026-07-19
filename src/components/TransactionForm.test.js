import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TransactionForm from './TransactionForm';
import { addTransaction, fetchAccount } from '../api/blockchain.api';
import { signedTransaction } from '../utils/wallet';

jest.mock('../api/blockchain.api', () => ({ addTransaction: jest.fn(), fetchAccount: jest.fn() }));
jest.mock('../utils/wallet', () => ({ signedTransaction: jest.fn() }));

describe('TransactionForm', () => {
  it('requires an unlocked wallet before it can submit', () => {
    render(<TransactionForm wallet={null} onTransactionAdded={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /sign and queue/i }));
    expect(screen.getByText(/unlock a local wallet/i)).toBeTruthy();
  });

  it('signs locally and sends the canonical transaction', async () => {
    const refresh = jest.fn();
    const transaction = { id: 'a'.repeat(64), amount: '25' };
    fetchAccount.mockResolvedValue({ nextNonce: 3 });
    signedTransaction.mockReturnValue(transaction);
    addTransaction.mockResolvedValue({ transaction });
    render(<TransactionForm wallet={{ address: '02abc', privateKey: 'secret' }} onTransactionAdded={refresh} />);
    fireEvent.change(screen.getByLabelText(/recipient/i), { target: { value: '03recipient' } });
    fireEvent.change(screen.getByLabelText(/^amount/i), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /sign and queue/i }));
    await waitFor(() => expect(signedTransaction).toHaveBeenCalledWith({ privateKey: 'secret', toAddress: '03recipient', amount: '25', nonce: 3 }));
    expect(addTransaction).toHaveBeenCalledWith(transaction);
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText(/signed locally and queued/i)).toBeTruthy();
  });
});
