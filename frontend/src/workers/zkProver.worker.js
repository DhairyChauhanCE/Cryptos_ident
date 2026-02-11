import * as snarkjs from 'snarkjs';

/**
 * ZK Prover Worker
 * Handles heavy cryptographic proof generation in a background thread to prevent UI blocking.
 */
self.onmessage = async (e) => {
    const { type, inputs, wasmPath, zkeyPath } = e.data;

    try {
        console.log(`[WORKER] Generating ${type} proof...`);

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            inputs,
            wasmPath,
            zkeyPath
        );

        self.postMessage({
            success: true,
            proof,
            publicSignals
        });
    } catch (error) {
        console.error(`[WORKER] Proof generation error:`, error);
        self.postMessage({
            success: false,
            error: error.message
        });
    }
};
