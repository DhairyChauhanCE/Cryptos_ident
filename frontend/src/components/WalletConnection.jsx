import { ethers } from 'ethers';

/**
 * WalletConnection Component
 * Simplified to use standardized useWallet hook via props.
 * Integrated automated network switching (Phase 12.3).
 */
const WalletConnection = ({ address, connect, isConnected, chainId, switchNetwork }) => {
    const EXPECTED_CHAIN_ID = import.meta.env.VITE_CHAIN_ID;
    const isNetworkMismatch = isConnected && chainId && chainId.toString() !== EXPECTED_CHAIN_ID.toString();

    return (
        <div className="wallet-container" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isNetworkMismatch && (
                <button
                    className="btn-primary"
                    onClick={switchNetwork}
                    style={{
                        background: 'var(--accent-red)',
                        borderColor: 'transparent',
                        color: 'white',
                        animation: 'pulse 2s infinite'
                    }}
                >
                    SWITCH_TO_{EXPECTED_CHAIN_ID === '31337' ? 'HARDHAT' : 'AMOY'}
                </button>
            )}

            {isConnected && address ? (
                <div className="mono" style={{
                    border: isNetworkMismatch ? '1px solid var(--accent-red)' : '1px solid var(--accent-mint)',
                    padding: '0.5rem 1rem',
                    color: isNetworkMismatch ? 'var(--accent-red)' : 'var(--accent-mint)',
                    background: isNetworkMismatch ? 'rgba(255, 51, 102, 0.05)' : 'rgba(0, 255, 153, 0.05)',
                    fontSize: '0.8rem'
                }}>
                    {isNetworkMismatch ? 'NETWORK_ERROR' : `NODE_ID: ${address.slice(0, 6).toUpperCase()}...${address.slice(-4).toUpperCase()}`}
                </div>
            ) : (
                <button className="btn-primary" onClick={connect}>
                    INITIALIZE_CRYPTO_LINK
                </button>
            )}
        </div>
    );
};

export default WalletConnection;
bitumen
