// Create simple placeholder images using canvas
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create a simple 1x1 PNG placeholder (minimal valid PNG)
const createMinimalPNG = () => {
  // This is a minimal 1x1 transparent PNG
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk start
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // bit depth, color type, compression, filter, interlace
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk start
    0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, // compressed data
    0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // more data
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
    0xAE, 0x42, 0x60, 0x82 // PNG end
  ]);
};

// List of missing images from the logs
const missingImages = [
  '000c8992-68d0-4e3d-8dac-5a9917bd38b8.png',
  'f9787d77-8a31-447d-8453-38280bee07d3.png',
  '6a3707c1-3a51-45f1-b1ee-54e9e3e1a5fa.png'
];

// Create placeholder images
missingImages.forEach(filename => {
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Creating placeholder for: ${filename}`);
    
    try {
      // Create minimal PNG
      const pngData = createMinimalPNG();
      fs.writeFileSync(filePath, pngData);
      console.log(`✅ Created placeholder: ${filename}`);
    } catch (error) {
      console.error(`❌ Error creating ${filename}:`, error.message);
    }
  } else {
    console.log(`✅ File already exists: ${filename}`);
  }
});

console.log('📁 Placeholder creation completed');
