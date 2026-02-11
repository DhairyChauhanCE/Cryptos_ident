import { getRegistryContract } from './identity.service';

/**
 * Proof Service
 * Centralized logic for ZK proof generation and submission to Ethereum.
 * Uses Web Workers for background proving (Phase 3).
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

    // 1. Generate Proof via Web Worker
    const { proof, publicSignals } = await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/zkProver.worker.js', import.meta.url));

        worker.onmessage = (e) => {
            if (e.data.success) {
                resolve({ proof: e.data.proof, publicSignals: e.data.publicSignals });
            } else {
                reject(new Error(e.data.error));
            }
            worker.terminate();
        };

        worker.onerror = (err) => {
            reject(err);
            worker.terminate();
        };

        worker.postMessage({
            type,
            inputs,
            wasmPath,
            zkeyPath
        });
    });

    // 2. Submit Transaction
    const registry = await getRegistryContract(false);
    const callData = formatCalldata(proof, publicSignals);

    const tx = await registry[methodName](
        callData.a,
        callData.b,
        callData.c,
        callData.input
    );
    await tx.wait();

    return tx.hash;
};
