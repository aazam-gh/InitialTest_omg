import { webcrypto } from 'crypto';
import {
  decryptPrivateKey,
  encryptPrivateKey,
  getAddress,
  validateKeystore,
} from './wallet';

beforeAll(() => {
  Object.defineProperty(window, 'crypto', { value: webcrypto, configurable: true });
});

const PRIVATE_KEY = '11'.repeat(32);
const OTHER_PRIVATE_KEY = '22'.repeat(32);

describe('wallet keystore validation', () => {
  it('rejects malformed imported keystore metadata', () => {
    expect(() => validateKeystore({ address: 'not-a-key', ciphertext: 'abc' })).toThrow(/unsupported/i);
  });

  it('decrypts a valid keystore and verifies its public address', async () => {
    const encrypted = await encryptPrivateKey(PRIVATE_KEY, 'correct horse battery staple');
    const keystore = { address: getAddress(PRIVATE_KEY), ...encrypted };
    await expect(decryptPrivateKey(keystore, 'correct horse battery staple')).resolves.toBe(PRIVATE_KEY);
  });

  it('rejects a keystore whose address does not match its encrypted key', async () => {
    const encrypted = await encryptPrivateKey(PRIVATE_KEY, 'correct horse battery staple');
    const keystore = { address: getAddress(OTHER_PRIVATE_KEY), ...encrypted };
    await expect(decryptPrivateKey(keystore, 'correct horse battery staple')).rejects.toThrow(/does not match/i);
  });
});
