# Acceptance Criteria

1. El sistema lee una lista fija de simbolos desde un Google Sheet definido en configuracion.
2. Para cada simbolo, obtiene velas de 1h en horario regular (ET) desde Twelve Data.
3. Calcula RSI 14 y MACD 12/26/9, y detecta senales cuando RSI < 25 y el histograma MACD cruza de negativo a positivo.
4. Genera una ficha por activo con: simbolo, precio, RSI, MACD y hora de senal.
5. Ordena las senales por RSI ascendente (mas sobreventa primero).
6. Publica los resultados en Google Sheets en un formato tabular consistente.
7. Envia un email via Gmail API con resumen + top de senales + link/adjunto al spreadsheet.
8. Si falla una API critica (Twelve Data, Google Sheets o Gmail), la ejecucion se detiene y se registra el error.
9. Existe un modo de backtesting (1 ano) que usa datos historicos 1h y produce: senales totales, win rate y retorno medio a 5/10/20 velas.
10. La ejecucion programada corre a las 10:30, 13:30 y 15:30 ET.
