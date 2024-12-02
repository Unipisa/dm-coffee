const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const outputDir = "./public";

// Sizes required for modern web apps
const sizes = [
  { size: 16, fileName: "favicon-16x16.png" },
  { size: 32, fileName: "favicon-32x32.png" },
  { size: 48, fileName: "favicon-48x48.png" },
  { size: 64, fileName: "favicon-64x64.png" },
  { size: 128, fileName: "favicon-128x128.png" },
  { size: 180, fileName: "apple-touch-icon.png" }, // Apple touch icon
];

// ICO sizes for compatibility
const icoSizes = [16, 32, 48, 64];

// Generate all required sizes
async function generateIcons(inputFile) {
  try {
    console.log("Generating icons...");

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate PNGs for each required size
    for (const { size, fileName } of sizes) {
      const outputPath = path.join(outputDir, fileName);
      await sharp(inputFile)
        .resize(size, size)
        .toFile(outputPath);
      console.log(`Created ${fileName}`);
    }

    // Generate ICO file
    const icoBuffers = await Promise.all(
      icoSizes.map((size) => sharp(inputFile).resize(size, size).toBuffer())
    );
    const icoPath = path.join(outputDir, "favicon.ico");
    fs.writeFileSync(icoPath, Buffer.concat(icoBuffers));
    console.log("Created favicon.ico");

    console.log("All icons generated successfully.");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

// Input image file
const inputFile = "./coffee.png"; // Path to your input PNG file
if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
  process.exit(1);
}

generateIcons(inputFile);
