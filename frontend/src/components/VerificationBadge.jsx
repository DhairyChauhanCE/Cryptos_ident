const VerificationBadge = ({ label, verified }) => {
    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0.6rem 1.2rem',
            background: verified ? 'rgba(0, 255, 153, 0.05)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${verified ? 'var(--accent-mint)' : 'var(--border-dim)'}`,
            marginRight: '1rem',
            marginBottom: '1rem'
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: verified ? 'var(--accent-mint)' : 'var(--text-dim)',
                boxShadow: verified ? '0 0 10px var(--accent-mint)' : 'none'
            }}></div>
            <span className="mono" style={{
                fontSize: '0.7rem',
                color: verified ? 'var(--text-main)' : 'var(--text-dim)',
                letterSpacing: '0.1em'
            }}>
                {label}: {verified ? 'VERIFIED' : 'PENDING'}
            </span>
        </div>
    );
};

export default VerificationBadge;
