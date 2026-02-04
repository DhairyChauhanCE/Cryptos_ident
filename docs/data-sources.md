# Data Sources & Single Source of Truth (SSOT)

This document defines the authoritative source for every piece of data displayed in the UI. If a data point is not listed here, it is considered "untrusted" or "mock" and must be removed.

| UI Element | Source of Truth | Access Method |
| :--- | :--- | :--- |
| **Wallet Address** | `window.ethereum` (EIP-1193) | `ethers.BrowserProvider` |
| **DID (Decentralized ID)** | `IdentityRegistry.sol` | `registry.getIdentity(address)` |
| **Age Verification** | `IdentityRegistry.sol` | `registry.isAgeVerified(address)` |
| **Nationality Verification** | `IdentityRegistry.sol` | `registry.isNationalityVerified(address)` |
| **Student Verification** | `IdentityRegistry.sol` | `registry.isStudentVerified(address)` |
| **Vault Integrity** | Local AES-256 Vault + SHA-256 Hash | `identityStorage.js` |
| **Market Data** | Simulated Chainlink Oracle (Local Dev) | `CurrencyExchange.jsx` |
| **ZK Circuit Config** | `/public/circuits/*.zkey` | `snarkjs.groth16.fullProve` |

## Data Flow Protocol
1. **Request**: UI triggers a service call (e.g., `identity.service.js`).
2. **Fetch**: Service queries the Blockchain or Local Vault.
3. **Validate**: Proofs are verified on-chain or locally.
4. **State Update**: React Hook (`useIdentity`) updates the UI state machine.

**NO HARDCODED BOOLEANS ALLOWED.**
