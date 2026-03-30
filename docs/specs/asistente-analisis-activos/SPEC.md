# Asistente de Analisis de Activos

## Resumen
Crear un programa (script/notebook en JavaScript/TypeScript) que identifique acciones USA con señales de reversion al alza usando datos de mercado via API externa, genere una ficha por activo y publique los resultados en Google Sheets, ademas de enviar un correo con resumen y link/adjunto. Debe correr varias veces al dia y tambien soportar backtesting historico.

## Spec contract
The SPEC is the source of truth. If implementation deviates, update the SPEC + TASKS + ACCEPTANCE and record it in the Changelog.

## Objetivos
- Identificar acciones USA con senal de reversion al alza segun regla definida.
- Producir ficha por activo con precio, indicadores y hora de senal.
- Publicar resultados en Google Sheets (archivo en la nube).
- Enviar email con resumen y top de senales + link/adjunto.
- Soportar ejecucion varias veces al dia y backtesting historico.

## No objetivos
- Analisis fundamental o noticias.
- Ejecucion automatica de trades.
- UI web o app desktop completa.

## Usuarios y contexto
- Usuario final: analista que desea detectar candidatos y luego hacer analisis profundo manual.
- Plataforma: notebook/script (sin UI web).
- Stack preferido: JavaScript/TypeScript.

## Alcance y decisiones clave
- Mercado: solo USA (NYSE/Nasdaq).
- Datos de mercado: Twelve Data API.
- Velas: 1 hora, horario regular (9:30–16:00 ET).
- Frecuencia: 3 momentos fijos al dia (10:30, 13:30, 15:30 ET).
- Entrega: Google Sheets + email (Gmail API).
- Orden de prioridad: RSI mas bajo primero.
- Detener ejecucion si falla una API critica.
- Credenciales via archivo .env.

## Definicion de senal
- Regla final: RSI < 25 **y** MACD histograma cruza de negativo a positivo.
- MACD impulse: histograma cruza de negativo a positivo.
- Ordenamiento: RSI mas bajo primero.

## Datos y entradas
- Lista de simbolos: Google Sheet provisto por el usuario (lista fija).
- Configuracion no sensible: `config/config.json`.
- Secretos: archivo `.env` (no commitear).
- Parametros de indicador:
  - RSI: periodo 14, umbral < 25.
  - MACD: 12/26/9.

## Salidas
- Google Sheets con columnas minimas:
  - simbolo, precio, RSI, MACD, hora de senal
- Email con:
  - resumen + top de senales + link/adjunto al spreadsheet
 - No se requiere archivo .xlsx adicional.

## Flujo principal (deteccion)
1) Leer lista de simbolos desde Google Sheets.
2) Consultar datos 1h en Twelve Data.
3) Calcular RSI y MACD.
4) Detectar senales segun regla.
5) Ordenar por RSI ascendente.
6) Publicar resultados en Google Sheets.
7) Enviar email con resumen y link/adjunto.

## Flujo secundario (backtesting)
1) Cargar lista de simbolos.
2) Pedir historico 1h.
3) Aplicar misma regla de senal.
4) Exportar resultados y metricas basicas (1 ano: senales totales, win rate, retorno medio a 5/10/20 velas).

## Manejo de errores
- Si falla la API de datos o Google/Gmail: detener ejecucion y reportar en logs.

## Seguridad
- Credenciales gestionadas via archivo `.env`.
- No guardar secretos en el repo.

## Preguntas abiertas


## Changelog
- 2026-03-30 — Cambio de AWS Secrets Manager a archivo `.env` para secretos.
- 2026-03-26 — Spec finalizada con parametros operativos y de indicadores.
