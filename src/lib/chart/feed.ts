/**
 * ChartIQ quote-feed adapter for Trading Strategy candle data. See:
 * https://documentation.chartiq.com/tutorial-DataIntegrationQuoteFeeds.html
 */
import { backendUrl } from '$lib/config';
import { feedParamsToTimeBucket } from '$lib/chart/timeBucketConverters';

function dateUrlParam(date) {
  return date.toISOString().slice(0,19);
}

async function fetchData(symbol, startDate, endDate, params) {
  const urlParams = new URLSearchParams({
    pair_id: symbol,
    time_bucket: feedParamsToTimeBucket(params.period, params.interval),
    start: dateUrlParam(startDate),
    end: dateUrlParam(endDate)
  });

  const response = await fetch(`${backendUrl}/candles?${urlParams}`);
  const quotes = await response.json();

  return quotes.map(({ ts, o, h, l, c, v }) => ({
    Date: ts,
    Open: o,
    High: h,
    Low: l,
    Close: c,
    Volume: v
  }));
}

async function fetchInitialData(symbol, startDate, endDate, params, callback) {
  const quotes = await fetchData(symbol, startDate, endDate, params);
  callback({ quotes });
}

async function fetchPaginationData(symbol, startDate, endDate, params, callback) {
  const quotes = await fetchData(symbol, startDate, endDate, params);
  const moreAvailable = quotes.length > 0;
  callback({ quotes, moreAvailable });
}

export default { fetchInitialData, fetchPaginationData };
