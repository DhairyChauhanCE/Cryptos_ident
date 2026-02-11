import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { MoveRight, Plus, Twitter, Github, MessageSquare, Shield, Cpu, Zap, Database, Globe, Layers } from 'lucide-react';

const MatrixLine = ({ text }) => {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayed(text.slice(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return <div className="matrix-line">{displayed}<span className="cursor-blink">_</span></div>;
};

const LandingPage = ({ onEnter, isConnected, address }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const [matrixData, setMatrixData] = useState([]);
    useEffect(() => {
        const lines = [
            "INITIALIZING_ZK_PROVER_V3...",
            "NODE_CONNECTED: 0x72a...f91",
            "VERIFYING_AGE_PROOF_COMPLIANCE...",
            "SECURE_ENCLAVE: ACTIVE",
            "BITCOIN_L0_BRIDGE: SYNCHRONIZED",
            "GAS_OPTIMIZATION: 98.4%",
            "ENTROPY_COLLECTED: VALID",
            "IDENTITY_VAULT_ENCRYPTED: TRUE"
        ];
        const interval = setInterval(() => {
            setMatrixData(prev => [...prev.slice(-15), lines[Math.floor(Math.random() * lines.length)] + " [" + Math.random().toString(16).slice(2, 8) + "]"]);
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

    const sidebarVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0, transition: { duration: 1, ease: "easeOut" } }
    };

    const rightSidebarVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { duration: 1, ease: "easeOut" } }
    };

    return (
        <div className="mvc-landing">
            {/* Top Navigation */}
            <nav className="mvc-nav">
                <div className="nav-logo">MVC_LOGO</div>
                <div className="nav-links">
                    <a href="#">Learn</a>
                    <a href="#">Solution</a>
                    <a href="#">Build</a>
                    <a href="#">Space</a>
                    <a href="#">Ecosystem</a>
                    <a href="#">DAO</a>
                    <a href="#">Bridge</a>
                </div>
                <button className="join-community-btn">Join the Community</button>
            </nav>

            <div className="mvc-main-layout">
                {/* Left Sidebar */}
                <motion.div
                    className="mvc-side-left"
                    variants={sidebarVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="feature-list">
                        <div className="feature-item"><Plus size={14} /> Bitcoin</div>
                        <div className="feature-item"><Plus size={14} /> Smart Contract</div>
                        <div className="feature-item"><Plus size={14} /> Scalability</div>
                        <div className="feature-item"><Plus size={14} /> Decentralized ID</div>
                    </div>

                    <div className="mvc-join-us">
                        <h4>Join Us</h4>
                        <div className="social-links">
                            <a href="#" target="_blank" rel="noopener noreferrer"><MessageSquare size={16} /> Discord</a>
                            <a href="#" target="_blank" rel="noopener noreferrer"><Twitter size={16} /> Twitter</a>
                            <a href="https://github.com/chauhand2463" target="_blank" rel="noopener noreferrer"><Github size={16} /> GitHub</a>
                        </div>
                    </div>
                </motion.div>

                {/* Central Hero */}
                <motion.div
                    className="mvc-hero"
                    style={{ opacity: heroOpacity, scale: heroScale }}
                >
                    <motion.div
                        className="mvc-badge"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        MicroVisionChain
                    </motion.div>

                    <h1 className="mvc-title">
                        THE BLOCKCHAIN <br />
                        FOR <span className="highlight-purple">WEB3</span>
                    </h1>

                    {/* Central Eye Particle Graphic */}
                    <div className="eye-container">
                        <div className="eye-outer">
                            <motion.div
                                className="eye-particle-ring"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            />
                            <div className="eye-core">
                                <div className="pupil" />
                            </div>
                        </div>
                    </div>

                    <motion.button
                        className="mvc-cta"
                        onClick={onEnter}
                        whileHover={{ scale: 1.05 }}
                    >
                        {isConnected ? 'ACCESS DASHBOARD' : 'INITIALIZE PROTOCOL'}
                        <MoveRight size={20} />
                    </motion.button>
                </motion.div>

                {/* Right Sidebar */}
                <motion.div
                    className="mvc-side-right"
                    variants={rightSidebarVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="orbital-group">
                        <div className="orbital-item">
                            <div className="planet bitcoin">B</div>
                            <span>Scaling Bitcoin</span>
                        </div>
                        <div className="orbital-item">
                            <div className="planet explore" />
                            <span>Onboard Web3</span>
                        </div>
                        <div className="orbital-item">
                            <div className="planet build" />
                            <span>Build Together</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* NEW EXTREME SECTIONS */}
            <div className="mvc-landing-expanded">
                {/* Tech Core Section */}
                <section className="landing-section">
                    <span className="section-tag">01 // THE_CORE</span>
                    <h2 className="section-title">ADVANCED_ZK <br /> TECHNOLOGY</h2>

                    <div className="tech-core-grid">
                        {[
                            { title: 'HYPER_SCALING', desc: 'Unlimited transaction throughput via ZK-Rollups on Bitcoin.', icon: <Zap /> },
                            { title: 'IDENTITY_VAULT', desc: 'Self-sovereign identity with recursive zero-knowledge proofs.', icon: <Shield /> },
                            { title: 'BITCOIN_L0', desc: 'Native bridging and asset security inherited from Layer 0.', icon: <Database /> },
                            { title: 'GLOBAL_ENCLAVE', desc: 'A decentralized network of secure verification nodes.', icon: <Globe /> }
                        ].map((tech, i) => (
                            <motion.div
                                key={i}
                                className="tech-card interactive-glass"
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{
                                    delay: i * 0.15,
                                    duration: 0.8,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                                whileHover={{ y: -10 }}
                            >
                                <div className="tech-icon-large">{tech.icon}</div>
                                <h3 className="mono" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>{tech.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>{tech.desc}</p>
                                <div className="card-glow-fx" />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Matrix Scrolling Section */}
                <div className="matrix-container">
                    <div className="matrix-feed">
                        <AnimatePresence>
                            {matrixData.map((line, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <MatrixLine text={line} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, transparent 20%, #000 80%)' }}>
                        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <Cpu size={40} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                            <h2 className="view-header">ATOMIC_EXECUTION</h2>
                            <p className="mono" style={{ fontSize: '0.7rem' }}>LIVE_NETWORK_THROUGHPUT: 50k+ TPS</p>
                        </div>
                    </div>
                </div>

                {/* Architecture Deep-Dive */}
                <section className="landing-section" style={{ background: 'rgba(90, 90, 254, 0.02)' }}>
                    <span className="section-tag">02 // ARCHITECTURE</span>
                    <h2 className="section-title" style={{ textAlign: 'center' }}>SYSTEM_STACK</h2>

                    <div className="arch-visual">
                        {[
                            { name: 'APPLICATION_LAYER', sub: 'dApps, Wallet, DEX', color: 'var(--accent-secondary)' },
                            { name: 'ZK_IDENTITY_VAULT', sub: 'Cryptography Enclave', color: 'var(--accent-primary)' },
                            { name: 'MVC_PROTOCOL', sub: 'Decentralized Smart Contracts', color: 'var(--accent-primary)' },
                            { name: 'BITCOIN_SETTLEMENT', sub: 'Layer 0 Security', color: 'var(--text-dim)' }
                        ].map((layer, i) => (
                            <React.Fragment key={i}>
                                <motion.div
                                    className="arch-layer"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    style={{ borderColor: layer.color }}
                                >
                                    <h3 className="mono" style={{ color: layer.color }}>{layer.name}</h3>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>{layer.sub}</p>
                                </motion.div>
                                {i < 3 && <div className="arch-connector" />}
                            </React.Fragment>
                        ))}
                    </div>
                </section>

                {/* Footer Section */}
                <footer className="landing-section" style={{ borderTop: 'var(--border-width) solid var(--border-dim)' }}>
                    <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                        <div>
                            <div className="nav-logo" style={{ marginBottom: '1rem' }}>MVC_LOGO</div>
                            <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                © 2026 MicroVisionChain. <br />
                                SECURE_DECENTRALIZED_SCALABLE.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '4rem' }}>
                            <div className="mono" style={{ fontSize: '0.8rem' }}>
                                <p style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>RESOURCES</p>
                                <a href="#" style={{ display: 'block', marginBottom: '0.5rem', transition: 'color 0.3s' }} className="hover-link">Whitepaper</a>
                                <a href="#" style={{ display: 'block', marginBottom: '0.5rem', transition: 'color 0.3s' }} className="hover-link">Docs</a>
                                <a href="https://github.com/chauhand2463" target="_blank" rel="noopener noreferrer" style={{ display: 'block', transition: 'color 0.3s' }} className="hover-link">GitHub</a>
                            </div>
                            <div className="mono" style={{ fontSize: '0.8rem' }}>
                                <p style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>ECOSYSTEM</p>
                                <a href="#" style={{ display: 'block', marginBottom: '0.5rem', transition: 'color 0.3s' }} className="hover-link">DAO</a>
                                <a href="#" style={{ display: 'block', marginBottom: '0.5rem', transition: 'color 0.3s' }} className="hover-link">Bridge</a>
                                <a href="#" style={{ display: 'block', transition: 'color 0.3s' }} className="hover-link">Grants</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Background Effects */}
            <div className="mvc-bg-fx">
                <div className="noise-overlay" />
                <motion.div
                    className="mouse-glow"
                    style={{
                        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(90, 90, 254, 0.08), transparent 40%)`
                    }}
                />
            </div>
        </div>
    );
};

export default LandingPage;
