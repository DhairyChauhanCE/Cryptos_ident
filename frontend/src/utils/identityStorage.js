import CryptoJS from 'crypto-js';

let sessionKey = null;

export const setSessionKey = (key) => {
    sessionKey = key;
};

export const getSessionKey = () => {
    return sessionKey;
};

/**
 * Identity storage utility
 * Handles persistent storage of identity data in browser localStorage with AES-256 encryption
 */

const STORAGE_KEY = 'zk_identity_profile';

/**
 * Save user identity to local storage
 * @param {Object} data Identity data (dob, nationality, salt)
 * @param {string} encryptionKey Key derived from wallet signature
 */
export const saveIdentity = (data, encryptionKey) => {
    const key = encryptionKey || sessionKey;
    if (!key) {
        throw new Error("Encryption key required for saving identity");
    }

    const jsonData = JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString()
    });

    const encryptedData = CryptoJS.AES.encrypt(jsonData, key).toString();
    localStorage.setItem(STORAGE_KEY, encryptedData);

    // Auto-cache to session if provided
    if (encryptionKey) setSessionKey(encryptionKey);
};

/**
 * Load user identity from local storage
 * @param {string} encryptionKey Key derived from wallet signature
 * @returns {Object|null} Identity data or null if not found/decryption fails
 */
export const loadIdentity = (encryptionKey) => {
    const key = encryptionKey || sessionKey;
    const encryptedData = localStorage.getItem(STORAGE_KEY);
    if (!encryptedData || !key) return null;

    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, key);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedData) {
            console.warn("Decryption returned empty string. Key might be incorrect.");
            return null;
        }
        return JSON.parse(decryptedData);
    } catch (e) {
        console.error("Decryption failed", e);
        return null;
    }
};

/**
 * Check if an identity exists in storage (without decrypting)
 * @returns {boolean}
 */
export const hasStoredIdentity = () => {
    return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Clear stored identity data
 */
export const clearIdentity = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/**
 * Generate a cryptographically secure salt for identity privacy
 * @returns {string} Random salt
 */
export const generateSalt = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

/**
 * Generate DID from wallet address
 * @param {string} address Wallet address
 * @returns {string} DID string
 */
export const generateDID = (address) => {
    return `did:ethr:${address.toLowerCase()}`;
};
