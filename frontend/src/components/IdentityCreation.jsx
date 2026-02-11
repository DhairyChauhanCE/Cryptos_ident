import { useState } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { saveIdentity, generateSalt } from '../utils/identityStorage';
import { calculateIdentityHash } from '../utils/zkUtils';
import RegistryABI from '../contracts/IdentityRegistry.json';
import Deployment from '../contracts/deployment.json';

const IdentityCreation = ({ onIdentityCreated }) => {
    const [dob, setDob] = useState('');
    const [nationality, setNationality] = useState('1');
    const [university, setUniversity] = useState('1001');
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Request signature for encryption key
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const message = "Sign this message to encrypt/decrypt your ZK Identity locally. This session-locked vault is highly secure.";
            const signature = await signer.signMessage(message);
            const encryptionKey = ethers.keccak256(ethers.toUtf8Bytes(signature));

            // Format DOB: YYYY-MM-DD -> YYYYMMDD
            const dobNumber = dob.replace(/-/g, '');

            // 2. Generate identity data & cryptographic commitment
            const salt = generateSalt();
            const commitment = await calculateIdentityHash(
                dobNumber,
                nationality,
                studentId || '0',
                salt
            );

            const newIdentity = {
                dob: parseInt(dobNumber),
                nationality: parseInt(nationality),
                university: parseInt(university),
                studentId: parseInt(studentId) || 0,
                salt,
                identityHash: commitment,
                ageVerified: false,
                nationalityVerified: false,
                studentVerified: false
            };

            // 3. Register on-chain (IdentityRegistry)
            const registryContract = new ethers.Contract(
                Deployment.contracts.IdentityRegistry,
                RegistryABI.abi,
                signer
            );

            const tx = await registryContract.registerIdentity("0x" + BigInt(commitment).toString(16).padStart(64, '0'));
            await tx.wait();

            // 4. Store metadata in Backend (Phase 13 Integration)
            try {
                const address = await signer.getAddress();
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                await fetch(`${backendUrl}/api/identities`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address,
                        identityHash: commitment,
                        university: parseInt(university)
                    })
                });
            } catch (err) {
                console.warn("BACKEND_PERSISTENCE_FAILED: Stats will not be logged.", err);
            }

            // 5. Store encrypted locally (Phase 3: WebCrypto AES-GCM)
            await saveIdentity(newIdentity, signature);

            // 6. Callback
            onIdentityCreated(newIdentity, signature);
        } catch (error) {
            console.error("Identity creation failed:", error);
            alert("Security Error: Failed to register identity or initialize vault.");
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { x: -10, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="input-group" variants={itemVariants}>
                <span className="input-label">FULL_DATE_OF_BIRTH</span>
                <input
                    type="date"
                    className="input-field"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                />
                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: 'calc(var(--space-unit) / 2)', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                    SYSTEM_NOTICE: High-precision ZK verification enabled.
                </div>
            </motion.div>

            <motion.div className="input-group" variants={itemVariants}>
                <span className="input-label">NATIONALITY_CODE</span>
                <select
                    className="input-field"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                >
                    <option value="1">1 - UNITED STATES</option>
                    <option value="2">2 - UNITED KINGDOM</option>
                    <option value="3">3 - GERMANY</option>
                    <option value="4">4 - INDIA</option>
                    <option value="5">5 - OTHER</option>
                </select>
            </motion.div>

            <motion.div className="input-group" variants={itemVariants}>
                <span className="input-label">UNIVERSITY_CODE</span>
                <select
                    className="input-field"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                >
                    <option value="1001">1001 - MIT</option>
                    <option value="1002">1002 - STANFORD</option>
                    <option value="1003">1003 - HARVARD</option>
                    <option value="1004">1004 - OXFORD</option>
                    <option value="1005">1005 - OTHER</option>
                </select>
            </motion.div>

            <motion.div className="input-group" variants={itemVariants}>
                <span className="input-label">STUDENT_ID (PRIVATE)</span>
                <input
                    type="number"
                    className="input-field"
                    placeholder="ENTER_IDENTIFIER"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                />
            </motion.div>

            <motion.button
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variants={itemVariants}
                disabled={loading}
            >
                {loading ? 'INITIALIZING_SECURE_VAULT...' : 'GENERATE_PRIVATE_IDENTITY'}
            </motion.button>
        </motion.form>
    );
};

export default IdentityCreation;
