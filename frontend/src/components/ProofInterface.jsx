import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ShieldCheck, Lock, Fingerprint } from 'lucide-react';
import { proveOnChain } from '../services/proof.service';

/**
 * ProofInterface Component
 * High-fidelity HUD for the ZK-SNARK Proving Engine.
 * NO MOCK DATA. NO RAW DATA DISPLAY (Phase 9).
 */
const STAGES = {
    IDLE: 'IDLE',
    WITNESS: 'WITNESS_GEN',
    PROVING: 'PROVING',
    VERIFYING: 'ON_CHAIN_VERIFY',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR'
};

const ProofInterface = ({ identity, address }) => {
    const [status, setStatus] = useState(STAGES.IDLE);
    const [progress, setProgress] = useState(0);
    const [txHash, setTxHash] = useState(null);
    const [logs, setLogs] = useState([
        { type: 'info', msg: 'ZKP_SUBSYSTEM_INITIALIZED', time: new Date().toLocaleTimeString() }
    ]);
    const [showTooltip, setShowTooltip] = useState(false);
    const consoleRef = useRef(null);

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev.slice(-15), { type, msg: msg.toUpperCase(), time: new Date().toLocaleTimeString() }]);
    };

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [logs]);

    const executeProofFlow = async (type, label) => {
        if (!identity) return;
        setStatus(STAGES.WITNESS);
        setProgress(20);
        setTxHash(null);
        addLog(`INITIATING_${label}_PROOF_FLOW...`, 'warn');

        try {
            const nonce = Math.floor(Math.random() * 1000000);
            const now = new Date();
            const today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

            const baseInputs = {
                dob: identity.dob,
                nationality: identity.nationality,
                studentId: identity.studentId || 0,
                userSalt: BigInt('0x' + identity.salt).toString(),
                identityHash: identity.identityHash,
                nonce
            };

            let inputs = { ...baseInputs };

            if (type === 'AGE') {
                inputs = { ...inputs, currentDate: today, minAge: 18 };
            } else if (type === 'NATIONALITY') {
                inputs = { ...inputs, requiredCountry: identity.nationality };
            } else if (type === 'UNIVERSITY') {
                inputs = { ...inputs, universityCode: identity.university, expectedUniversity: identity.university };
            }

            addLog('GENERATING_WITNESS_WITHOUT_DATA_LEAK...', 'info');

            // Artificial delay for UX feel (Witness Gen)
            await new Promise(r => setTimeout(r, 800));

            setStatus(STAGES.PROVING);
            setProgress(50);
            addLog('CALCULATING_GROTH16_PROOF...', 'info');

            const hash = await proveOnChain(type, inputs, (p) => {
                // Future point: hook into snarkjs status if possible
                if (p > 50) setProgress(p);
            });

            setStatus(STAGES.VERIFYING);
            setProgress(85);
            addLog('WAITING_FOR_CONTRACT_VERIFICATION...', 'info');

            setTxHash(hash);
            setStatus(STAGES.SUCCESS);
            setProgress(100);

            // Log to Backend (Phase 13 Integration)
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                await fetch(`${backendUrl}/api/logs/proof`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address,
                        type,
                        txHash: hash,
                        success: true
                    })
                });
            } catch (err) {
                console.warn("BACKEND_LOGGING_FAILED:", err);
            }

            addLog(`PROOF_ACCEPTED_ON_CHAIN // TX: ${hash.slice(0, 16)}...`, 'success');
            addLog(`${label}_CLEARANCE_GRANTED`, 'success');
        } catch (error) {
            setStatus(STAGES.ERROR);
            setProgress(0);
            addLog(`PROVING_FAILURE: ${error.message}`, 'error');
            console.error(error);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const isProcessing = status !== STAGES.IDLE && status !== STAGES.SUCCESS && status !== STAGES.ERROR;

    return (
        <motion.div className="proof-container" variants={containerVariants} initial="hidden" animate="visible">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <motion.h2 className="mono" variants={itemVariants} style={{ fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '0.2em', margin: 0 }}>
                        PROVING_ENGINE_V2_HUD
                    </motion.h2>
                    <div style={{ position: 'relative' }}>
                        <HelpCircle
                            size={14}
                            style={{ color: 'var(--accent-primary)', cursor: 'pointer', opacity: 0.6 }}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        />
                        <AnimatePresence>
                            {showTooltip && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '150%',
                                        left: '-10px',
                                        width: '240px',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--accent-primary)',
                                        padding: '1rem',
                                        zIndex: 100,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    <h4 className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>PRIVACY_PROTOCOL_INFO</h4>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                                        ZK-SNARKs allow you to generate a mathematical proof of your eligibility (e.g., Age &gt; 18)
                                        <span style={{ color: 'var(--text-main)' }}> without revealing your raw data</span> to the blockchain or dapp.
                                        The proof is verified on-chain, but your sensitive data never leaves this encrypted browser vault.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="hud-status-badge mono" style={{
                    fontSize: '0.6rem',
                    padding: '0.2rem 0.6rem',
                    border: '1px solid var(--border-dim)',
                    color: status === STAGES.SUCCESS ? 'var(--accent-primary)' : status === STAGES.ERROR ? 'var(--accent-red)' : 'var(--text-dim)'
                }}>
                    SYSTEM_STATUS: {status}
                </div>
            </div>

            {isProcessing && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginBottom: '2rem' }}
                >
                    <div className="flex-between mono" style={{ fontSize: '0.6rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
                        <span>ORCHESTRATING_ZK_STAGES</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="bar-bg" style={{ height: '2px', background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                            className="bar-fill"
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', stiffness: 50 }}
                            style={{ height: '100%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }}
                        />
                    </div>
                </motion.div>
            )}

            <motion.div className="proof-grid" variants={containerVariants}>
                <ProofAction
                    label="AGE_CONSENT"
                    desc="PROVE ADULT STATUS"
                    loading={isProcessing}
                    onClick={() => executeProofFlow('AGE', 'AGE')}
                    accent="primary"
                />
                <ProofAction
                    label="NATIONALITY_ASSERT"
                    desc="PROVE ORIGIN MATCH"
                    loading={isProcessing}
                    onClick={() => executeProofFlow('NATIONALITY', 'NAT')}
                    accent="primary"
                />
                <ProofAction
                    label="ACADEMIC_INTEGRITY"
                    desc="PROVE STUDENT STATUS"
                    loading={isProcessing}
                    accent="secondary"
                    onClick={() => executeProofFlow('UNIVERSITY', 'EDU')}
                />
            </motion.div>

            {txHash && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="tx-receipt-card mono"
                    style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        border: '1px solid var(--border-bright)',
                        background: 'rgba(0, 255, 153, 0.03)',
                        fontSize: '0.7rem'
                    }}
                >
                    <div style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>TRANSACTION_SUCCESS_ORDINAL: 0x{txHash.slice(2, 10)}...</div>
                    <a
                        href={`https://amoy.polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}
                    >
                        VIEW_ON_POLYGONSCAN_AMOY
                    </a>
                </motion.div>
            )}

            <motion.div className="security-console" variants={itemVariants} ref={consoleRef}>
                <AnimatePresence initial={false}>
                    {logs.map((log, i) => (
                        <motion.div key={i} className={`log-entry ${log.type}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                            <span className="log-timestamp">[{log.time}]</span>
                            <span className="log-msg">{log.msg}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

const ProofAction = ({ label, desc, loading, onClick, accent = 'primary' }) => (
    <motion.div className="proof-action" style={{ borderColor: `var(--accent-${accent})` }}>
        <div className="flex-between">
            <h3 style={{ fontSize: '0.8rem', color: `var(--accent-${accent})`, marginBottom: '0.5rem' }}>{label}</h3>
            {loading && <span className="pulsing-dot" style={{ background: `var(--accent-${accent})`, boxShadow: `0 0 10px var(--accent-${accent})` }} />}
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginBottom: '1rem' }}>{desc}</p>
        <button className="btn-primary" disabled={loading} onClick={onClick} style={{ fontSize: '0.65rem' }}>
            {loading ? 'PROCESSING...' : 'EXECUTE_PROOF'}
        </button>
    </motion.div>
);

export default ProofInterface;
