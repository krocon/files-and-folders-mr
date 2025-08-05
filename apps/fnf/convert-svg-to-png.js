const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Define common icon sizes
const iconSizes = [16, 24, 32, 48, 64, 128, 256, 512];

// Input SVG file path
const svgPath = "./src/assets/ff.svg";

// Output directory for PNG files
const outputDir = "./src/assets/icons";

async function convertSvgToPng() {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {recursive: true});
    }

    console.log("Converting SVG to PNG files...");
    console.log(`Input: ${svgPath}`);
    console.log(`Output directory: ${outputDir}`);
    console.log("");

    // Read the SVG file
    const svgBuffer = fs.readFileSync(svgPath);

    // Convert to each size
    for (const size of iconSizes) {
      const outputPath = path.join(outputDir, `ff-${size}x${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size)
        .png({
          compressionLevel: 9,
          adaptiveFiltering: false,
          force: true
        })
        .toFile(outputPath);

      console.log(`✓ Generated: ff-${size}x${size}.png`);
    }

    console.log("");
    console.log("All PNG files generated successfully!");
    console.log(`Files saved to: ${outputDir}`);

  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
    process.exit(1);
  }
}

// Run the conversion
convertSvgToPng();