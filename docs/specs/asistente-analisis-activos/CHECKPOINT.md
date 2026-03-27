# CHECKPOINT — asistente-analisis-activos

Last updated: 2026-03-26

## Completed
- T1.1 define config format
- T1.2 integrate secrets manager

## Current / Next
- Next task: T1.3
- Status: READY

## Important constraints
- Mercado USA, velas 1h, horario regular ET.
- Regla: RSI < 25 y cruce de histograma MACD negativo a positivo.
- Datos via Twelve Data, salida en Google Sheets + email Gmail.
- Secretos via AWS Secrets Manager (no .env en repo).

## Gotchas / Risks discovered
- `config/config.json` debe existir en runtime y no se commitea.
- Secreto AWS debe contener claves requeridas para APIs Google/Twelve Data.

## Safe resume instructions
- Continuar con T1.3 (definir formato de la hoja de simbolos).
- Mantener `src/config.js` como entrada principal de config.
