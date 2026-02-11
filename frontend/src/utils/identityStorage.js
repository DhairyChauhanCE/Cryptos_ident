/**
 * Identity storage utility (Phase 3 Hardening)
 * Handles persistent storage of identity data in browser localStorage with AES-256-GCM
 * Uses native WebCrypto API for hardware-accelerated security.
 */

const STORAGE_KEY = 'zk_identity_profile';
let sessionKey = null;

/**
 * Derive a cryptographic key from a wallet signature using HKDF
 * @param {string} signature The wallet signature
 * @returns {Promise<CryptoKey>}
 */
const deriveKeyFromSignature = async (signature) => {
    const encoder = new TextEncoder();
    const signatureBytes = encoder.encode(signature);

    // Import the raw signature as a key material
    const baseKey = await crypto.subtle.importKey(
        'raw',
        signatureBytes,
        'HKDF',
        false,
        ['deriveKey']
    );

    // Derive the final AES-GCM key using HKDF
    return await crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            salt: encoder.encode('extreme-emerald-v1-salt'),
            info: encoder.encode('identity-vault-key'),
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

export const setSessionKey = (key) => {
    sessionKey = key;
};

export const getSessionKey = () => {
    return sessionKey;
};

/**
 * Save user identity to local storage with AES-GCM
 * @param {Object} data Identity data
 * @param {string} signature Wallet signature for key derivation
 */
export const saveIdentity = async (data, signature) => {
    const key = await deriveKeyFromSignature(signature);
    const encoder = new TextEncoder();
    const jsonData = encoder.encode(JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString()
    }));

    // GCM needs a unique IV (Initialization Vector) per encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        jsonData
    );

    // Store as: IV (12 bytes) + EncryptedData (base64)
    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    const base64Data = btoa(String.fromCharCode(...combined));
    localStorage.setItem(STORAGE_KEY, base64Data);

    // Cache the key in session
    setSessionKey(key);
};

/**
 * Load and decrypt user identity
 * @param {string} signature Wallet signature
 */
export const loadIdentity = async (signature) => {
    const base64Data = localStorage.getItem(STORAGE_KEY);
    if (!base64Data || !signature) return null;

    try {
        const key = await deriveKeyFromSignature(signature);
        const combined = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)));

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decryptedContent = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decryptedContent));
    } catch (e) {
        console.error("VAULT_DECRYPTION_FAILED", e);
        return null;
    }
};

export const hasStoredIdentity = () => {
    return localStorage.getItem(STORAGE_KEY) !== null;
};

export const clearIdentity = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/**
 * Generate a cryptographically secure 256-bit salt for identity privacy
 */
export const generateSalt = () => {
    const salt = crypto.getRandomValues(new Uint8Array(32)); // 256-bit
    return Array.from(salt)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

export const generateDID = (address) => {
    return `did:ethr:${address.toLowerCase()}`;
};
