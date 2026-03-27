# Tasks

1. `T1.1` Definir formato de configuracion (API keys, IDs de Google Sheets, email destino).
Goal: Documentar un esquema de configuracion claro y minimo para operar el sistema.
Inputs: Requisitos de SPEC y credenciales necesarias.
Outputs: Documento/archivo de configuracion definido (estructura y campos).
Steps: Identificar campos minimos, describir formato, y agregar ejemplo.
Done condition: Existe un formato de configuracion documentado y referenciado por el codigo.
Depends on: []
Risks: Campos incompletos pueden bloquear integraciones.
Test/Verification: Revisar que todos los modulos referencian solo campos definidos.

2. `T1.2` Integrar AWS Secrets Manager para credenciales.
Goal: Leer secretos desde AWS Secrets Manager en tiempo de ejecucion.
Inputs: ARN o nombre del secreto y permisos AWS.
Outputs: Modulo/utilidad de acceso a secretos.
Steps: Configurar cliente AWS, resolver secreto y mapearlo a la config.
Done condition: El sistema obtiene credenciales sin depender de archivos locales.
Depends on: [T1.1]
Risks: Permisos insuficientes o region incorrecta.
Test/Verification: Ejecutar lectura de secreto con credenciales de prueba.

3. `T1.3` Especificar formato de la lista de simbolos en Google Sheets.
Goal: Definir columna y encabezado esperados para simbolos.
Inputs: Google Sheet designado por el usuario.
Outputs: Especificacion de formato (columna, encabezado).
Steps: Elegir encabezado y columna, documentarlo.
Done condition: El formato esta documentado y es usado por el lector.
Depends on: [T1.1]
Risks: Inconsistencia entre formato y datos reales.
Test/Verification: Verificar lectura correcta en una hoja de ejemplo.

4. `T1.4` Implementar lectura de simbolos desde Google Sheets.
Goal: Obtener la lista fija de simbolos desde la hoja.
Inputs: ID de Sheet, rango o nombre de hoja, encabezado definido.
Outputs: Lista de simbolos validada.
Steps: Autenticar Google, leer rango, filtrar vacios.
Done condition: Se obtiene una lista de simbolos limpia desde la hoja.
Depends on: [T1.3]
Risks: Problemas de permisos o formato.
Test/Verification: Ejecutar lectura con un Sheet real y validar conteo.

5. `T1.5` Implementar cliente Twelve Data y obtencion de velas 1h.
Goal: Descargar velas 1h en horario regular ET para simbolos USA.
Inputs: API key, simbolo, rango temporal.
Outputs: Serie de velas 1h por simbolo.
Steps: Llamar endpoint, normalizar timestamps, filtrar horario regular.
Done condition: Datos 1h disponibles para calculos.
Depends on: [T1.1]
Risks: Limites de rate, datos faltantes.
Test/Verification: Solicitar datos de un simbolo y validar longitud.

6. `T1.6` Implementar calculo de RSI y MACD (RSI 14, MACD 12/26/9).
Goal: Calcular indicadores tecnicos consistentes con SPEC.
Inputs: Serie de cierres 1h.
Outputs: Series de RSI y MACD por simbolo.
Steps: Implementar formulas o usar libreria aprobada.
Done condition: Valores de RSI y MACD se calculan para cada vela.
Depends on: [T1.5]
Risks: Errores de formula o manejo de NaN.
Test/Verification: Comparar valores contra una fuente de referencia.

7. `T1.7` Implementar deteccion de senal (RSI < 25 y cruce MACD histograma).
Goal: Identificar reversion al alza segun regla.
Inputs: RSI y MACD histograma por vela.
Outputs: Lista de senales con timestamp.
Steps: Detectar cruce histograma y umbral RSI.
Done condition: Se detectan senales correctamente en datos de prueba.
Depends on: [T1.6]
Risks: Interpretacion incorrecta del cruce.
Test/Verification: Validar con ejemplos manuales.

8. `T1.8` Implementar ordenamiento y tabla de resultados.
Goal: Generar ficha por activo y ordenar por RSI ascendente.
Inputs: Senales detectadas y datos de precio.
Outputs: Tabla final con columnas minimas.
Steps: Construir filas con simbolo, precio, RSI, MACD, hora.
Done condition: Tabla lista para publicar.
Depends on: [T1.7]
Risks: Campos incompletos o mal formateados.
Test/Verification: Revisar tabla con 2-3 activos de muestra.

9. `T1.9` Implementar escritura de resultados en Google Sheets.
Goal: Publicar la tabla en la hoja destino.
Inputs: Tabla de resultados y credenciales Google.
Outputs: Hoja actualizada con resultados.
Steps: Limpiar rango y escribir filas.
Done condition: Resultados visibles en Google Sheets.
Depends on: [T1.4, T1.8]
Risks: Errores de permisos o limites de escritura.
Test/Verification: Verificar visualmente en la hoja destino.

10. `T1.10` Implementar envio de email via Gmail API.
Goal: Enviar resumen + top senales + link/adjunto al spreadsheet.
Inputs: Resultados y destinatarios.
Outputs: Email enviado correctamente.
Steps: Formatear resumen, adjuntar/linkear y enviar.
Done condition: Email recibido con contenido esperado.
Depends on: [T1.8, T1.9]
Risks: Limites de Gmail o auth invalida.
Test/Verification: Enviar a un buz on de prueba y validar contenido.

11. `T1.11` Implementar backtesting con salida de resultados.
Goal: Ejecutar backtest 1 ano y generar metricas.
Inputs: Historico 1h y regla de senal.
Outputs: Senales totales, win rate, retorno medio 5/10/20 velas.
Steps: Simular senales, calcular metricas.
Done condition: Reporte de backtest generado.
Depends on: [T1.5, T1.6, T1.7]
Risks: Sesgo de lookahead o datos incompletos.
Test/Verification: Ejecutar en un simbolo conocido y revisar metricas.

12. `T1.12` Agregar manejo de errores y logs.
Goal: Parar ejecucion ante fallas criticas y registrar errores.
Inputs: Errores de API/Google/Gmail.
Outputs: Logs con errores y detencion segura.
Steps: Envolver llamadas criticas, propagar errores.
Done condition: Fallas criticas detienen ejecucion con log.
Depends on: [T1.5, T1.9, T1.10]
Risks: Errores silenciosos o logs insuficientes.
Test/Verification: Simular fallas y verificar detencion.

## Execution status
Status: NOT_STARTED
Current task: T1.1
Last updated: 2026-03-26
