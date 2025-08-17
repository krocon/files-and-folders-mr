# Files and Folders Desktop (Electron) — macOS Signing & Notarization

This project distributes a macOS DMG. If the app is unsigned and not notarized, macOS Gatekeeper/XProtect can flag it as
unsafe and even show a dialog like:

> “Malware removed and moved to Trash” / “Malware entfernt und in den Papierkorb gelegt”.

The fix is to ship a properly signed (Developer ID) and notarized build with the Hardened Runtime enabled.

---

## What changed in the repo

- Enabled Hardened Runtime and entitlements for mac builds:
    - Added: `apps/fnf-desktop/build/entitlements.mac.plist`
    - Updated: `apps/fnf-desktop/package.json` → `build.mac.hardenedRuntime`, `build.mac.entitlements`,
      `build.mac.entitlementsInherit`

With these in place, electron-builder will code-sign (when a valid Developer ID identity is available) and can notarize
when the proper environment variables are set.

---

## Prerequisites

1. Apple Developer Account (paid).
2. Developer ID Application certificate installed in your macOS keychain.
    - Easiest: In Xcode → Settings → Accounts → Manage Certificates → “+” → Developer ID Application.
    - Or import a `.p12` and set `CSC_LINK`/`CSC_KEY_PASSWORD` environment variables.
3. Xcode + Command Line Tools installed.
4. Notarization credentials (one of):
    - Option A (simple): Apple ID + App-specific password.
        - APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID
    - Option B (recommended CI): App Store Connect API key (notarytool)
        - APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER

Electron-builder v24+ can auto-detect credentials via environment variables and perform notarization.

---

## Build, Sign, and Notarize (local macOS)

From the repository root:

```bash
# 1) Ensure signing identity is available (auto-discovery)
export CSC_IDENTITY_AUTO_DISCOVERY=true

# 2) Provide notarization credentials (choose one option)
# Option A – Apple ID credentials
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOURTEAMID"

# Option B – App Store Connect API key (recommended for CI)
# export APPLE_API_KEY="/absolute/path/to/AuthKey_ABCDEF1234.p8"
# export APPLE_API_KEY_ID="ABCDEF1234"
# export APPLE_API_ISSUER="00000000-0000-0000-0000-000000000000"

# 3) Build and package
pnpm -C apps/fnf-desktop pack
```

Artifacts will be in `apps/fnf-desktop/release/`, e.g. `Files and Folders-<version>-arm64.dmg`.

Electron-builder will:

- sign the app using your Developer ID identity, and
- notarize it automatically if the above environment variables are set correctly.

---

## Verifying the result

Run these commands on the built `.app` and `.dmg` (replace paths accordingly):

```bash
codesign --display --verbose=4 "release/mac-arm64/Files and Folders.app"
spctl -a -vvv -t install "release/Files and Folders-<version>-arm64.dmg"
```

Open the DMG and start the app. It should launch without malware or unidentified developer warnings.

---

## Troubleshooting

- If you still see warnings:
    - Ensure the app has been both signed and notarized (notarization is required since macOS Catalina for external
      distribution).
    - Confirm your environment variables are correct and the Developer ID certificate is present.
    - Check the notarization logs printed by electron-builder during `pack`.
- For local testing (not recommended for distribution), you can bypass Gatekeeper once by right-clicking the app → Open.
- As a last resort for local only, you can remove the quarantine attribute from a downloaded artifact:

```bash
xattr -dr com.apple.quarantine "/path/to/Files and Folders.app"
```

Do not ship artifacts with quarantine removed; always sign and notarize for users.

---

## CI hints (GitHub Actions example sketch)

- Set the APPLE_* secrets in your repository settings.
- On a macOS runner, run the same `pnpm -C apps/fnf-desktop pack` command.

---

## Notes

- The app uses Hardened Runtime and an entitlements file allowing user-selected file access, JIT, and required Electron
  allowances.
- No credentials are stored in the repo. Everything is controlled through environment variables.

---

## FAQ: Where is the notarize step configured?

- Short answer: There isn’t an explicit `notarize` block in `apps/fnf-desktop/package.json`. Electron Builder performs
  notarization automatically when the required environment variables are present. If those variables are missing, it
  prints: `skipped macOS notarization reason=\`notarize\` options were unable to be generated`.

- How it works now: Provide credentials via environment variables before running `pnpm -C apps/fnf-desktop pack`:
    - Option A (Apple ID): APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID
    - Option B (App Store Connect API key): APPLE_API_KEY, APPLE_API_KEY_ID, APPLE_API_ISSUER
      With these set, electron-builder will sign and then notarize the app automatically. No extra config file is
      required.

- If you prefer an explicit config step: You can add an `afterSign` hook and a small script. This makes the location of
  the notarize step obvious in your config.
    1) In `apps/fnf-desktop/package.json` under `build` add:

  ```json
  {
    "build": {
      "afterSign": "scripts/notarize.js"
    }
  }
  ```

    2) Create `apps/fnf-desktop/scripts/notarize.js`:

  ```js
  // apps/fnf-desktop/scripts/notarize.js
  const path = require('node:path');
  const fs = require('node:fs');
  const { notarize } = require('@electron/notarize');
  
  module.exports = async function notarizeMac(context) {
    if (process.platform !== 'darwin') return;

    const appId = 'com.krocon.filesandfolders.desktop';
    const { appOutDir, packager } = context;
    const appName = packager.appInfo.productFilename;
    const appPath = path.join(appOutDir, `${appName}.app`);
    if (!fs.existsSync(appPath)) {
      console.warn('[notarize] app path not found:', appPath);
      return;
    }

    // Use either Apple ID or API key credentials via env vars
    const hasAppleId = !!(process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID);
    const hasApiKey = !!(process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER);
    if (!hasAppleId && !hasApiKey) {
      console.warn('[notarize] missing credentials, skipping notarization');
      return;
    }

    console.log('[notarize] submitting to Apple…');
    await notarize({
      tool: 'notarytool',
      appBundleId: appId,
      appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER,
    });
    console.log('[notarize] done.');
  };
  ```

  Notes:
    - Keep using the same environment variables as in the automatic approach.
    - If you enable this explicit `afterSign` hook, avoid relying on electron-builder’s auto-notarization at the same
      time to prevent duplicate submissions.

---

## Local packaging for testing (no signing, no notarization)

If you just want to try the app locally without code signing and notarization, run:

```bash
pnpm -C apps/fnf-desktop pack:unsigned
```

What this does:

- Disables code signing (mac.identity = null).
- Disables the afterSign hook (so no explicit notarize step is called).
- Forces notarization to be skipped (SKIP_NOTARIZE=true) even if credentials are present in your environment.

Opening on macOS:

- The first launch may be blocked by Gatekeeper. Right-click the app in Finder → Open.
- If you downloaded the artifact, you can remove the quarantine attribute locally:

```bash
xattr -dr com.apple.quarantine "apps/fnf-desktop/release/mac-arm64/Files and Folders.app"
```

Important: Do not distribute unsigned builds. Use signing + notarization for anything shared with users.
