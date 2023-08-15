/**
 * Strategy runtime state fetching.
 */

import { getConfiguredStrategies } from './configuration';
import type { StrategyConfiguration } from './configuration';
// https://github.com/fram-x/assert-ts/issues/23
import { assert } from 'assert-ts';
import loadError from '../assets/load-error.jpg';
import type { UnixTimestamp } from 'trade-executor/state/interface';

type Nullable<Type> = Type | null;
type PerformanceTuple = [number, number];
type Address = `0x${string}`;

/**
 * StrategySummaryStatistics describes summary-level performance metrics for a strategy.
 *
 * See https://github.com/tradingstrategy-ai/trade-executor/blob/master/tradeexecutor/strategy/summary.py
 */
export interface StrategySummaryStatistics {
	calculated_at: number;
	first_trade_at: Nullable<number>;
	last_trade_at: Nullable<number>;
	enough_data: Nullable<boolean>;
	current_value: Nullable<number>;
	profitability_90_days: Nullable<number>;
	performance_chart_90_days: Nullable<PerformanceTuple[]>;
	return_all_time: Nullable<number>;
	return_annualised: Nullable<number>;
}

/**
 * OnChainData types describe metadata related to management of fund assets
 *
 * See: https://github.com/tradingstrategy-ai/trade-executor/blob/master/tradeexecutor/state/metadata.py
 */
interface CommonChainData {
	chain_id: number;
}

interface SmartContracts {
	address_list_registry: Nullable<Address>;
	comptroller: Nullable<Address>;
	comptroller_lib: Nullable<Address>;
	deployer: Nullable<Address>;
	dispatcher: Nullable<Address>;
	external_position_factory: Nullable<Address>;
	external_position_manager: Nullable<Address>;
	fee_manager: Nullable<Address>;
	fund_deployer: Nullable<Address>;
	fund_value_calculator: Nullable<Address>;
	gas_relay_paymaster_factory: Nullable<Address>;
	gas_relay_paymaster_lib: Nullable<Address>;
	generic_adapter: Nullable<Address>;
	integration_manager: Nullable<Address>;
	payment_forwarder: Nullable<Address>;
	policy_manager: Nullable<Address>;
	protocol_fee_reserve_lib: Nullable<Address>;
	protocol_fee_reserve_proxy: Nullable<Address>;
	protocol_fee_tracker: Nullable<Address>;
	value_interpreter: Nullable<Address>;
	vault: Nullable<Address>;
	vault_lib: Nullable<Address>;
}

interface EnzymeChainData extends CommonChainData {
	asset_management_mode: 'enzyme';
	smart_contracts: Partial<SmartContracts>;
}

interface HotWalletChainData extends CommonChainData {
	asset_management_mode: 'hot_wallet';
	smart_contracts: SmartContracts;
}

export type OnChainData = EnzymeChainData | HotWalletChainData;

/**
 * RuntimeState describes strategy information not related to the profit generation.
 *
 * This includes properties provided by the backend API, augmented with additional properties
 * client-side (e.g., link, config, error).
 *
 * See https://github.com/tradingstrategy-ai/trade-executor/blob/master/tradeexecutor/state/metadata.py
 */
export interface StrategyRuntimeState {
	// Did we manage to connect to this strategy webhook
	connected: boolean;

	// From strategy config object
	id: string;
	// From backend API
	name: string;
	short_description: Nullable<string>;
	long_description: Nullable<string>;
	icon_url: string;
	started_at: number;
	executor_running: boolean;
	on_chain_data: OnChainData;
	summary_statistics: StrategySummaryStatistics;
	// Client-side augmented values
	// - Link to the strategy page, generated on the client side
	link: string;
	// - The client-side strategy config object
	config: StrategyConfiguration;
	// - A developer readable reason why the strategy cannot be loaded.
	// - If set the strategy is not accessible.
	error: Nullable<string>;
	// The number of frozen positions the strategy currently has
	frozen_positions: number;
	// Backtest files are available on the server.
	// Display Backtest menu entry.
	backtest_available: boolean;
	// UNIX timestamp when the executor main loop crashed with an exception
	crashed_at: Nullable<UnixTimestamp>;
  // List of badges the strategy tile can show
  badges?: string[];
}

export async function getStrategiesWithRuntimeState(
	strats: StrategyConfiguration[],
	fetch
): Promise<StrategyRuntimeState[]> {
	// Load runtime state for all strategies parallel
	return await Promise.all(
		strats.map(async (strat) => {
			assert(strat.url, `StrategyConfig URL missing: ${strat}`);

			let resp;
			let connected;

			try {
				// Because we load from the executor, we need to be able to
				// catch HTTP 500 from Cloudflare (no CORS headers)
				// https://github.com/sveltejs/kit/issues/5074
				resp = await fetch(`${strat.url}/metadata`);
			} catch (e) {
				// TypeError: Failed to fetch
				// but happens only on client-side.
				// The exception is hard to distinguish from
				// any other exception, because it lacks metadata
				// (class name, attributes).
				console.error('fetch() raised an error', e);
				// Temporary work around
				resp = { ok: false, statusText: e.message };
			}

			let error, payload;
			if (resp.ok) {
				try {
					payload = await resp.json();
					error = null;
					connected = true;
				} catch (e) {
					payload = {};
					error = e.message;
					connected = false;
				}
			} else {
				payload = {};
				error = resp.statusText;
			}

			if (payload.id) {
				assert(strat.id === payload.id, `Mismatch on strategy id. We have ${strat.id}, server has ${payload.id}`);
			}

			return {
				connected,
				id: strat.id,
				name: payload.name || strat.name,
				short_description: payload.short_description,
				long_description: payload.long_description,
				icon_url: payload.icon_url || loadError,
				started_at: payload.started_at,
				executor_running: payload.executor_running,
				summary_statistics: payload.summary_statistics,
				on_chain_data: payload.on_chain_data,
				config: strat,
				link: `/strategy/${strat.id}`,
				error,
				frozen_positions: payload.frozen_positions,
				backtest_available: payload.backtest_available,
				crashed_at: payload.crashed_at,
        badges: payload.badges,
			};
		})
	);
}

/**
 * Get list of configured strategies and pings server for the latest runtime state.
 *
 * Typedefs JSON load from the config.
 */
export async function getConfiguredStrategiesWithRuntimeState(fetch): Promise<StrategyRuntimeState[]> {
	const strats = getConfiguredStrategies();
	return getStrategiesWithRuntimeState(strats, fetch);
}

/**
 * Get runtime state for a single strategy
 *
 * @param strategyConfig
 */
export async function getStrategyRuntimeState(
	strategyConfig: StrategyConfiguration,
	fetch
): Promise<StrategyRuntimeState> {
	const arr = await getStrategiesWithRuntimeState([strategyConfig], fetch);
	return arr[0];
}
