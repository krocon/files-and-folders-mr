const fs = require("fs");
const {execSync} = require("child_process");
const path = require("path");

function updateEnvironmentFiles() {
  // Get current date and time in the required format (DD.MM.YYYY HH:MM)
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const version = `${day}.${month}.${year} ${hours}:${minutes}`;

  // Get current git commit hash (short version)
  let commitHash;
  try {
    commitHash = execSync("git rev-parse --short HEAD", {encoding: "utf8"}).trim();
  } catch (error) {
    console.warn("Could not get git commit hash, using fallback");
    commitHash = "unknown";
  }

  console.log(`Updating environment files with version: ${version}, commitHash: ${commitHash}`);

  // Get the script directory and build absolute paths
  const scriptDir = __dirname;

  // Files to update - all environment files across both apps
  const files = [
    path.join(scriptDir, "apps/fnf/src/environments/environment.ts"),
    path.join(scriptDir, "apps/fnf/src/environments/environment.prod.ts"),
    path.join(scriptDir, "apps/fnf-api/src/environments/environment.ts"),
    path.join(scriptDir, "apps/fnf-api/src/environments/environment.prod.ts")
  ];

  files.forEach(filePath => {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
      }

      let content = fs.readFileSync(filePath, "utf8");

      // Update version line (handles both "version: '...'" and "const version = '...'" patterns)
      content = content.replace(
        /version:\s*'[^']*'/,
        `version: '${version}'`
      );
      content = content.replace(
        /const\s+version\s*=\s*'[^']*'/,
        `const version = '${version}'`
      );

      // Update commitHash line (handles both "commitHash: '...'" and "const commitHash = '...'" patterns)
      content = content.replace(
        /commitHash:\s*'[^']*'/,
        `commitHash: '${commitHash}'`
      );
      content = content.replace(
        /const\s+commitHash\s*=\s*'[^']*'/,
        `const commitHash = '${commitHash}'`
      );

      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Updated ${filePath}`);
    } catch (error) {
      console.error(`Error updating ${filePath}:`, error.message);
    }
  });
}

updateEnvironmentFiles();
