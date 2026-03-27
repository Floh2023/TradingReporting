/*
 * S&P 500 SMA/RSI Scanner (Daily)
 * - Uses Twelve Data TIME_SERIES.
 * - Computes SMA 9/20 and RSI 14.
 * - Batch processing to respect free-tier rate limits (8 req/min).
 */

const TWELVEDATA_API_KEY = "YOUR_TWELVEDATA_API_KEY";
const EMAIL_TO = "florencia.marcazzo@gmail.com";

const WIKI_SP500_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies";
const TWELVEDATA_URL = "https://api.twelvedata.com/time_series";
const SP500_IMPORTED_FLAG = "sp500_imported_at";
const CAJA_CEDEARS_URL = "https://cajadevalores.com.ar/Servicios/Cedears";

const MAX_TICKERS = 505; // Full S&P 500 list
const BATCH_SIZE = 20; // Free tier friendly (20 * 15s = ~5 min)

// Schedule at US market close + 30 min.
// IMPORTANT: Set the Apps Script project timezone to "America/New_York".
const BATCH_START_HOUR = 16;
const BATCH_START_MINUTE = 30;
const BATCH_SPACING_MIN = 7; // Minutes between batches

const RSI_PERIOD = 14;
const ADX_PERIOD = 14;
const SMA_SHORT = 9;
const SMA_LONG = 20;
const RSI_FILTER_MAX = 35;

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sp500 = ss.getSheetByName("SP500");
  if (!sp500) sp500 = ss.insertSheet("SP500");
  let tickers = ss.getSheetByName("Tickers");
  if (!tickers) tickers = ss.insertSheet("Tickers");
  let results = ss.getSheetByName("Results");
  if (!results) results = ss.insertSheet("Results");

  sp500.clear();
  sp500.getRange(1, 1, 1, 3).setValues([["Symbol", "Name", "Sector"]]);

  tickers.clear();
  tickers.getRange(1, 1, 1, 3).setValues([["Symbol", "Name", "Sector"]]);

  results.clear();
  results.getRange(1, 1, 1, 7).setValues([[
    "Symbol",
    "Date",
    "Close",
    "SMA9",
    "SMA20",
    "RSI14",
    "ADX14"
  ]]);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Scanner")
    .addItem("Actualizar ahora (1 lote)", "runBatch")
    .addItem("Cargar tickers (solo una vez)", "buildFixedTickerList")
    .addItem("Forzar actualización SP500", "forceRefreshSp500")
    .addItem("Cargar tickers CEDEARs (Acciones - USA)", "buildTickersFromCedearAccionesUS")
    .addItem("Cargar tickers CEDEARs (Acciones - Todos)", "buildTickersFromCedearAccionesAll")
    .addItem("Programar todos los días", "scheduleDailyBatches")
    .addItem("Limpiar programación", "clearBatchTriggers")
    .addItem("Limpiar programación diaria", "clearScheduleTriggers")
    .addToUi();
}

function importSP500() {
  const html = UrlFetchApp.fetch(WIKI_SP500_URL).getContentText();
  const tableMatch = html.match(/<table[^>]*id="constituents"[^>]*>[\s\S]*?<\/table>/i);
  if (!tableMatch) throw new Error("Failed to find S&P 500 table on Wikipedia.");

  const tableHtml = tableMatch[0];
  const rows = tableHtml.split(/<\/tr>/i).slice(1); // skip header
  const data = [];

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!cols || cols.length < 4) continue;

    const rawSymbol = stripTags(cols[0]);
    const name = stripTags(cols[1]);
    const sector = stripTags(cols[3]);

    const symbol = rawSymbol;
    if (!symbol) continue;

    data.push([symbol, name, sector]);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SP500");
  sheet.getRange(2, 1, data.length, 3).setValues(data);
}

function buildFixedTickerList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tickersSheet = ss.getSheetByName("Tickers");
  const props = PropertiesService.getScriptProperties();

  // If already imported and tickers exist, do nothing.
  if (props.getProperty(SP500_IMPORTED_FLAG) && tickersSheet.getLastRow() > 1) {
    return;
  }

  importSP500();

  const sp500Sheet = ss.getSheetByName("SP500");

  const spRows = sp500Sheet.getRange(2, 1, sp500Sheet.getLastRow() - 1, 3).getValues();

  const filtered = [];
  for (let i = 0; i < spRows.length && filtered.length < MAX_TICKERS; i++) {
    const [symbol, name, sector] = spRows[i];
    if (!symbol) continue;
    filtered.push([symbol, name, sector]);
  }

  tickersSheet.clear();
  tickersSheet.getRange(1, 1, 1, 3).setValues([["Symbol", "Name", "Sector"]]);
  if (filtered.length) {
    tickersSheet.getRange(2, 1, filtered.length, 3).setValues(filtered);
  }

  props.setProperty(SP500_IMPORTED_FLAG, new Date().toISOString());
}

function forceRefreshSp500() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty(SP500_IMPORTED_FLAG);
  buildFixedTickerList();
}

function buildTickersFromCedearAccionesUS() {
  buildTickersFromCedearAcciones({ onlyUS: true });
}

function buildTickersFromCedearAccionesAll() {
  buildTickersFromCedearAcciones({ onlyUS: false });
}

function buildTickersFromCedearAcciones(options) {
  const onlyUS = options && options.onlyUS;
  const html = UrlFetchApp.fetch(CAJA_CEDEARS_URL).getContentText();
  const text = stripTags(html).replace(/\s+/g, " ").trim();
  const start = text.indexOf("CEDEAR de Acciones");
  if (start === -1) throw new Error("No se encontró la sección 'CEDEAR de Acciones'.");
  let end = text.indexOf("CEDEAR CORPORATES", start);
  if (end === -1) end = text.length;
  const section = text.substring(start, end);

  // Each row ends with "Calificado y No Calificado" or "Solo Calificado".
  const rawRows = section.split(/Calificado y No Calificado|Solo Calificado/i);
  const seen = new Set();
  const tickers = [];

  for (const row of rawRows) {
    const m = row.match(/\b([A-Z0-9]{1,6}(?:\.[A-Z])?)\s+([A-Z0-9]{1,6}(?:\.[A-Z])?)\s+\d{4}\b/);
    if (!m) continue;

    const originTicker = m[2];
    if (onlyUS) {
      const isUS = /NYSE|NASDAQ|New York|NYSE Arca|Cboe/i.test(row);
      if (!isUS) continue;
    }

    if (!seen.has(originTicker)) {
      seen.add(originTicker);
      tickers.push([originTicker]);
    }
  }

  if (!tickers.length) throw new Error("No se pudieron extraer tickers desde Caja de Valores.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tickersSheet = ss.getSheetByName("Tickers");
  tickersSheet.clear();
  tickersSheet.getRange(1, 1, 1, 3).setValues([["Symbol", "Name", "Sector"]]);
  tickersSheet.getRange(2, 1, tickers.length, 1).setValues(tickers);
}

function runBatch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tickersSheet = ss.getSheetByName("Tickers");
  const resultsSheet = ss.getSheetByName("Results");

  const props = PropertiesService.getScriptProperties();
  const cursor = parseInt(props.getProperty("cursor") || "0", 10);

  const tickers = tickersSheet.getRange(2, 1, tickersSheet.getLastRow() - 1, 1).getValues().flat();
  if (!tickers.length) throw new Error("Tickers sheet is empty. Run importSP500() first.");

  const start = cursor;
  const end = Math.min(cursor + BATCH_SIZE, tickers.length);

  const rows = [];
  const emailRows = [];
  for (let i = start; i < end; i++) {
    const symbol = tickers[i];
    const data = fetchDailySeries(symbol);
    if (!data || data.length < SMA_LONG + RSI_PERIOD + 2) continue;

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const sma9 = computeSMA(closes, SMA_SHORT);
    const sma20 = computeSMA(closes, SMA_LONG);
    const rsiSeries = computeRSISeries(closes, RSI_PERIOD);
    const rsi14 = rsiSeries[rsiSeries.length - 1];
    const adxSeries = computeADXSeries(highs, lows, closes, ADX_PERIOD);
    const adx14 = adxSeries[adxSeries.length - 1];

    const last = data[data.length - 1];
    const dateStr = last.date;
    const matches = rsi14 !== null && rsi14 < RSI_FILTER_MAX;

    if (matches) {
      const row = [
        symbol,
        dateStr,
        last.close,
        round2(sma9),
        round2(sma20),
        round2(rsi14),
        round2(adx14)
      ];
      rows.push(row);
      emailRows.push(row);
    }

    // Respect free-tier rate limit (5 req/min). Add buffer.
    Utilities.sleep(15000);
  }

  if (rows.length) {
    resultsSheet.getRange(resultsSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  sendBatchEmail(emailRows, start, end);

  if (end >= tickers.length) {
    props.setProperty("cursor", "0");
  } else {
    props.setProperty("cursor", String(end));
  }
}

function sendBatchEmail(emailRows, startIdx, endIdx) {
  const subject = `Scanner CEDEARs - Lote ${startIdx + 1} a ${endIdx}`;
  if (!emailRows || !emailRows.length) {
    return; // Solo enviar si hay resultados
  }

  // Order rows: lowest RSI first.
  emailRows.sort((a, b) => (a[5] ?? 999) - (b[5] ?? 999));

  const header = ["Symbol", "Date", "Close", "SMA9", "SMA20", "RSI14", "ADX14"];
  const rowsHtml = emailRows
    .map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`)
    .join("");

  const htmlBody = `
    <p>Resultados del lote (${startIdx + 1} a ${endIdx})</p>
    <table border="1" cellpadding="4" cellspacing="0">
      <tr>${header.map(h => `<th>${h}</th>`).join("")}</tr>
      ${rowsHtml}
    </table>
  `;

  MailApp.sendEmail({
    to: EMAIL_TO,
    subject,
    htmlBody
  });
}

function scheduleDailyBatches() {
  // Creates a daily trigger that schedules today's batch triggers after market close.
  // Clear all triggers first to avoid accumulation if user runs this multiple times.
  clearAllTriggers();
  ScriptApp.newTrigger("scheduleTodayBatches")
    .timeBased()
    .everyDays(1)
    .atHour(BATCH_START_HOUR)
    .nearMinute(BATCH_START_MINUTE)
    .create();

  // Also schedule for today immediately, so you don't have to wait for tomorrow.
  scheduleTodayBatches();
}

function clearAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    ScriptApp.deleteTrigger(t);
  }
}

function scheduleTodayBatches() {
  // Clears existing batch triggers and schedules BATCH_COUNT runs for today.
  clearBatchTriggers();

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), BATCH_START_HOUR, BATCH_START_MINUTE, 0);
  const tickers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tickers");
  const total = Math.max(0, tickers.getLastRow() - 1);
  const batchCount = Math.max(1, Math.ceil(total / BATCH_SIZE));

  for (let i = 0; i < batchCount; i++) {
    const t = new Date(base.getTime() + i * BATCH_SPACING_MIN * 60000);
    ScriptApp.newTrigger("runBatch").timeBased().at(t).create();
  }
}

function clearScheduleTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === "scheduleTodayBatches") {
      ScriptApp.deleteTrigger(t);
    }
  }
}

function clearBatchTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === "runBatch") {
      ScriptApp.deleteTrigger(t);
    }
  }
}

function fetchDailySeries(symbol) {
  const params = [
    "symbol=" + encodeURIComponent(symbol),
    "interval=1day",
    "outputsize=200",
    "format=JSON",
    "apikey=" + TWELVEDATA_API_KEY
  ].join("&");
  const url = `${TWELVEDATA_URL}?${params}`;
  const res = UrlFetchApp.fetch(url);
  const json = JSON.parse(res.getContentText());
  if (!json || json.status === "error" || !json.values) return null;

  // Twelve Data returns most recent first; reverse to oldest->newest.
  const values = json.values.slice().reverse();
  return values.map(row => ({
    date: row.datetime,
    close: parseFloat(row.close),
    high: parseFloat(row.high),
    low: parseFloat(row.low)
  }));
}

function computeSMA(values, period) {
  const slice = values.slice(values.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
}

function computeRSISeries(values, period) {
  const rsi = Array(values.length).fill(null);
  if (values.length <= period) return rsi;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
  }

  return rsi;
}

function computeADXSeries(highs, lows, closes, period) {
  const len = closes.length;
  const adx = Array(len).fill(null);
  if (len <= period * 2) return adx;

  const tr = Array(len).fill(0);
  const plusDM = Array(len).fill(0);
  const minusDM = Array(len).fill(0);

  for (let i = 1; i < len; i++) {
    const highDiff = highs[i] - highs[i - 1];
    const lowDiff = lows[i - 1] - lows[i];

    plusDM[i] = (highDiff > lowDiff && highDiff > 0) ? highDiff : 0;
    minusDM[i] = (lowDiff > highDiff && lowDiff > 0) ? lowDiff : 0;

    const highLow = highs[i] - lows[i];
    const highClose = Math.abs(highs[i] - closes[i - 1]);
    const lowClose = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(highLow, highClose, lowClose);
  }

  let trSum = 0;
  let plusSum = 0;
  let minusSum = 0;
  for (let i = 1; i <= period; i++) {
    trSum += tr[i];
    plusSum += plusDM[i];
    minusSum += minusDM[i];
  }

  let plusDI = trSum === 0 ? 0 : (100 * (plusSum / trSum));
  let minusDI = trSum === 0 ? 0 : (100 * (minusSum / trSum));
  let dx = (plusDI + minusDI) === 0 ? 0 : (100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI));

  const dxs = Array(len).fill(null);
  dxs[period] = dx;

  for (let i = period + 1; i < len; i++) {
    trSum = trSum - (trSum / period) + tr[i];
    plusSum = plusSum - (plusSum / period) + plusDM[i];
    minusSum = minusSum - (minusSum / period) + minusDM[i];

    plusDI = trSum === 0 ? 0 : (100 * (plusSum / trSum));
    minusDI = trSum === 0 ? 0 : (100 * (minusSum / trSum));
    dx = (plusDI + minusDI) === 0 ? 0 : (100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI));
    dxs[i] = dx;
  }

  // First ADX is the SMA of DX over the first "period" values after the initial period
  let adxSeedSum = 0;
  for (let i = period; i < period * 2; i++) {
    adxSeedSum += dxs[i];
  }
  adx[period * 2 - 1] = adxSeedSum / period;

  for (let i = period * 2; i < len; i++) {
    adx[i] = ((adx[i - 1] * (period - 1)) + dxs[i]) / period;
  }

  return adx;
}

// -----------------------------
// Basic Tests (manual run)
// -----------------------------

function runTests() {
  const results = [];

  results.push(testComputeSMA());
  results.push(testComputeRSISeries());
  results.push(testComputeADXSeries());
  results.push(testApiFetchAAPL());
  results.push(testPipelineWritesRow());

  writeTestResults(results);
}

function testComputeSMA() {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const sma3 = computeSMA(values, 3);
  return assertAlmostEqual("SMA3", sma3, 8, 0.0001);
}

function testComputeRSISeries() {
  // Strong uptrend should yield RSI near 100 after enough periods.
  const values = [];
  for (let i = 1; i <= 40; i++) values.push(i);
  const rsi = computeRSISeries(values, 14);
  const last = rsi[rsi.length - 1];
  return assertInRange("RSI uptrend", last, 90, 100);
}

function testComputeADXSeries() {
  // Simple trending data should yield ADX in [0,100] and not null at the end.
  const highs = [];
  const lows = [];
  const closes = [];
  for (let i = 1; i <= 60; i++) {
    highs.push(i + 1);
    lows.push(i - 1);
    closes.push(i);
  }
  const adx = computeADXSeries(highs, lows, closes, 14);
  const last = adx[adx.length - 1];
  if (last === null || last === undefined) {
    return fail("ADX not computed", "Último ADX es null/undefined");
  }
  return assertInRange("ADX range", last, 0, 100);
}

function testApiFetchAAPL() {
  try {
    const data = fetchDailySeries("AAPL");
    if (!data || !data.length) {
      return fail("API fetch AAPL", "Sin datos desde Twelve Data (key inválida o límite)");
    }
    return pass("API fetch AAPL");
  } catch (e) {
    return fail("API fetch AAPL", String(e));
  }
}

function testPipelineWritesRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("TestPipeline");
  if (!sheet) sheet = ss.insertSheet("TestPipeline");
  sheet.clear();
  sheet.getRange(1, 1, 1, 7).setValues([[
    "Symbol",
    "Date",
    "Close",
    "SMA9",
    "SMA20",
    "RSI14",
    "ADX14"
  ]]);

  // Use AAPL and a relaxed filter to guarantee a row if API works.
  const data = fetchDailySeries("AAPL");
  if (!data || data.length < SMA_LONG + RSI_PERIOD + 2) {
    return fail("Pipeline write", "Datos insuficientes o API falló");
  }

  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const sma9 = computeSMA(closes, SMA_SHORT);
  const sma20 = computeSMA(closes, SMA_LONG);
  const rsiSeries = computeRSISeries(closes, RSI_PERIOD);
  const rsi14 = rsiSeries[rsiSeries.length - 1];
  const adxSeries = computeADXSeries(highs, lows, closes, ADX_PERIOD);
  const adx14 = adxSeries[adxSeries.length - 1];

  const last = data[data.length - 1];
  const dateStr = last.date;
  sheet.getRange(2, 1, 1, 7).setValues([[
    "AAPL",
    dateStr,
    last.close,
    round2(sma9),
    round2(sma20),
    round2(rsi14),
    round2(adx14)
  ]]);

  return pass("Pipeline write");
}

function assertAlmostEqual(name, actual, expected, tolerance) {
  const ok = Math.abs(actual - expected) <= tolerance;
  return ok ? pass(name) : fail(name, `Esperado ${expected} ± ${tolerance}, obtuve ${actual}`);
}

function assertInRange(name, actual, min, max) {
  const ok = actual >= min && actual <= max;
  return ok ? pass(name) : fail(name, `Esperado entre ${min} y ${max}, obtuve ${actual}`);
}

function pass(name) {
  return { name, status: "PASS", detail: "" };
}

function fail(name, detail) {
  return { name, status: "FAIL", detail };
}

function writeTestResults(results) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Tests");
  if (!sheet) sheet = ss.insertSheet("Tests");

  sheet.clear();
  sheet.getRange(1, 1, 1, 3).setValues([["Test", "Status", "Detail"]]);
  const rows = results.map(r => [r.name, r.status, r.detail]);
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
}

// Debug helper for Twelve Data responses.
function debugTwelveData() {
  const url = `${TWELVEDATA_URL}?symbol=AAPL&interval=1day&outputsize=50&format=JSON&apikey=${TWELVEDATA_API_KEY}`;
  const res = UrlFetchApp.fetch(url);
  Logger.log(res.getContentText());
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "").trim();
}
