# S&P 500 EMA/RSI Scanner (Google Sheets + Apps Script)

This project sets up a Google Sheet + Apps Script to scan S&P 500 symbols and compute:
- EMA 9
- EMA 20
- RSI 14
- Indicator for `EMA9 > EMA20`
- RSI signal when `>= 70` or `<= 30`
Only tickers that have a CEDEAR are included (list from Caja de Valores).

## 1) Create the Google Sheet
1. Create a new Google Sheet.
2. Open **Extensions -> Apps Script**.
3. Create a new script file and paste the contents of `Code.gs` from this folder.
4. Replace `YOUR_POLYGON_API_KEY` with your API key.

## 2) First-time setup
In Apps Script, run these functions in order:
1. `setupSheets()`
2. `importSP500()`

This will create sheets:
- `Tickers`
- `Cedears`
- `Results`

## 3) Run the scan
Run:
- `runBatch()`

This processes a batch of tickers (default 20) to stay within the free rate limit. Run it multiple times to complete the full S&P 500 list.

## 4) Optional: schedule in the morning
If you want a scheduled scan, use `scheduleDailyBatches()` to create a daily trigger and then schedule 5 batches with a few minutes between each.
Edit these constants in `Code.gs`:
- `BATCH_SIZE`
- `BATCH_COUNT`
- `BATCH_START_HOUR`
- `BATCH_START_MINUTE`
- `BATCH_SPACING_MIN`

## Notes
- Set the Apps Script project timezone to `America/New_York` to align with US market open.
- This uses daily (EOD) data and computes indicators locally.
- The script converts tickers like `BRK.B` to `BRK-B` for Polygon.
- If you want fewer symbols, edit the `MAX_TICKERS` constant.
