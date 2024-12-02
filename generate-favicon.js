const sharp = require('sharp');
const fs = require('fs');

// List of sizes for the favicon
const sizes = [64, 48, 32, 16];

async function generateFavicon(inputFile, outputFile) {
  try {
    // Create an array of resized images
    const images = await Promise.all(
      sizes.map((size) =>
        sharp(inputFile).resize(size, size).toBuffer()
      )
    );

    // Combine the resized images into a single .ico file
    fs.writeFileSync(outputFile, Buffer.concat(images));

    console.log(`Favicon created at ${outputFile}`);
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

// Input and output paths
const inputFile = './coffee.png'; // Adjust this path as needed
const outputFile = './app/favicon.ico'; // Place it in the public folder

generateFavicon(inputFile, outputFile);
