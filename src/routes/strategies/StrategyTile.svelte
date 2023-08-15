<script lang="ts">
	import type { StrategyRuntimeState } from 'trade-executor/strategy/runtime-state';
	import { fromUnixTime } from 'date-fns';
	import { determinePriceChangeClass } from '$lib/helpers/price';
	import {
		formatDollar,
		formatDaysAgo,
		formatKeyMetricNumber,
		formatPercent,
		formatPriceChange
	} from '$lib/helpers/formatters';
	import { getTradeExecutorErrorHtml } from 'trade-executor/strategy/error';
	import { getLogoUrl } from '$lib/helpers/assets';
	import { Alert, Button, Tooltip } from '$lib/components';
	import ChartThumbnail from './ChartThumbnail.svelte';
	import KeyMetric from './KeyMetric.svelte';

	export let strategy: StrategyRuntimeState;
	export let chartStartDate: Date | undefined = undefined;

	const summaryStats = strategy.summary_statistics ?? {};
	const chartData = summaryStats.performance_chart_90_days?.map(([ts, val]) => [fromUnixTime(ts), val]);
	const errorHtml = getTradeExecutorErrorHtml(strategy);
	const backtestLink = `/strategies/${strategy.id}/backtest`;
	const onChainData = strategy.on_chain_data ?? {};
	const assetManagementMode = onChainData.asset_management_mode;
	const chainSlug = getChainSlug(onChainData);

	// FIXME: hack to get chain slug from chain ID;
	// This should either come from strategy metadata or `chains` API
	function getChainSlug({ chain_id }: Record<string, any>) {
		switch (chain_id) {
			case 1:
				return 'ethereum';
			case 137:
				return 'polygon';
		}
	}

	// FIXME: hack to infer list of tokens based on strategy ID;
	// In the future this will come from the strategy configuration.
	function getStrategyBadges(strategy: StrategyRuntimeState) {
        debugger;
	}
</script>

<li class="strategy tile tile b">
	<ChartThumbnail data={chartData} startDate={chartStartDate} />
	<div class="info">
		<div class="details">
			<h2 class="title">{strategy.name}</h2>

			<div class="description">
				{#if strategy.short_description}
					<p>{strategy.short_description}</p>
				{/if}
			</div>

			<dl>
				<KeyMetric name="Profitability" metric={summaryStats?.key_metrics?.profitability} {backtestLink} let:value>
					<span class={determinePriceChangeClass(value)}>{formatPriceChange(value)}</span>
				</KeyMetric>

				<KeyMetric
					name="Total assets"
					metric={summaryStats?.key_metrics?.total_equity}
					formatter={formatDollar}
					{backtestLink}
				/>
			</dl>

			<dl>
				<KeyMetric name="Age" metric={summaryStats?.key_metrics?.started_at} formatter={formatDaysAgo} {backtestLink} />

				<KeyMetric
					name="Maximum drawdown"
					metric={summaryStats?.key_metrics?.max_drawdown}
					formatter={formatPercent}
					{backtestLink}
				/>
			</dl>

			<dl>
				<KeyMetric
					name="Sharpe"
					metric={summaryStats?.key_metrics?.sharpe}
					formatter={formatKeyMetricNumber}
					{backtestLink}
				/>

				<KeyMetric
					name="Sortino"
					metric={summaryStats?.key_metrics?.sortino}
					formatter={formatKeyMetricNumber}
					{backtestLink}
				/>
			</dl>

			<!-- TODO: make part of strategy configuration -->
			<div class="logos">
				{#if assetManagementMode === 'enzyme'}
					<Tooltip>
						<img slot="trigger" alt="Enzyme vault" src={getLogoUrl('token', 'enzyme')} />
						<span slot="popup">This strategy's assets are managed using an Enzyme vault</span>
					</Tooltip>
				{:else if assetManagementMode === 'hot_wallet'}
					<Tooltip>
						<img slot="trigger" alt="Hot wallet" src={getLogoUrl('wallet', 'metamask')} />
						<span slot="popup">This strategy's assets are managed using a hot wallet</span>
					</Tooltip>
				{/if}

				{#if chainSlug}
					{@const chainName = `${chainSlug.charAt(0).toUpperCase()}${chainSlug.slice(1)}`}
					<Tooltip>
						<img slot="trigger" alt={chainName} src={getLogoUrl('blockchain', chainSlug)} />
						<span slot="popup">This strategy runs on {chainName} blockchain</span>
					</Tooltip>
				{/if}

				{#each getStrategyBadges(strategy) as token}
					{@const symbol = token.toUpperCase()}
					<Tooltip>
						<img slot="trigger" alt={symbol} src={getLogoUrl('token', token)} />
						<span slot="popup">This strategy trades {symbol}</span>
					</Tooltip>
				{/each}
			</div>
		</div>

		{#if errorHtml}
			<Alert status="warning" size="xs" title="Ongoing execution issues">
				{@html errorHtml}
			</Alert>
		{/if}

		<Button label="View strategy" href="/strategies/{strategy.id}" tertiary size="lg" disabled={!strategy.connected} />
	</div>
</li>

<style lang="postcss">
	li {
		display: grid;
		border-radius: var(--strategy-tile-border-radius, var(--radius-md));
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		grid-template-rows: auto;
		grid-auto-rows: 1fr;
		list-style: none;
		overflow: hidden;
	}

	.info {
		display: grid;
		grid-template-rows: 1fr auto;
		gap: var(--strategy-tile-info-gap, var(--space-lg));
		padding: var(--space-lg);
	}

	.details {
		display: grid;
		gap: var(--strategy-tile-details-gap, var(--space-md));
		align-content: start;
	}

	.title {
		font: var(--f-ui-large-medium);
		letter-spacing: var(--f-ui-xxl-spacing, normal);
	}

	dl {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-ss);
		margin: 0;
	}

	.description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		overflow: hidden;
	}

	.logos {
		display: flex;
		gap: var(--space-xs);

		& img {
			width: 2rem;
			aspect-ratio: 1;
		}
	}
</style>
