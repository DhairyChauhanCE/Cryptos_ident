import { motion } from 'framer-motion';
import { LayoutDashboard, LogOut, ArrowRightLeft, Binary, BarChart3 } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const menuItems = [
        { id: 'registry', label: 'Identity Vault', icon: <LayoutDashboard size={18} /> },
        { id: 'prover', label: 'Proving System', icon: <Binary size={18} /> },
        { id: 'exchange', label: 'Emerald Exchange', icon: <ArrowRightLeft size={18} /> },
        { id: 'analytics', label: 'Security Hub', icon: <BarChart3 size={18} /> }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <h1 style={{ fontSize: '1.5rem', letterSpacing: '-0.05em' }}>CRYPTOS<span style={{ color: 'var(--accent-mint)' }}>.</span>ID</h1>
                    <div className="mono" style={{ fontSize: '0.5rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>EXTREME_EMERALD_v4.2</div>
                </motion.div>
            </div>

            <nav className="nav-list" style={{ flex: 1 }}>
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div
                    className="nav-item"
                    onClick={onLogout}
                    style={{ color: 'var(--accent-red)', opacity: 0.7 }}
                >
                    <LogOut size={18} />
                    <span>Terminate Session</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
