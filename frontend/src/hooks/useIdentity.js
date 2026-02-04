import { useState, useEffect } from 'react';
import { getIdentityVerificationStatus, getRegistryContract } from '../services/identity.service';
import { ethers } from 'ethers';

/**
 * useIdentity Hook
 * Implements a State Machine for Identity Status based on On-Chain Data.
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

            setStatus({
                state,
                details: data
            });
        } catch (error) {
            console.error("HOOK_ERROR: Status refresh failed", error);
            setStatus(prev => ({ ...prev, state: 'error' }));
        }
    };

    useEffect(() => {
        if (address) {
            refreshStatus();

            const setupListeners = async () => {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const registry = await getRegistryContract(provider);

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
