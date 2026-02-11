import { useState, useEffect } from 'react';
import { getIdentityVerificationStatus, getRegistryContract } from '../services/identity.service';

/**
 * useIdentity Hook
 * Implements a State Machine for Identity Status based on On-Chain Data.
 * Integrated Revocation Awareness (Phase 12).
 */
export function useIdentity(address) {
    const [status, setStatus] = useState({
        state: 'loading',
        details: null
    });

    const refreshStatus = async () => {
        if (!address) return;

        try {
            const data = await getIdentityVerificationStatus(address);

            let state = 'unverified';
            if (data.fullyVerified) state = 'verified';
            else if (data.age || data.nationality || data.student) state = 'partially_verified';

            // Critical Revocation Check
            const isAnyRevoked = Object.values(data.revoked || {}).some(v => v === true);
            if (isAnyRevoked) state = 'revoked';

            setStatus({
                state,
                details: data
            });
        } catch (error) {
            console.error("HOOK_ERROR: Status refresh failed", error);
            // Don't show error if it's just a network mismatch (service handles that alert)
            if (!error.message.includes("SECURITY_ALERT")) {
                setStatus(prev => ({ ...prev, state: 'error' }));
            }
        }
    };

    useEffect(() => {
        if (address) {
            refreshStatus();

            const setupListeners = async () => {
                try {
                    // Use readonly registry for event listening
                    const registry = await getRegistryContract(true);

                    const onUpdate = (user) => {
                        if (user.toLowerCase() === address.toLowerCase()) {
                            refreshStatus();
                        }
                    };

                    registry.on("IdentityRegistered", onUpdate);
                    registry.on("ClaimVerified", onUpdate);
                    registry.on("ClaimRevoked", onUpdate);

                    return () => {
                        registry.off("IdentityRegistered", onUpdate);
                        registry.off("ClaimVerified", onUpdate);
                        registry.off("ClaimRevoked", onUpdate);
                    };
                } catch (e) {
                    console.error("LISTEN_ERROR: Failed to attach event listeners", e);
                }
            };

            const cleanupPromise = setupListeners();
            return () => {
                cleanupPromise.then(cleanup => cleanup && cleanup());
            };
        } else {
            setStatus({ state: 'loading', details: null });
        }
    }, [address]);

    return { ...status, refresh: refreshStatus };
}
