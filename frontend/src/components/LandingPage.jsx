import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Globe, MoveRight } from 'lucide-react';

const LandingPage = ({ onEnter }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.3, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    const glowVariants = {
        initial: { scale: 0.8, opacity: 0.3 },
        animate: {
            scale: 1,
            opacity: 0.6,
            transition: { duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
        }
    };

    return (
        <div className="landing-container">
            {/* Cinematic Background Elements */}
            <motion.div
                className="radial-glow top-right"
                variants={glowVariants}
                initial="initial"
                animate="animate"
            />
            <motion.div
                className="radial-glow bottom-left"
                variants={glowVariants}
                initial="initial"
                animate="animate"
                style={{ animationDelay: '2s' }}
            />

            <motion.main
                className="hero-section"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="eyebrow" variants={itemVariants}>
                    <span className="badge">v1.2 // ATOMIC_PRIVACY_PROTOCOL</span>
                </motion.div>

                <motion.h1 className="hero-title" variants={itemVariants}>
                    OWN YOUR <span className="highlight">IDENTITY</span><br />
                    REVEAL <span className="highlight-gold">NOTHING.</span>
                </motion.h1>

                <motion.p className="hero-subtitle" variants={itemVariants}>
                    The world's most beautiful decentralized identity system.
                    Powered by Zero-Knowledge Proofs on Ethereum.
                    Private by design. Gorgeous by choice.
                </motion.p>

                <motion.div className="hero-actions" variants={itemVariants}>
                    <motion.button
                        className="btn-primary main-cta"
                        onClick={onEnter}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        INITIALIZE PROTOCOL <MoveRight size={18} style={{ marginLeft: '10px' }} />
                    </motion.button>

                    <div className="stat-row">
                        <div className="stat-item">
                            <span className="stat-value">100%</span>
                            <span className="stat-label">LOCAL_DATA</span>
                        </div>
                        <div className="divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">ZK-SNARK</span>
                            <span className="stat-label">PROOF_ENGINE</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="feature-grid" variants={itemVariants}>
                    <div className="feature-card">
                        <Shield className="feature-icon" size={24} />
                        <h3>Privacy First</h3>
                        <p>Your data never leaves your device. Only cryptographic proofs reach the chain.</p>
                    </div>
                    <div className="feature-card">
                        <Lock className="feature-icon" size={24} />
                        <h3>Groth16 ZKP</h3>
                        <p>Advanced zero-knowledge tech ensures mathematical verification of claims.</p>
                    </div>
                    <div className="feature-card">
                        <Globe className="feature-icon" size={24} />
                        <h3>Multichain DID</h3>
                        <p>Decentralized identity linked to your wallet, verified on the ZK ledger.</p>
                    </div>
                </motion.div>
            </motion.main>

            <footer className="landing-footer">
                <div className="mono">ENCRYPTED_HANDSHAKE_PENDING...</div>
                <div className="mono">TRUSTLESS_VERIFICATION_LAYER_V1</div>
            </footer>
        </div>
    );
};

export default LandingPage;
