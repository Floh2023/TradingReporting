# Configuracion

## Archivo de configuracion
El sistema lee configuracion no sensible desde:
- `CONFIG_PATH` (si esta definido), o
- `config/config.json` (por defecto)

Copiar `config/config.example.json` a `config/config.json` y completar los campos.

### Campos esperados (config.json)
- `google.sheetId`: ID del Google Sheet
- `google.tickersSheetName`: Hoja con la lista de simbolos
- `google.resultsSheetName`: Hoja de resultados
- `email.from`: Remitente del email
- `email.to`: Lista de destinatarios
- `market.timezone`: Zona horaria (ej. `America/New_York`)
- `market.interval`: Intervalo de velas (ej. `1h`)
- `market.scheduleEt`: Horarios de ejecucion en ET (ej. `["10:30","13:30","15:30"]`)

## Secretos en archivo .env
Crear un archivo `.env` en la raiz del proyecto (no commitearlo) con estas claves:
- `TWELVE_DATA_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

Ejemplo de `.env`:
```
TWELVE_DATA_API_KEY=TD_API_KEY
GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN=GOOGLE_REFRESH_TOKEN
```
