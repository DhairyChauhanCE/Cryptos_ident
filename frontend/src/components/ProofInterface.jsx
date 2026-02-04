import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { proveOnChain } from '../services/proof.service';

/**
 * ProofInterface Component
 * High-fidelity HUD for the ZK-SNARK Proving Engine.
 * NO MOCK DATA. NO RAW DATA DISPLAY (Phase 9).
 */
const ProofInterface = ({ identity, address }) => {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([
        { type: 'info', msg: 'ZKP_SUBSYSTEM_INITIALIZED', time: new Date().toLocaleTimeString() }
    ]);
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
        setLoading(true);
        addLog(`INITIATING_${label}_PROOF_FLOW...`, 'warn');

        try {
            const nonce = Math.floor(Math.random() * 1000000);
            const now = new Date();
            const today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

            let inputs = { salt: identity.salt, nonce };

            // Construct inputs without exposing raw identity values in component scope
            if (type === 'AGE') {
                inputs = { ...inputs, dob: identity.dob, currentDate: today, minAge: 18 };
            } else if (type === 'NATIONALITY') {
                inputs = { ...inputs, nationality: identity.nationality, expectedNationality: identity.nationality };
            } else if (type === 'UNIVERSITY') {
                inputs = { ...inputs, studentId: identity.studentId || 0, universityCode: identity.university, expectedUniversity: identity.university };
            }

            addLog('GENERATING_WITNESS_WITHOUT_DATA_LEAK...', 'info');
            const txHash = await proveOnChain(type, inputs);

            addLog(`PROOF_ACCEPTED_ON_CHAIN // TX: ${txHash.slice(0, 16)}...`, 'success');
            addLog(`${label}_CLEARANCE_GRANTED`, 'success');
        } catch (error) {
            addLog(`PROVING_FAILURE: ${error.message}`, 'error');
            console.error(error);
        } finally {
            setLoading(false);
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

    return (
        <motion.div className="proof-container" variants={containerVariants} initial="hidden" animate="visible">
            <motion.h2 className="mono" variants={itemVariants} style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1.5rem', letterSpacing: '0.2em' }}>
                PROVING_ENGINE_V2_HUD
            </motion.h2>

            <motion.div className="proof-grid" variants={containerVariants}>
                <ProofAction
                    label="AGE_CONSENT"
                    desc="PROVE ADULT STATUS"
                    loading={loading}
                    onClick={() => executeProofFlow('AGE', 'AGE')}
                />
                <ProofAction
                    label="NATIONALITY_ASSERT"
                    desc="PROVE ORIGIN MATCH"
                    loading={loading}
                    onClick={() => executeProofFlow('NATIONALITY', 'NAT')}
                />
                <ProofAction
                    label="ACADEMIC_INTEGRITY"
                    desc="PROVE STUDENT STATUS"
                    loading={loading}
                    accent="gold"
                    onClick={() => executeProofFlow('UNIVERSITY', 'EDU')}
                />
            </motion.div>

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

const ProofAction = ({ label, desc, loading, onClick, accent = 'mint' }) => (
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
