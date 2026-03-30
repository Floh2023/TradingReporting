const path = require("path");
const dotenv = require("dotenv");

const REQUIRED_ENV_VARS = [
  "TWELVE_DATA_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
];

function resolveDotenvPath() {
  if (process.env.DOTENV_PATH) {
    return path.resolve(process.env.DOTENV_PATH);
  }
  return path.join(process.cwd(), ".env");
}

function loadDotenv(dotenvPath) {
  const result = dotenv.config({ path: dotenvPath });
  if (result.error) {
    throw new Error(`Unable to load .env file at ${dotenvPath}`);
  }
}

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
}

function loadSecrets() {
  const dotenvPath = resolveDotenvPath();
  loadDotenv(dotenvPath);
  validateEnv();

  return {
    twelveDataApiKey: process.env.TWELVE_DATA_API_KEY,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  };
}

module.exports = {
  loadSecrets,
  resolveDotenvPath,
  REQUIRED_ENV_VARS,
};
