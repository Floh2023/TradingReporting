const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const REQUIRED_SECRET_KEYS = [
  "twelveDataApiKey",
  "googleClientId",
  "googleClientSecret",
  "googleRefreshToken",
];

function validateSecrets(secrets) {
  const missing = REQUIRED_SECRET_KEYS.filter((key) => !secrets[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing secret keys: ${missing.join(", ")}`
    );
  }
}

async function loadSecrets(awsConfig) {
  if (!awsConfig || !awsConfig.region || !awsConfig.secretId) {
    throw new Error("aws.region and aws.secretId are required in config");
  }

  const client = new SecretsManagerClient({ region: awsConfig.region });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: awsConfig.secretId })
  );

  if (!response.SecretString) {
    throw new Error("SecretString is empty for the given secret");
  }

  let secrets;
  try {
    secrets = JSON.parse(response.SecretString);
  } catch (error) {
    throw new Error("SecretString is not valid JSON");
  }

  validateSecrets(secrets);
  return secrets;
}

module.exports = {
  loadSecrets,
  validateSecrets,
  REQUIRED_SECRET_KEYS,
};
