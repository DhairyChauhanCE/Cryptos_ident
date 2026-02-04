import * as snarkjs from 'snarkjs';

/**
 * ZK Proof Utility Functions
 */

/**
 * Generate a ZK proof for a given circuit
 * @param {string} circuitName Name of the circuit (e.g., 'age_verification')
 * @param {Object} inputs Private and public inputs
 * @returns {Promise<Object>} The proof and public signals
 */
export const generateProof = async (circuitName, inputs) => {
    console.log(`Generating proof for ${circuitName}...`);

    const wasmPath = `/circuits/${circuitName}/${circuitName}.wasm`;
    const zkeyPath = `/circuits/${circuitName}/${circuitName}_final.zkey`;

    try {
        // Note: In a browser environment, WASM and zkey are fetched from public folder
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            inputs,
            wasmPath,
            zkeyPath
        );

        return { proof, publicSignals };
    } catch (error) {
        console.error('Error generating proof:', error);
        throw error;
    }
};

/**
 * Format proof and public signals for Solidity call
 * @param {Object} proof Groth16 proof object
 * @param {Array} publicSignals Array of public signals
 * @returns {Object} Formatted calldata components (a, b, c, input)
 */
export const formatCalldata = (proof, publicSignals) => {
    // Format the proof for the verifier contract
    const pA = [proof.pi_a[0], proof.pi_a[1]];
    const pB = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
    ];
    const pC = [proof.pi_c[0], proof.pi_c[1]];

    return { a: pA, b: pB, c: pC, input: publicSignals };
};

/**
 * Verify a proof locally (optional, before submitting on-chain)
 * @param {string} circuitName Name of the circuit
 * @param {Object} proof The proof
 * @param {Array} publicSignals The public signals
 * @returns {Promise<boolean>} Whether the proof is valid
 */
export const verifyProofLocally = async (circuitName, proof, publicSignals) => {
    const vkeyPath = `/circuits/${circuitName}/verification_key.json`;
    const vkeyResponse = await fetch(vkeyPath);
    const vkey = await vkeyResponse.json();

    const res = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    return res;
};
