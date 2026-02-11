const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// In-memory "DB" for demonstration (In production, use MongoDB/PostgreSQL)
let identities = [];
let logs = [];
let stats = {
    totalIdentities: 0,
    totalProofs: 0,
    successRate: 0,
    pendingVerifications: 0,
    revokedIdentities: 0
};

// Helper to update success rate
const updateSuccessRate = () => {
    if (logs.length === 0) return;
    const successes = logs.filter(l => l.success).length;
    stats.successRate = Math.floor((successes / logs.length) * 100);
};

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'HEALTHY',
        system: 'ZK_IDENTITY_BACKEND_v1.0',
        uptime: process.uptime()
    });
});

// Get global stats
app.get('/api/stats', (req, res) => {
    res.json({
        ...stats,
        totalIdentities: identities.length,
        totalProofs: logs.length
    });
});

// Store identity metadata (Non-sensitive)
app.post('/api/identities', (req, res) => {
    const { address, identityHash, university } = req.body;

    if (!address || !identityHash) {
        return res.status(400).json({ error: 'MISSING_DATA' });
    }

    const exists = identities.find(id => id.address === address);
    if (exists) {
        return res.status(409).json({ error: 'IDENTITY_ALREADY_STORED' });
    }

    const newIdentity = {
        address,
        identityHash,
        university,
        createdAt: new Date()
    };

    identities.push(newIdentity);
    console.log(`[BACKEND] Stored identity for ${address}`);

    res.status(201).json({ message: 'IDENTITY_METADATA_STORED', id: newIdentity });
});

// Log ZK Proof Submission
app.post('/api/logs/proof', (req, res) => {
    const { address, type, txHash, success } = req.body;

    const logEntry = {
        address,
        type,
        txHash,
        success,
        timestamp: new Date()
    };

    logs.push(logEntry);
    updateSuccessRate();
    console.log(`[BACKEND] Proof Logged: ${type} for ${address} - Success: ${success}`);

    res.status(201).json({ message: 'PROOF_LOGGED' });
});

// Get Audit Logs
app.get('/api/logs/:address', (req, res) => {
    const userLogs = logs.filter(l => l.address.toLowerCase() === req.params.address.toLowerCase());
    res.json(userLogs);
});

app.listen(PORT, () => {
    console.log(`
    =========================================
    🚀 ZK_IDENTITY BACKEND SERVER
    PORT: ${PORT}
    STATUS: ACTIVE
    =========================================
    `);
});
