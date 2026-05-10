#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Running build fix for Render deployment...');

// Source and destination paths
const sourceDistPath = path.join(__dirname, 'dist');
const targetDistPath = path.join('/opt/render/project/src/ResortManagementBooking/hotel-booking-backend/dist');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDistPath)) {
  console.log('📁 Creating target directory:', targetDistPath);
  fs.mkdirSync(targetDistPath, { recursive: true });
}

// Copy files from source to target
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.error('❌ Source directory does not exist:', src);
    return false;
  }

  console.log('📋 Copying from', src, 'to', dest);
  
  // Create destination if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Copy all files and subdirectories
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log('✅ Copied:', entry.name);
    }
  }
  
  return true;
}

// Execute the copy
try {
  const success = copyDirectory(sourceDistPath, targetDistPath);
  
  if (success) {
    console.log('🎉 Build fix completed successfully!');
    console.log('📂 Files are now available at:', targetDistPath);
    
    // Verify the main file exists
    const mainFile = path.join(targetDistPath, 'src', 'index.js');
    if (fs.existsSync(mainFile)) {
      console.log('✅ Main file verified at:', mainFile);
    } else {
      console.error('❌ Main file not found at:', mainFile);
      process.exit(1);
    }
  } else {
    console.error('❌ Build fix failed!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Build fix error:', error);
  process.exit(1);
}
