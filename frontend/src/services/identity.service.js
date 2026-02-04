import { ethers } from 'ethers';
import IdentityRegistryArtifact from '../contracts/IdentityRegistry.json';

const EXPECTED_CHAIN_ID = import.meta.env.VITE_CHAIN_ID;
const IDENTITY_REGISTRY_ADDRESS = import.meta.env.VITE_IDENTITY_REGISTRY;
const IdentityRegistryABI = IdentityRegistryArtifact.abi;

/**
 * Identity Service
 * Centralized logic with Environment Lockdown (Phase 7).
 */

export const getRegistryContract = async (signerOrProvider) => {
    // Security Guard: Enforce correct network
    // Signers in v6 don't have getNetwork, but their providers do
    const provider = signerOrProvider.provider || signerOrProvider;
    const network = await provider.getNetwork();

    if (!EXPECTED_CHAIN_ID) {
        throw new Error("SECURITY_ALERT: VITE_CHAIN_ID is not defined in environment.");
    }

    if (network.chainId.toString() !== EXPECTED_CHAIN_ID.toString()) {
        throw new Error(`SECURITY_ALERT: Incorrect network detected. Expected Chain ID ${EXPECTED_CHAIN_ID}, found ${network.chainId}.`);
    }

    return new ethers.Contract(
        IDENTITY_REGISTRY_ADDRESS,
        IdentityRegistryABI,
        signerOrProvider
    );
};

export const getIdentityVerificationStatus = async (address) => {
    if (!address) return null;

    const provider = new ethers.BrowserProvider(window.ethereum);
    // Note: getRegistryContract now includes the chain ID check
    const registry = await getRegistryContract(provider);

    try {
        const [isRegistered, isAgeVerified, isNatVerified, isStuVerified] = await Promise.all([
            registry.isRegistered(address),
            registry.isAgeVerified(address),
            registry.isNationalityVerified(address),
            registry.isStudentVerified(address)
        ]);

        return {
            registered: isRegistered,
            age: isAgeVerified,
            nationality: isNatVerified,
            student: isStuVerified,
            fullyVerified: isAgeVerified && isNatVerified && isStuVerified
        };
    } catch (error) {
        console.error("SERVICE_ERROR: Status fetch failed", error);
        throw error;
    }
};

export const registerIdentityOnChain = async (did) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const registry = await getRegistryContract(signer);

    const tx = await registry.registerIdentity(did);
    await tx.wait();
    return tx.hash;
};
