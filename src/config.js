const fs = require("fs");
const path = require("path");

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function resolveConfigPath() {
  if (process.env.CONFIG_PATH) {
    return process.env.CONFIG_PATH;
  }
  return path.join(process.cwd(), "config", "config.json");
}

function validateConfig(config) {
  const required = [
    ["aws", "region"],
    ["aws", "secretId"],
    ["google", "sheetId"],
    ["google", "tickersSheetName"],
    ["google", "resultsSheetName"],
    ["email", "from"],
    ["email", "to"],
    ["market", "timezone"],
    ["market", "interval"],
    ["market", "scheduleEt"],
  ];

  const missing = required.filter(([section, key]) => {
    return !config?.[section]?.[key];
  });

  if (missing.length > 0) {
    const formatted = missing.map(([section, key]) => `${section}.${key}`);
    throw new Error(`Missing config fields: ${formatted.join(", ")}`);
  }
}

function loadConfigFile() {
  const configPath = resolveConfigPath();
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Config file not found at ${configPath}. Copy config/config.example.json to config/config.json`
    );
  }

  const config = readJsonFile(configPath);
  validateConfig(config);
  return config;
}

function loadConfig() {
  return loadConfigFile();
}

module.exports = {
  loadConfig,
  loadConfigFile,
  validateConfig,
  resolveConfigPath,
};
