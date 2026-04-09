const https = require("https");
const { DateTime } = require("luxon");

const BASE_URL = "https://api.twelvedata.com/time_series";

function parseDateTime(value, timezone) {
  if (!value) {
    return null;
  }

  const iso = DateTime.fromISO(value, { zone: timezone });
  if (iso.isValid) {
    return iso;
  }

  const formatted = DateTime.fromFormat(value, "yyyy-MM-dd HH:mm:ss", {
    zone: timezone,
  });
  if (formatted.isValid) {
    return formatted;
  }

  return null;
}

function isRegularSession(dateTime) {
  if (!dateTime || !dateTime.isValid) {
    return false;
  }

  const hour = dateTime.hour;
  const minute = dateTime.minute;

  const afterOpen = hour > 9 || (hour === 9 && minute >= 30);
  const beforeClose = hour < 16 || (hour === 16 && minute === 0);

  return afterOpen && beforeClose;
}

function normalizeCandles(values, timezone) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((row) => {
      const dateTime = parseDateTime(row.datetime, timezone);
      return {
        datetime: row.datetime,
        dateTime,
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close),
        volume: row.volume ? Number(row.volume) : null,
      };
    })
    .filter((row) => row.dateTime && row.dateTime.isValid);
}

function filterRegularSession(candles) {
  return candles.filter((candle) => isRegularSession(candle.dateTime));
}

async function fetchCandles(config, symbol, options = {}) {
  if (!config?.secrets?.twelveDataApiKey) {
    throw new Error("Missing TWELVE_DATA_API_KEY in secrets");
  }
  if (!symbol) {
    throw new Error("Symbol is required");
  }

  const interval = options.interval || config?.market?.interval || "1h";
  const timezone = options.timezone || config?.market?.timezone || "America/New_York";
  const outputsize = options.outputsize || 5000;

  const params = new URLSearchParams({
    symbol,
    interval,
    outputsize: String(outputsize),
    timezone,
    apikey: config.secrets.twelveDataApiKey,
  });

  const payload = await requestJson(`${BASE_URL}?${params.toString()}`);
  if (payload?.status === "error") {
    throw new Error(payload.message || "Twelve Data returned error");
  }

  const candles = normalizeCandles(payload.values, timezone);
  return filterRegularSession(candles);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const { statusCode } = res;
        let rawData = "";

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          if (statusCode && statusCode >= 400) {
            reject(new Error(`Twelve Data request failed: ${statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(rawData));
          } catch (error) {
            reject(new Error("Invalid JSON from Twelve Data"));
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

module.exports = {
  fetchCandles,
  filterRegularSession,
  normalizeCandles,
  isRegularSession,
};
