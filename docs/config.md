# Configuracion

## Archivo de configuracion
El sistema lee configuracion no sensible desde:
- `CONFIG_PATH` (si esta definido), o
- `config/config.json` (por defecto)

Copiar `config/config.example.json` a `config/config.json` y completar los campos.

### Campos esperados (config.json)
- `aws.region`: Region AWS (ej. `us-east-1`)
- `aws.secretId`: Nombre o ARN del secreto en AWS Secrets Manager
- `google.sheetId`: ID del Google Sheet
- `google.tickersSheetName`: Hoja con la lista de simbolos
- `google.resultsSheetName`: Hoja de resultados
- `email.from`: Remitente del email
- `email.to`: Lista de destinatarios
- `market.timezone`: Zona horaria (ej. `America/New_York`)
- `market.interval`: Intervalo de velas (ej. `1h`)
- `market.scheduleEt`: Horarios de ejecucion en ET (ej. `["10:30","13:30","15:30"]`)

## Secretos en AWS Secrets Manager
El secreto debe ser un JSON con estas claves minimas:
- `twelveDataApiKey`
- `googleClientId`
- `googleClientSecret`
- `googleRefreshToken`

Ejemplo de secreto:
```
{
  "twelveDataApiKey": "TD_API_KEY",
  "googleClientId": "GOOGLE_CLIENT_ID",
  "googleClientSecret": "GOOGLE_CLIENT_SECRET",
  "googleRefreshToken": "GOOGLE_REFRESH_TOKEN"
}
```
