# Mission-Specific Instruction Templates

## 🛡️ SECURITY_AUDITOR.md
**Objective**: Review smart contracts and ZK circuits for vulnerabilities.
**Focus Areas**:
1. **Replay Protection**: Verify nonces are used in both circuits (public signals) and contract state.
2. **Access Control**: Ensure only authorized participants can execute sensitive functions.
3. **Data Privacy**: Confirm that no PII (Personally Identifiable Information) is leaked in public signals.
4. **Encryption Integrity**: Validate that AES-256 keys are derived from high-entropy sources (e.g., wallet signatures).

## 🧩 ZK_SPECIALIST.md
**Objective**: Optimize circuits and manage trusted setup ceremonies.
**Focus Areas**:
1. **Constraint Optimization**: Minimize the number of constraints for faster client-side proving.
2. **Artifact Management**: Ensure WASM and zkey files are correctly generated and exposed to the frontend.
3. **Verification Logic**: Align the Solidity verifier output with the contract's verification calls.

## 🏗️ SYSTEM_ARCHITECT.md
**Objective**: Oversee end-to-end integration and UX/UI premium quality.
**Focus Areas**:
1. **State Management**: Ensure identity state (encrypted) persists correctly across sessions.
2. **Web3 Connectivity**: Monitor wallet connection stability and transaction feedback.
3. **Design System**: Maintain the "Emerald Deep Void" aesthetic and micro-animations.
