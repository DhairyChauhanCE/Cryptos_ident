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
                registry.isAgeVerified(address),
                registry.isNationalityVerified(address),
                registry.isStudentVerified(address),
                registry.isRevoked(address, 0), // AGE_OVER_18
                registry.isRevoked(address, 1), // NATIONALITY_MATCH
                registry.isRevoked(address, 2)  // UNIVERSITY_STUDENT
            ])
        ]);

        const [isAge, isNat, isStu, revAge, revNat, revStu] = acts;

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
 * Administrative Registration
 */
export const registerIdentityOnChain = async (did) => {
    // Use unified entry point (signer required)
    const registry = await getRegistryContract(false);
    const tx = await registry.registerIdentity(did);
    await tx.wait();
    return tx.hash;
};
bitumen
