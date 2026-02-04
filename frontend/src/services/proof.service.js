import * as snarkjs from 'snarkjs';
import { getRegistryContract } from './identity.service';
import { ethers } from 'ethers';

/**
 * Proof Service
 * Centralized logic for ZK proof generation and submission to Ethereum.
 */

const formatCalldata = (proof, publicSignals) => {
    return {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
        input: publicSignals
    };
};

export const proveOnChain = async (type, inputs) => {
    let circuitName = '';
    let methodName = '';

    switch (type) {
        case 'AGE':
            circuitName = 'age_verification';
            methodName = 'verifyAge';
            break;
        case 'NATIONALITY':
            circuitName = 'nationality_verification';
            methodName = 'verifyNationality';
            break;
        case 'UNIVERSITY':
            circuitName = 'student_verification';
            methodName = 'verifyStudent';
            break;
        default:
            throw new Error(`UNKNOWN_PROOF_TYPE: ${type}`);
    }

    const wasmPath = `/circuits/${circuitName}/${circuitName}.wasm`;
    const zkeyPath = `/circuits/${circuitName}/${circuitName}.zkey`;

    // 1. Generate Proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputs,
        wasmPath,
        zkeyPath
    );

    // 2. Submit Transaction
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const registry = await getRegistryContract(signer);

    const callData = formatCalldata(proof, publicSignals);
    const tx = await registry[methodName](callData.a, callData.b, callData.c, callData.input);
    await tx.wait();

    return tx.hash;
};
