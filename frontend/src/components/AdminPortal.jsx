import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, Activity, Lock, AlertTriangle } from 'lucide-react';
import { getRegistryContract } from '../services/identity.service';

const AdminPortal = ({ address }) => {
    const [stats, setStats] = useState({
        totalIdentities: 0,
        pendingVerifications: 0,
        revokedIdentities: 0
    });
    const [loading, setLoading] = useState(true);
    const [revocationTarget, setRevocationTarget] = useState('');
    const [isRevoking, setIsRevoking] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch real logs from backend
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const response = await fetch(`${backendUrl}/api/stats`);
                const data = await response.json();

                setStats({
                    totalIdentities: data.totalIdentities,
                    pendingVerifications: data.pendingVerifications,
                    revokedIdentities: data.revokedIdentities
                });
            } catch (e) {
                console.error("ADMIN_CONNECTIVITY_ERROR:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleRevocation = async () => {
        if (!revocationTarget) return;
        setIsRevoking(true);
        try {
            const registry = await getRegistryContract(false);
            const tx = await registry.revokeIdentity(revocationTarget);
            await tx.wait();
            alert(`SUCCESS: Identity ${revocationTarget.slice(0, 10)}... has been permanently revoked.`);
            setRevocationTarget('');
        } catch (e) {
            console.error(e);
            alert("Revocation failed. Ensure you are the contract owner.");
        } finally {
            setIsRevoking(false);
        }
    };

    return (
        <div className="admin-portal">
            <h2 className="mono" style={{ marginBottom: '2rem', letterSpacing: '0.2em', color: 'var(--accent-red)' }}>
                ADMIN_SECURITY_OVERRIDE_PANEL
            </h2>

            <div className="dashboard-grid">
                <div className="col-left">
                    <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-red)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <ShieldAlert size={24} color="var(--accent-red)" />
                            <h3 className="mono" style={{ fontSize: '0.9rem' }}>IDENTITY_REVOCATION_SERVICE</h3>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            CRITICAL: Revoking an identity is an IRREVOCABLE action. This will black-list the user's identity hash from all ZK-verification gates and Emerald Exchange protocols.
                        </p>

                        <div className="input-group">
                            <label className="input-label">TARGET_IDENTITY_HASH (HEX)</label>
                            <input
                                type="text"
                                className="input-field mono"
                                placeholder="0x..."
                                value={revocationTarget}
                                onChange={(e) => setRevocationTarget(e.target.value)}
                                style={{ fontSize: '0.7rem' }}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            disabled={isRevoking || !revocationTarget}
                            onClick={handleRevocation}
                            style={{
                                width: '100%',
                                background: 'rgba(255, 51, 102, 0.1)',
                                color: 'var(--accent-red)',
                                border: '1px solid var(--accent-red)',
                                marginTop: 'var(--space-unit)'
                            }}
                        >
                            {isRevoking ? 'EXECUTING_REVOCATION...' : 'EXECUTE_PERMANENT_REVOCATION'}
                        </button>
                    </div>

                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--space-unit) * 2)' }}>
                        <h3 className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>SYSTEM_ALERTS</h3>
                        <div className="log-entry warn" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', color: 'var(--accent-secondary)' }}>
                            <AlertTriangle size={12} style={{ marginRight: '0.5rem' }} />
                            UNUSUAL_ACTIVITY_DETECTED: Multiple failed proofs from 0x71C...
                        </div>
                        <div className="log-entry info" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                            <div style={{ width: '4px', height: '4px', background: 'var(--text-dim)', borderRadius: '50%', marginRight: '0.5rem' }} />
                            REGISTRY_MAINTENANCE: Scheduled for 2026-02-15T00:00:00Z
                        </div>
                    </div>
                </div>

                <div className="col-right">
                    <div className="glass-card" style={{ height: '100%' }}>
                        <h3 className="mono" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>NETWORK_METRICS</h3>
                        <div className="tech-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="tech-item">
                                <Users size={20} className="tech-icon" />
                                <div className="tech-label">TOTAL_USERS</div>
                                <div className="tech-value">{stats.totalIdentities}</div>
                            </div>
                            <div className="tech-item" style={{ borderColor: 'var(--accent-secondary)' }}>
                                <Activity size={20} style={{ color: 'var(--accent-secondary)' }} />
                                <div className="tech-label">PENDING_VERIF</div>
                                <div className="tech-value" style={{ color: 'var(--accent-secondary)' }}>{stats.pendingVerifications}</div>
                            </div>
                            <div className="tech-item" style={{ borderColor: 'var(--accent-red)' }}>
                                <AlertTriangle size={20} color="var(--accent-red)" />
                                <div className="tech-label">REVOKED</div>
                                <div className="tech-value" style={{ color: 'var(--accent-red)' }}>{stats.revokedIdentities}</div>
                            </div>
                            <div className="tech-item">
                                <Lock size={20} className="tech-icon" />
                                <div className="tech-label">VAULTS_ACTIVE</div>
                                <div className="tech-value">94.2%</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2.5rem' }}>
                            <h4 className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>LIVE_NODE_MONITOR</h4>
                            <div style={{ height: '120px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-dim)', position: 'relative', overflow: 'hidden' }}>
                                {/* Heartbeat Animation */}
                                <motion.div
                                    animate={{
                                        x: [-20, 450],
                                        opacity: [0, 1, 1, 0]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: 0,
                                        width: '60px',
                                        height: '2px',
                                        background: 'var(--accent-primary)',
                                        boxShadow: '0 0 15px var(--accent-primary)'
                                    }}
                                />
                                <div style={{ position: 'absolute', bottom: '5px', right: '5px', fontSize: '0.5rem', color: 'var(--accent-red)', opacity: 0.5 }} className="mono">
                                    NODE_01_HEARTBEAT_ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPortal;
