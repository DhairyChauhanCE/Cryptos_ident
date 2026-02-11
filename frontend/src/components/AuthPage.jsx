import { motion } from 'framer-motion';
import { Lock, Unlock, ShieldCheck, Wallet } from 'lucide-react';

const AuthPage = ({
    isConnected,
    address,
    onConnect,
    onUnlock,
    isUnlocking,
    hasStoredIdentity,
    onEnterDashboard
}) => {
    return (
        <div className="auth-container">
            {/* Visual background noise/glow from landing style */}
            <div className="mvc-bg-fx">
                <div className="noise-overlay" />
            </div>

            <motion.div
                className="auth-card glass-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                }}
            >
                <div className="auth-header">
                    <h1 className="auth-logo">SECURITY_GATE</h1>
                    <div className="auth-subtitle">IDENT_VERIFICATION_REQUIRED</div>
                </div>

                <div className="auth-status-box">
                    <div className="flex-between mono" style={{ fontSize: '0.7rem' }}>
                        <span style={{ color: 'var(--text-dim)' }}>NETWORK_STATUS:</span>
                        <span style={{ color: isConnected ? 'var(--accent-primary)' : '#ff4444' }}>
                            {isConnected ? 'STABLE_CONNECTION' : 'WAITING_FOR_LINK'}
                        </span>
                    </div>
                    {isConnected && (
                        <div className="mono" style={{ fontSize: '0.65rem', marginTop: '0.5rem', opacity: 0.6 }}>
                            NODE_ID: {address}
                        </div>
                    )}
                </div>

                {!isConnected ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                            Accessing the ZK-Identity Ledger requires an active peer-to-peer connection via your browser wallet.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={onConnect}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                        >
                            <Wallet size={18} /> INITIATE_CONNECTION
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        {hasStoredIdentity ? (
                            <>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                                    ENCRYPTED_VAULT_DETECTED. Decrypt your session-locked identity to authorize access to the dashboard.
                                </p>
                                <button
                                    className="btn-primary"
                                    onClick={onUnlock}
                                    disabled={isUnlocking}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                                >
                                    {isUnlocking ? (
                                        <>DECRYPTING...</>
                                    ) : (
                                        <>
                                            <Unlock size={18} /> AUTHORIZE_SESSION
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                                    No identity found for this node. You must register a new cryptographic commitment to enter the system.
                                </p>
                                <button
                                    className="btn-primary"
                                    onClick={onEnterDashboard}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                                >
                                    <ShieldCheck size={18} /> INITIALIZE_NEW_IDENTITY
                                </button>
                            </>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AuthPage;
