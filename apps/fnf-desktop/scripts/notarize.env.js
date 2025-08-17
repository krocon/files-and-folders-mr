/**
 * Centralized access to Apple signing/notarization environment variables.
 * Do not commit secrets; provide them via your shell or a local .env file.
 */

module.exports = {
  appleId: process.env.APPLE_ID,
  appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
  teamId: process.env.APPLE_TEAM_ID,
  appleApiKey: process.env.APPLE_API_KEY,
  appleApiKeyId: process.env.APPLE_API_KEY_ID,
  appleApiIssuer: process.env.APPLE_API_ISSUER,
};
