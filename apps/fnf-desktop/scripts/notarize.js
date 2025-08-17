const path = require("node:path");
const fs = require("node:fs");
const {notarize} = require("@electron/notarize");

module.exports = async function notarizeMac(context) {
  if (process.platform !== "darwin") return;

  if (process.env.SKIP_NOTARIZE === "true" || process.env.SKIP_NOTARIZE === "1") {
    console.warn("[notarize] SKIP_NOTARIZE is set, skipping notarization");
    return;
  }

  const appId = "com.krocon.filesandfolders.desktop";
  const {appOutDir, packager} = context;
  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);
  if (!fs.existsSync(appPath)) {
    console.warn("[notarize] app path not found:", appPath);
    return;
  }

  // Use either Apple ID or API key credentials via env vars
  const hasAppleId = !!(process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID);
  const hasApiKey = !!(process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER);
  if (!hasAppleId && !hasApiKey) {
    console.warn("[notarize] missing credentials, skipping notarization");
    return;
  }

  console.log("[notarize] submitting to Apple…");
  await notarize({
    tool: "notarytool",
    appBundleId: appId,
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
    appleApiKey: process.env.APPLE_API_KEY,
    appleApiKeyId: process.env.APPLE_API_KEY_ID,
    appleApiIssuer: process.env.APPLE_API_ISSUER,
  });
  console.log("[notarize] done.");
};