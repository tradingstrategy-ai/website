/**
 * Formatting helpers specific to trade execution
 *
 * (see $lib/helpers/formatters for other general-use formatters)
 */
import { formatNumber, formatPercent, toFloatingPoint, isNumber, notFilledMarker } from '$lib/helpers/formatters';

/**
 * Format basis points (BPS)
 *
 * No unit suffix added.
 *
 * @param n - decimal value to format as basis points
 */
export function formatBPS(n: MaybeNumber) {
	return formatNumber(n * 10_000, 0);
}

/**
 * Format an internal stop loss value to human-readable representation.
 *
 * To simplify calculations, stop loss values are stored internally as
 * percent of entry price (e.g., 0.9 / 90%).
 *
 * Traders expect stop loss values to be displayed as percent below entry
 * price (e.g., 10%).
 */
export function formatStopLoss(internalValue: number, minDigits = 1, maxPrecision = minDigits) {
	return formatPercent(1 - internalValue, minDigits, maxPrecision);
}

/**
 * Formats trades per month frequency.
 */
export function formatTradesPerMonth(n: MaybeNumberlike): string {
	n = toFloatingPoint(n);
	if (!isNumber(n)) return notFilledMarker;
	return formatNumber(n, 1, 2) + ' / mo';
}

const timeUnitMap: Record<string, string> = {
	m: 'minute',
	h: 'hour',
	d: 'day'
};

/**
 * Formats cycle duration into a human-friendly string
 *
 * @param cycleDuration - cycle duration string, e.g. '1h', '7d'
 */
export function formatCycleDuration(cycleDuration?: string): string {
	if (!cycleDuration) return notFilledMarker;
	const [durationStr, abbrev] = cycleDuration.split(/(?=[mhd])/);
	const duration = Number.parseInt(durationStr);
	let timeUnit = timeUnitMap[abbrev];
	if (timeUnit && duration > 1) timeUnit += 's';
	return `${duration} ${timeUnit ?? abbrev}`;
}
