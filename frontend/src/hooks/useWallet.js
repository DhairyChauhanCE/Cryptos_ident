import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

/**
 * useWallet Hook
 * Manages the connection state to the user's Ethereum wallet.
 */

export function useWallet() {
    const [wallet, setWallet] = useState({
        address: null,
        isConnected: false,
        chainId: null,
        error: null
    });

    const connect = async () => {
        if (!window.ethereum) {
            setWallet(prev => ({ ...prev, error: 'NO_METAMASK' }));
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const network = await provider.getNetwork();

            setWallet({
                address: accounts[0],
                isConnected: true,
                chainId: network.chainId.toString(),
                error: null
            });
        } catch (err) {
            setWallet(prev => ({ ...prev, error: err.message }));
        }
    };

    const disconnect = () => {
        setWallet({
            address: null,
            isConnected: false,
            chainId: null,
            error: null
        });
    };

    useEffect(() => {
        if (window.ethereum) {
            const handleAccounts = (accounts) => {
                if (accounts.length > 0) {
                    setWallet(prev => ({ ...prev, address: accounts[0], isConnected: true }));
                } else {
                    setWallet(prev => ({ ...prev, address: null, isConnected: false }));
                }
            };

            const handleChain = (chainId) => {
                setWallet(prev => ({ ...prev, chainId: parseInt(chainId, 16).toString() }));
            };

            window.ethereum.on('accountsChanged', handleAccounts);
            window.ethereum.on('chainChanged', handleChain);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccounts);
                window.ethereum.removeListener('chainChanged', handleChain);
            };
        }
    }, []);

    const switchNetwork = async () => {
        const targetChainId = import.meta.env.VITE_CHAIN_ID;
        if (!window.ethereum || !targetChainId) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${parseInt(targetChainId).toString(16)}` }],
            });
        } catch (err) {
            // This error code means the chain has not been added to MetaMask
            if (err.code === 4902) {
                const chainParams = targetChainId === '31337' ? {
                    chainId: '0x7a69',
                    chainName: 'Hardhat Local',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['http://127.0.0.1:8545'],
                } : {
                    chainId: '0x13882',
                    chainName: 'Polygon Amoy',
                    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                    rpcUrls: ['https://rpc-amoy.polygon.technology'],
                    blockExplorerUrls: ['https://amoy.polygonscan.com/'],
                };

                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [chainParams],
                });
            }
        }
    };

    return { ...wallet, connect, disconnect, switchNetwork };
}
