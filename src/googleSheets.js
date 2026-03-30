const { google } = require("googleapis");

function buildOAuthClient(secrets) {
  if (
    !secrets?.googleClientId ||
    !secrets?.googleClientSecret ||
    !secrets?.googleRefreshToken
  ) {
    throw new Error("Missing Google OAuth credentials in secrets");
  }

  const client = new google.auth.OAuth2(
    secrets.googleClientId,
    secrets.googleClientSecret
  );
  client.setCredentials({ refresh_token: secrets.googleRefreshToken });
  return client;
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase();
}

function extractTickers(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const [firstRow, ...rest] = values;
  const header = normalizeHeader(firstRow?.[0]);
  const rows = header === "symbol" || header === "ticker" ? rest : values;

  return rows
    .map((row) => String(row?.[0] || "").trim())
    .filter((ticker) => ticker.length > 0);
}

async function loadTickers(config) {
  if (!config?.google?.sheetId || !config?.google?.tickersSheetName) {
    throw new Error("Missing google.sheetId or google.tickersSheetName in config");
  }

  const auth = buildOAuthClient(config.secrets);
  const sheets = google.sheets({ version: "v4", auth });
  const range = `${config.google.tickersSheetName}!A1:A`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.sheetId,
    range,
  });

  return extractTickers(response.data.values);
}

module.exports = {
  loadTickers,
  extractTickers,
  buildOAuthClient,
};
