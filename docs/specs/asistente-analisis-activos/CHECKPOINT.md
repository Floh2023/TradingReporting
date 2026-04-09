# CHECKPOINT — asistente-analisis-activos

Last updated: 2026-03-30

## Completed
- T1.1 define config format
- T1.2 load secrets from env
- T1.3 define tickers sheet format
- T1.4 load tickers from sheets
- T1.5 fetch 1h candles
- T1.6 compute RSI and MACD

## Current / Next
- Next task: T1.7
- Status: READY

## Important constraints
- Mercado USA, velas 1h, horario regular ET.
- Regla: RSI < 25 y cruce de histograma MACD negativo a positivo.
- Datos via Twelve Data, salida en Google Sheets + email Gmail.
- Secretos via archivo .env (no commitear).

## Gotchas / Risks discovered
- `config/config.json` debe existir en runtime y no se commitea.
- El archivo `.env` debe contener claves requeridas para APIs Google/Twelve Data.

## Safe resume instructions
- Continuar con T1.3 (definir formato de la hoja de simbolos).
- Mantener `src/config.js` como entrada principal de config.
