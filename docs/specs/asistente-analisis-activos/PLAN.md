# Plan

1) Definir configuracion y entradas
- Estructura de configuracion (API keys, IDs de Google Sheets, email destino).
- Acceso a credenciales via AWS Secrets Manager.
- Formato esperado de la lista de simbolos en Google Sheets.

2) Implementar pipeline de deteccion
- Ingesta de simbolos.
- Consulta de datos 1h a Twelve Data.
- Calculo de RSI y MACD.
- Deteccion de senales y ordenamiento.

3) Publicacion y notificacion
- Escribir resultados en Google Sheets.
- Enviar email por Gmail API con resumen y link/adjunto.

4) Backtesting
- Lectura de historico 1h.
- Aplicacion de regla y salida de resultados con metricas basicas.

5) Operacion y errores
- Logs basicos.
- Parada segura ante fallas de API.
