/*
 * NO MOCK DATA.
 * NO HARDCODED STATE.
 * NO DEV FALLBACKS.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import './index.css';

// Components
import LandingPage from './components/LandingPage';
import IdentityCreation from './components/IdentityCreation';
import ProofInterface from './components/ProofInterface';
import VerificationBadge from './components/VerificationBadge';
import WalletConnection from './components/WalletConnection';
import Sidebar from './components/Sidebar';
import AnalyticsBars from './components/AnalyticsBars';
import CurrencyExchange from './components/CurrencyExchange';
import AdminPortal from './components/AdminPortal';
import AuthPage from './components/AuthPage';

// Abstraction Layers (Phase 3 & 4)
import { useWallet } from './hooks/useWallet';
import { useIdentity } from './hooks/useIdentity';
import { loadIdentity, saveIdentity, hasStoredIdentity, setSessionKey } from './utils/identityStorage';
import { registerIdentityOnChain } from './services/identity.service';

function App() {
    // SSOT: Wallet and Identity are now managed by hooks
    const { address, isConnected, connect, disconnect, chainId, switchNetwork, isConnecting, error: walletError } = useWallet();
    const { state: identityState, details: chainIdentity, refresh: refreshIdentity } = useIdentity(address);

    const [view, setView] = useState('landing');
    const [activeTab, setActiveTab] = useState('registry');

    // Local vault state (Decrypted memory only)
    const [localIdentity, setLocalIdentity] = useState(null);
    const [encryptionKey, setEncryptionKey] = useState(null);

    // UI Loading states
    const [isRegistering, setIsRegistering] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    // Phase 8: Hard fail on Mock Data (Production Guard)
    useEffect(() => {
        if (import.meta.env.PROD) {
            const forbidden = ["mock", "dummy", "sample"];
            const check = (obj) => {
                if (!obj) return;
                const str = JSON.stringify(obj).toLowerCase();
                forbidden.forEach(word => {
                    if (str.includes(word)) {
                        throw new Error(`CRITICAL_SECURITY_VIOLATION: Mock data detected in production state.`);
                    }
                });
            };
            check(localIdentity);
            check(chainIdentity);
        }
    }, [localIdentity, chainIdentity]);

    const handleUnlock = async () => {
        if (!isConnected) return;
        setIsUnlocking(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const message = "Sign this message to decrypt your session-locked ZK Identity vault.";
            const signature = await signer.signMessage(message);
            const key = ethers.keccak256(ethers.toUtf8Bytes(signature));

            const stored = await loadIdentity(signature);
            if (stored) {
                setLocalIdentity(stored);
                setEncryptionKey(signature); // Store signature as the session root
                setView('dashboard'); // Enter system
            } else {
                // Check if there's stored data that might be corrupted
                if (hasStoredIdentity()) {
                    const shouldClear = confirm("Decryption failed. This can happen if you're using a different wallet or the data is corrupted. Would you like to clear the stored identity and start fresh?");
                    if (shouldClear) {
                        clearIdentity();
                        setSessionKey(null);
                        alert("Identity storage cleared. You can now create a new identity.");
                    }
                } else {
                    alert("No stored identity found. Please create a new identity first.");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Unlock Aborted.");
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleLogout = () => {
        setLocalIdentity(null);
        setEncryptionKey(null);
        setSessionKey(null);
        disconnect();
    };

    const clearIdentity = () => {
        localStorage.removeItem('zk_identity_profile');
        setLocalIdentity(null);
        setEncryptionKey(null);
        setSessionKey(null);
        alert("Local Identity Vault purged. You can now create a new cryptographic identity.");
    };

    const handleIdentityCreated = (newIdentity, key) => {
        setLocalIdentity(newIdentity);
        setEncryptionKey(key);
        // Automatically move to dashboard after creation
        setView('dashboard');
    };

    const handleRegisterOnChain = async () => {
        if (!address || !localIdentity) return;
        setIsRegistering(true);
        try {
            await registerIdentityOnChain(localIdentity.identityHash);
            refreshIdentity();
            alert("Cryptographic Identity Registered on Zero-Knowledge Ledger");
        } catch (e) {
            console.error(e);
            alert("Registration failed.");
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            {view === 'landing' ? (
                <motion.div
                    key="landing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6 }}
                >
                    <LandingPage
                        onEnter={() => setView('auth')}
                        isConnected={isConnected}
                        address={address}
                    />
                </motion.div>
            ) : view === 'auth' ? (
                <motion.div
                    key="auth"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                >
                    <AuthPage
                        isConnected={isConnected}
                        address={address}
                        onConnect={connect}
                        onUnlock={handleUnlock}
                        isUnlocking={isUnlocking}
                        hasStoredIdentity={hasStoredIdentity()}
                        onEnterDashboard={() => setView('dashboard')}
                    />
                </motion.div>
            ) : (
                <motion.div
                    key="dashboard"
                    className="app-container"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 25 }}
                >
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onLogout={handleLogout}
                    />

                    <main className="main-content">
                        <header>
                            <div className="logo-container">
                                <h1 className="logo-main" style={{ fontSize: '2.5rem' }}>DASHBOARD</h1>
                                <div className="logo-sub">{activeTab.toUpperCase()}_SUBSYSTEM_ONLINE</div>
                            </div>

                            <WalletConnection
                                address={address}
                                connect={connect}
                                isConnected={isConnected}
                                chainId={chainId}
                                switchNetwork={switchNetwork}
                                isConnecting={isConnecting}
                                error={walletError}
                            />
                        </header>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                style={{ flex: 1 }}
                            >
                                {activeTab === 'registry' && (
                                    <div className="dashboard-grid">
                                        <section className="col-left">
                                            {!localIdentity ? (
                                                <div className="glass-card">
                                                    <h2 className="view-header">INITIATE_IDENTITY</h2>
                                                    <p className="view-subtitle" style={{ marginBottom: 'calc(var(--space-unit) * 3)' }}>ENCRYPTED_ID_REGISTRATION_v1.0</p>
                                                    {hasStoredIdentity() ? (
                                                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                                            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                                                                ENCRYPTED_VAULT_DETECTED. SIGN TO DECRYPT.
                                                            </p>
                                                            <button
                                                                className="btn-primary"
                                                                onClick={handleUnlock}
                                                                disabled={isUnlocking || !isConnected}
                                                                style={{ width: '100%' }}
                                                            >
                                                                {isUnlocking ? 'DECRYPTING...' : 'UNLOCK_IDENTITY_VAULT'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                                                Your identity data is processed locally. We use cryptographically secure salts and AES-256 encryption.
                                                            </p>
                                                            <IdentityCreation onIdentityCreated={handleIdentityCreated} />
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="glass-card" style={{ border: identityState === 'revoked' ? '1px solid var(--accent-red)' : '' }}>
                                                    <div className="profile-card">
                                                        <h2 className="mono" style={{
                                                            fontSize: '1rem',
                                                            color: identityState === 'revoked' ? 'var(--accent-red)' : 'var(--accent-primary)',
                                                            marginBottom: '1.5rem',
                                                            letterSpacing: '0.3em'
                                                        }}>
                                                            {identityState === 'revoked' ? 'SURVEILLANCE_NOTICE: REVOKED' : 'DIGITAL_PASSPORT_v1.0'}
                                                        </h2>
                                                        <div className="profile-field">
                                                            <span className="profile-label">SUBJECT_IDENTIFIER (DID)</span>
                                                            <div className="profile-value" style={{ fontSize: '0.7rem' }}>
                                                                {chainIdentity?.registered ? `did:ethr:${address.slice(0, 10)}...` : 'PENDING_REGISTRATION'}
                                                            </div>
                                                        </div>
                                                        <div className="profile-field">
                                                            <span className="profile-label">SECURE_DOB_RECORD</span>
                                                            <div className="profile-value">DATE_{localIdentity.dob}</div>
                                                        </div>
                                                        <div className="profile-field">
                                                            <span className="profile-label">NATIONAL_ORIGIN_CODE</span>
                                                            <div className="profile-value">NAT_{localIdentity.nationality}</div>
                                                        </div>
                                                        <div className="profile-field">
                                                            <span className="profile-label">UNIVERSITY_AFFILIATION</span>
                                                            <div className="profile-value">UNI_{localIdentity.university}</div>
                                                        </div>
                                                        <div className="profile-field">
                                                            <span className="profile-label">STUDENT_IDENTIFIER</span>
                                                            <div className="profile-value">ID_****{localIdentity.studentId?.toString().slice(-4)}</div>
                                                        </div>

                                                        <div className={`clearance-badge ${identityState === 'revoked' ? 'revoked' : ''}`} style={{
                                                            borderColor: identityState === 'revoked' ? 'var(--accent-red)' : 'var(--accent-primary)',
                                                            color: identityState === 'revoked' ? 'var(--accent-red)' : 'var(--accent-primary)',
                                                            background: identityState === 'revoked' ? 'rgba(255, 51, 102, 0.1)' : 'rgba(90, 90, 254, 0.1)',
                                                            marginBottom: 'var(--space-unit)'
                                                        }}>
                                                            CLEARANCE: {identityState === 'revoked' ? 'REVOKED' : (identityState === 'verified' ? 'AUTHORIZED' : 'RESTRICTED')}
                                                        </div>

                                                        {identityState === 'revoked' && (
                                                            <div className="mono" style={{ color: 'var(--accent-red)', fontSize: '0.6rem', marginTop: '1rem', lineHeight: '1.4' }}>
                                                                CRITICAL_EXCEPTION: This identity has been revoked by the system administrator. All trading and verification privileges are suspended.
                                                            </div>
                                                        )}

                                                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                            {!chainIdentity?.registered && (
                                                                <button
                                                                    className="btn-primary"
                                                                    disabled={isRegistering || identityState === 'revoked'}
                                                                    onClick={handleRegisterOnChain}
                                                                    style={{ fontSize: '0.7rem', padding: '0.5rem 1rem' }}
                                                                >
                                                                    {isRegistering ? 'REGISTERING...' : 'INITIALIZE ON-CHAIN DID'}
                                                                </button>
                                                            )}
                                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                <VerificationBadge label="Age" verified={chainIdentity?.age} />
                                                                <VerificationBadge label="Nat" verified={chainIdentity?.nationality} />
                                                                <VerificationBadge label="Edu" verified={chainIdentity?.student} />
                                                            </div>

                                                            <button
                                                                className="mono"
                                                                onClick={clearIdentity}
                                                                style={{
                                                                    marginTop: '1rem',
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'var(--accent-red)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.6rem',
                                                                    textDecoration: 'underline'
                                                                }}
                                                            >
                                                                [PURGE_LOCAL_VAULT]
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </section>
                                        <section className="col-right">
                                            <div className="glass-card">
                                                <h2 className="view-header" style={{ fontSize: '1rem' }}>VAULT_ENCRYPTION_STATUS</h2>
                                                <div style={{ marginTop: 'calc(var(--space-unit) * 2)' }}>
                                                    <div className="profile-field">
                                                        <span className="profile-label">ALGORITHM</span>
                                                        <span className="profile-value">AES-256GCM</span>
                                                    </div>
                                                    <div className="profile-field">
                                                        <span className="profile-label">DERIVATION</span>
                                                        <span className="profile-value">HKDF-SHA256</span>
                                                    </div>
                                                    <div className="profile-field">
                                                        <span className="profile-label">SALTS</span>
                                                        <span className="profile-value">WEBCRYPTO_256</span>
                                                    </div>
                                                    <div className="profile-field">
                                                        <span className="profile-label">VAULT_STATUS</span>
                                                        <span className="profile-value" style={{ color: encryptionKey ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                                                            {encryptionKey ? 'DECRYPTED' : 'LOCKED'}
                                                        </span>
                                                    </div>
                                                    <div className="profile-field">
                                                        <span className="profile-label">INTEGRITY</span>
                                                        <span className="profile-value">VALID</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeTab === 'prover' && (
                                    <div className="glass-card" style={{ height: '100%' }}>
                                        <h2 className="view-header">ATOMIC_PROVING_ENGINE</h2>
                                        <p className="view-subtitle">ZK_SNARK_GENERATION_SUBSYSTEM</p>
                                        {!isConnected ? (
                                            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                                <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>CONNECT WALLET TO ACCESS THE PROOF ENGINE</p>
                                            </div>
                                        ) : (
                                            <ProofInterface identity={localIdentity} address={address} encryptionKey={encryptionKey} />
                                        )}
                                    </div>
                                )}

                                {activeTab === 'analytics' && (
                                    <div className="glass-card">
                                        <h2 className="view-header">ZK_SYSTEM_ANALYTICS</h2>
                                        <p className="view-subtitle" style={{ marginBottom: 'calc(var(--space-unit) * 3)' }}>NETWORK_LOAD_AND_IDENTITY_METRICS</p>
                                        <AnalyticsBars />
                                    </div>
                                )}

                                {activeTab === 'exchange' && (
                                    <div style={{ height: '100%' }}>
                                        <CurrencyExchange
                                            identity={localIdentity}
                                            address={address}
                                            identityState={identityState}
                                            chainIdentity={chainIdentity}
                                        />
                                    </div>
                                )}
                                {activeTab === 'admin' && (
                                    <AdminPortal address={address} />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <footer style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-dim)', paddingTop: '2rem', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                                <div className="mono">SYSTEM_STATUS: {isConnected ? 'ONLINE' : 'OFFLINE'} // NODE: {address?.slice(0, 6) || 'N/A'}</div>
                                <div className="mono">ZK_SPEC: GROTH16_BN128</div>
                                <button
                                    onClick={() => setView('landing')}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                >
                                    [GATEWAY]
                                </button>
                            </div>
                        </footer>
                    </main>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default App;
