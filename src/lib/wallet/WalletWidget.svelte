<script lang="ts">
	import type { Chain } from '$lib/helpers/chain';
	import type { ConnectedStrategyInfo } from 'trade-executor/models/strategy-info';
	import { goto } from '$app/navigation';
	import { wizard } from 'wizard/store';
	import { modal, wallet } from '$lib/wallet/client';
	import { Button, HashAddress } from '$lib/components';
	import IconWallet from '~icons/local/wallet';

	export let chain: Chain;
	export let strategy: ConnectedStrategyInfo;

	function launchConnectWizard() {
		wizard.init('connect-wallet', `/strategies/${strategy.id}`, {
			chain,
			strategyName: strategy.name,
			onChainData: strategy.on_chain_data
		});
		goto(`/wizard/connect-wallet/introduction`);
	}
</script>

<div class="wallet-widget">
	{#if $wallet.isConnected}
		<Button size="sm" on:click={() => modal.open({ view: 'Account' })}>
			<span class="address">
				<IconWallet --icon-size="1.25em" />
				<HashAddress address={$wallet.address} endChars={7} />
			</span>
		</Button>
	{:else}
		<Button size="sm" label="Connect wallet" on:click={launchConnectWizard}>
			<IconWallet slot="icon" />
		</Button>
	{/if}
</div>

<style>
	.address {
		display: grid;
		grid-auto-flow: column;
		gap: 1ex;
		align-items: center;
		height: 1.25rem;
		max-width: 10rem;
		font: var(--f-ui-sm-medium);
		letter-spacing: var(--ls-ui-sm);

		:global(.icon) {
			transform: translateY(-0.125ex);
		}
	}
</style>
