// Quick script to restore missing images with placeholders
const fs = require('fs');
const path = require('path');
const https = require('https');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// List of missing images from the logs
const missingImages = [
  '000c8992-68d0-4e3d-8dac-5a9917bd38b8.png',
  'f9787d77-8a31-447d-8453-38280bee07d3.png',
  '6a3707c1-3a51-45f1-b1ee-54e9e3e1a5fa.png'
];

// Download placeholder images for each missing file
missingImages.forEach(filename => {
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Creating placeholder for: ${filename}`);
    
    // Download a placeholder image
    const file = fs.createWriteStream(filePath);
    const request = https.get('https://picsum.photos/seed/placeholder/800/600.jpg', (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Created placeholder: ${filename}`);
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file on error
      console.error(`❌ Error downloading ${filename}:`, err.message);
    });
  } else {
    console.log(`✅ File already exists: ${filename}`);
  }
});

console.log('📁 Image restoration process completed');
