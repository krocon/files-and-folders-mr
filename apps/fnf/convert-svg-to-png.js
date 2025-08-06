const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Define common icon sizes
const iconSizes = [16, 24, 32, 48, 64, 128, 256, 512];

const colors = [
  "black",
  "gray",
  "green",
  "white"
];


async function convertSvgToPng(color) {

  const svgPath = `./src/assets/logo/ff-${color}.svg`;
  const outputDir = "./src/assets/logo/png";

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
      const outputPath = path.join(outputDir, `ff-${color}-${size}x${size}.png`);

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

  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
    process.exit(1);
  }
}


(async () => {
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    // Run the conversion
    await convertSvgToPng(color);
  }
  console.log("");
  console.log("All PNG files generated successfully!");
  console.log(`Files saved.`);
})();
