import { motion } from 'framer-motion';
import { Wallet, Activity, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * WalletConnection Component
 * Simplified to use standardized useWallet hook via props.
 * Integrated automated network switching (Phase 12.3).
 */
const WalletConnection = ({ address, connect, isConnected, chainId, switchNetwork, isConnecting, error }) => {
    const EXPECTED_CHAIN_ID = import.meta.env.VITE_CHAIN_ID;
    const isNetworkMismatch = isConnected && chainId && chainId.toString() !== EXPECTED_CHAIN_ID.toString();

    return (
        <motion.div
            className="wallet-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}
        >
            {error && (
                <div className="mono" style={{
                    position: 'absolute',
                    top: '-30px',
                    right: 0,
                    color: 'var(--accent-red)',
                    fontSize: '0.65rem',
                    background: 'rgba(255, 51, 102, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--accent-red)'
                }}>
                    ERROR: {error}
                </div>
            )}
            {isNetworkMismatch && (
                <motion.button
                    className="btn-primary network-warning"
                    onClick={switchNetwork}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: 'linear-gradient(135deg, var(--accent-red), #ff6b6b)',
                        borderColor: 'transparent',
                        color: 'white',
                        animation: 'pulse 2s infinite',
                        boxShadow: '0 4px 20px rgba(255, 51, 102, 0.3)'
                    }}
                >
                    <AlertCircle size={16} style={{ marginRight: '8px' }} />
                    SWITCH_TO_{EXPECTED_CHAIN_ID === '31337' ? 'HARDHAT' : 'AMOY'}
                </motion.button>
            )}

            {isConnecting ? (
                <motion.div
                    className="connecting-status"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(0, 255, 153, 0.1)',
                        border: '1px solid var(--accent-mint)',
                        borderRadius: '8px',
                        color: 'var(--accent-mint)',
                        fontSize: '0.9rem'
                    }}
                >
                    <Loader2 size={16} className="spin" />
                    <span>CONNECTING...</span>
                </motion.div>
            ) : isConnected && address ? (
                <motion.div
                    className="wallet-connected"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.5rem',
                        background: isNetworkMismatch
                            ? 'linear-gradient(135deg, rgba(255, 51, 102, 0.1), rgba(255, 107, 107, 0.1))'
                            : 'linear-gradient(135deg, rgba(0, 255, 153, 0.1), rgba(0, 200, 120, 0.1))',
                        border: isNetworkMismatch
                            ? '1px solid var(--accent-red)'
                            : '1px solid var(--accent-mint)',
                        borderRadius: '12px',
                        color: isNetworkMismatch ? 'var(--accent-red)' : 'var(--accent-mint)',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        boxShadow: isNetworkMismatch
                            ? '0 4px 20px rgba(255, 51, 102, 0.2)'
                            : '0 4px 20px rgba(0, 255, 153, 0.2)'
                    }}
                >
                    <CheckCircle size={16} className="success-icon" />
                    <Activity size={14} className="pulse-icon" />
                    <span className="mono">
                        {isNetworkMismatch ? 'NETWORK_ERROR' : `NODE_ID: ${address.slice(0, 6).toUpperCase()}...${address.slice(-4).toUpperCase()}`}
                    </span>
                </motion.div>
            ) : (
                <motion.button
                    className="btn-primary wallet-connect"
                    onClick={connect}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{
                        scale: 1.05,
                        boxShadow: '0 8px 30px rgba(0, 255, 153, 0.4)',
                        background: 'linear-gradient(135deg, var(--accent-mint), #00cc99)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}
                >
                    <Wallet size={16} />
                    INITIALIZE_CRYPTO_LINK
                </motion.button>
            )}
        </motion.div>
    );
};

export default WalletConnection;
