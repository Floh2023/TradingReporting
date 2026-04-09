const DEFAULT_RSI_PERIOD = 14;
const DEFAULT_MACD_FAST = 12;
const DEFAULT_MACD_SLOW = 26;
const DEFAULT_MACD_SIGNAL = 9;

function computeEMA(values, period) {
  const result = Array(values.length).fill(null);
  if (!Array.isArray(values) || values.length === 0) {
    return result;
  }
  if (period <= 0) {
    throw new Error("EMA period must be positive");
  }

  const k = 2 / (period + 1);
  let buffer = [];
  let ready = false;
  let prevEma = null;

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];

    if (value == null || Number.isNaN(value)) {
      buffer = [];
      ready = false;
      prevEma = null;
      continue;
    }

    if (!ready) {
      buffer.push(value);
      if (buffer.length === period) {
        const sum = buffer.reduce((acc, v) => acc + v, 0);
        prevEma = sum / period;
        result[i] = prevEma;
        ready = true;
        buffer = [];
      }
      continue;
    }

    prevEma = (value - prevEma) * k + prevEma;
    result[i] = prevEma;
  }

  return result;
}

function computeRSI(values, period = DEFAULT_RSI_PERIOD) {
  const result = Array(values.length).fill(null);
  if (!Array.isArray(values) || values.length < period + 1) {
    return result;
  }

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i += 1) {
    const change = values[i] - values[i - 1];
    if (Number.isNaN(change)) {
      return result;
    }
    if (change >= 0) {
      gainSum += change;
    } else {
      lossSum += Math.abs(change);
    }
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  const firstRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  result[period] = firstRsi;

  for (let i = period + 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

function computeMACD(values, fast = DEFAULT_MACD_FAST, slow = DEFAULT_MACD_SLOW, signal = DEFAULT_MACD_SIGNAL) {
  if (!Array.isArray(values) || values.length === 0) {
    return {
      macdLine: [],
      signalLine: [],
      histogram: [],
    };
  }

  const emaFast = computeEMA(values, fast);
  const emaSlow = computeEMA(values, slow);
  const macdLine = values.map((_, index) => {
    if (emaFast[index] == null || emaSlow[index] == null) {
      return null;
    }
    return emaFast[index] - emaSlow[index];
  });

  const signalLine = computeEMA(macdLine, signal);
  const histogram = macdLine.map((value, index) => {
    if (value == null || signalLine[index] == null) {
      return null;
    }
    return value - signalLine[index];
  });

  return {
    macdLine,
    signalLine,
    histogram,
  };
}

module.exports = {
  computeEMA,
  computeRSI,
  computeMACD,
  DEFAULT_RSI_PERIOD,
  DEFAULT_MACD_FAST,
  DEFAULT_MACD_SLOW,
  DEFAULT_MACD_SIGNAL,
};
