import { ethers } from 'ethers';
import IdentityRegistryArtifact from '../contracts/IdentityRegistry.json';

const EXPECTED_CHAIN_ID = import.meta.env.VITE_CHAIN_ID;
const IDENTITY_REGISTRY_ADDRESS = import.meta.env.VITE_IDENTITY_REGISTRY;
const IdentityRegistryABI = IdentityRegistryArtifact.abi;

/**
 * Network Assertion (Phase 12 Protection)
 * Prevents execution if the user is on the wrong blockchain.
 */
export async function assertNetwork(provider) {
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== Number(EXPECTED_CHAIN_ID)) {
        throw new Error(`SECURITY_ALERT: Wrong network connected. Expected ${EXPECTED_CHAIN_ID}, found ${net.chainId}.`);
    }
}

/**
 * Unified Identity Registry Entry Point
 * @param {boolean} readonly If true, returns a contract for viewing only
 */
export async function getRegistryContract(readonly = true) {
    if (!window.ethereum) throw new Error("NO_ETHEREUM_PROVIDER");

    const provider = new ethers.BrowserProvider(window.ethereum);
    await assertNetwork(provider);

    const signerOrProvider = readonly ? provider : await provider.getSigner();

    return new ethers.Contract(
        IDENTITY_REGISTRY_ADDRESS,
        IdentityRegistryABI,
        signerOrProvider
    );
}

/**
 * Fetches comprehensive verification status, including Revocation checks.
 */
export const getIdentityVerificationStatus = async (address) => {
    if (!address) return null;

    // Use unified entry point (readonly)
    const registry = await getRegistryContract(true);

    try {
        const [isRegistered, acts] = await Promise.all([
            registry.isRegistered(address),
            Promise.all([
                registry.isVerified(address, 0), // AGE_OVER_18
                registry.isVerified(address, 1), // NATIONALITY_MATCH
                registry.isVerified(address, 2), // UNIVERSITY_STUDENT
                registry.isRevoked(address, 0),
                registry.isRevoked(address, 1),
                registry.isRevoked(address, 2)
            ])
        ]);

        const [ageRes, natRes, stuRes, revAge, revNat, revStu] = acts;
        const isAge = ageRes[0];
        const isNat = natRes[0];
        const isStu = stuRes[0];

        return {
            registered: isRegistered,
            age: isAge && !revAge,
            nationality: isNat && !revNat,
            student: isStu && !revStu,
            revoked: {
                age: revAge,
                nationality: revNat,
                student: revStu
            },
            fullyVerified: (isAge && !revAge) && (isNat && !revNat) && (isStu && !revStu)
        };
    } catch (error) {
        console.error("SERVICE_ERROR: Status fetch failed", error);
        throw error;
    }
};

/**
 * Administrative Registration (Commitment-based)
 * @param {string} commitment The Poseidon hash (decimal string)
 */
export const registerIdentityOnChain = async (commitment) => {
    // Use unified entry point (signer required)
    const registry = await getRegistryContract(false);

    // Format commitment to bytes32 hex
    const formattedCommitment = "0x" + BigInt(commitment).toString(16).padStart(64, '0');

    const tx = await registry.registerIdentity(formattedCommitment);
    await tx.wait();
    return tx.hash;
};
