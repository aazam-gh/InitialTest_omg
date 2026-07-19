import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

const STORAGE_KEY = 'chainscope.encrypted-keystore.v1';
const KEYSTORE_ALGORITHM = 'secp256k1/AES-256-GCM/PBKDF2-SHA-256';
const KEYSTORE_ITERATIONS = 310000;
const encoder = new TextEncoder();

const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
const canonicalPayload = ({ fromAddress, toAddress, amount, nonce }) =>
  JSON.stringify({ version: 1, fromAddress, toAddress, amount, nonce });
const hashText = (value) => bytesToHex(sha256(encoder.encode(value)));

/**
 * Validate the public shape of an imported or restored ChainScope keystore.
 * Cryptographic consistency is checked after the private key is decrypted.
 *
 * @param {unknown} keystore candidate keystore object
 * @returns {object} the validated keystore
 */
export const validateKeystore = (keystore) => {
  if (!keystore || typeof keystore !== 'object' || keystore.version !== 1 ||
      keystore.algorithm !== KEYSTORE_ALGORITHM || keystore.iterations !== KEYSTORE_ITERATIONS) {
    throw new Error('Unsupported keystore format');
  }
  try {
    if (bytesToHex(secp256k1.ProjectivePoint.fromHex(keystore.address).toRawBytes(true)) !== keystore.address.toLowerCase()) {
      throw new Error('Non-canonical address');
    }
  } catch {
    throw new Error('Keystore address must be a compressed secp256k1 public key');
  }
  for (const field of ['salt', 'iv', 'ciphertext']) {
    if (typeof keystore[field] !== 'string' || !keystore[field]) throw new Error(`Keystore ${field} is missing`);
  }
  return keystore;
};

const deriveKey = async (passphrase, salt) => {
  const material = await window.crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: KEYSTORE_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptPrivateKey = async (privateKey, passphrase) => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, hexToBytes(privateKey));
  return { version: 1, algorithm: KEYSTORE_ALGORITHM, iterations: KEYSTORE_ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(encrypted)) };
};

export const decryptPrivateKey = async (keystore, passphrase) => {
  validateKeystore(keystore);
  let privateKey;
  try {
    const salt = fromBase64(keystore.salt);
    const iv = fromBase64(keystore.iv);
    const key = await deriveKey(passphrase, salt);
    privateKey = new Uint8Array(await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromBase64(keystore.ciphertext)));
    if (!secp256k1.utils.isValidPrivateKey(privateKey)) throw new Error('Invalid private key');
  } catch {
    throw new Error('Unable to unlock this keystore. Check the passphrase.');
  }
  const privateKeyHex = bytesToHex(privateKey);
  if (getAddress(privateKeyHex) !== keystore.address.toLowerCase()) {
    throw new Error('Keystore address does not match its encrypted private key.');
  }
  return privateKeyHex;
};

export const getAddress = (privateKey) => bytesToHex(secp256k1.getPublicKey(privateKey, true));

export const createKeystore = async (passphrase) => {
  if (passphrase.length < 12) throw new Error('Use a passphrase with at least 12 characters');
  const privateKey = bytesToHex(secp256k1.utils.randomPrivateKey());
  const address = getAddress(privateKey);
  const keystore = { address, ...(await encryptPrivateKey(privateKey, passphrase)) };
  return { privateKey, keystore };
};

/** Save a validated encrypted keystore in browser-local storage. */
export const saveKeystore = (keystore) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validateKeystore(keystore)));

/** Restore and validate the encrypted keystore stored by this browser. */
export const loadKeystore = () => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? validateKeystore(JSON.parse(raw)) : null;
};
export const clearKeystore = () => window.localStorage.removeItem(STORAGE_KEY);

/**
 * Sign a canonical transaction locally without exposing the private key.
 *
 * @param {{privateKey: string, toAddress: string, amount: string, nonce: number}} values
 * @returns {object} canonical signed transaction accepted by the API
 */
export const signedTransaction = ({ privateKey, toAddress, amount, nonce }) => {
  const fromAddress = getAddress(privateKey);
  const payload = { fromAddress, toAddress: toAddress.toLowerCase(), amount, nonce };
  const signingHash = hashText(canonicalPayload(payload));
  const signature = bytesToHex(secp256k1.sign(signingHash, privateKey).toCompactRawBytes());
  return { version: 1, ...payload, id: hashText(canonicalPayload(payload)), signature };
};

export const exportKeystore = (keystore) => {
  const blob = new Blob([JSON.stringify(keystore, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chainscope-${keystore.address.slice(0, 12)}.keystore.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const importKeystore = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      resolve(validateKeystore(JSON.parse(reader.result)));
    } catch (error) { reject(new Error(`Invalid keystore file: ${error.message}`)); }
  };
  reader.onerror = () => reject(new Error('Unable to read the selected file'));
  reader.readAsText(file);
});
