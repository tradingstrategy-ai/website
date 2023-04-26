import { walletConnectConfig } from '$lib/config';
import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
	createClient,
	configureChains,
	connect,
	disconnect,
	watchAccount,
	watchNetwork,
	InjectedConnector
} from '@wagmi/core';
import { arbitrum, avalanche, bsc, mainnet, polygon } from '@wagmi/core/chains';
import { publicProvider } from '@wagmi/core/providers/public';
import { WalletConnectConnector } from '@wagmi/core/connectors/walletConnect';
import { w3mConnectors, w3mProvider } from '@web3modal/ethereum';

const { projectId } = walletConnectConfig;

// TODO: type defs for connector, address, chain
// TODO: improve type constraints for connected status (require name, address, etc.)
export interface Wallet {
	status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
	name?: 'MetaMask' | 'WalletConnect';
	address?: string;
	chain?: any;
	connector?: any;
}

const { subscribe, update }: Writable<Wallet> = writable({ status: 'connecting' });

let initialized = false;

export function initWalletClient() {
	if (!browser || initialized) return;

	const { chains, provider, webSocketProvider } = configureChains(
		[arbitrum, avalanche, bsc, mainnet, polygon],
		[w3mProvider({ projectId }), publicProvider()]
	);

	createClient({
		autoConnect: true,
		connectors: w3mConnectors({ projectId, version: 1, chains }),
		provider,
		webSocketProvider
	});

	// TODO: watch on first subscription; stop watching on last unsub
	watchNetwork((network) => {
		update((wallet) => ({ ...wallet, chain: network?.chain }));
	});

	// TODO: watch on first subscription; stop watching on last unsub
	watchAccount(({ address, status, connector }) => {
		update(({ chain }) => {
			return {
				status,
				address,
				name: connector?.name,
				connector,
				chain: status === 'connected' ? chain : undefined
			};
		});
	});

	initialized = true;
}

function connectMetaMask() {
	connect({
		connector: new InjectedConnector()
	});
}

function connectWalletConnect() {
	connect({
		connector: new WalletConnectConnector({
			options: { projectId }
		})
	});
}

export const wallet = { subscribe, connectMetaMask, connectWalletConnect, disconnect };