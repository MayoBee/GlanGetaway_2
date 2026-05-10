import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
  fieldname: string;
  encoding: string;
  path?: string;
  filename?: string;
}
import { Request, Response } from 'express';

class ImageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    // Set upload directory - works for both development and compiled environments
    // From dist/src/services or src/services, go up to project root and then to uploads/
    // In development: src/services -> src -> project root -> uploads
    // In production: dist/src/services -> dist/src -> dist -> project root -> uploads

    const isProduction = __dirname.includes('dist');
    if (isProduction) {
      // From dist/src/services: go up to dist, then up to project root, then to uploads
      this.uploadDir = path.join(__dirname, '..', '..', '..', 'uploads');
    } else {
      // From src/services: go up to src, then up to project root, then to uploads
      this.uploadDir = path.join(__dirname, '..', '..', 'uploads');
    }

    this.baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

    // Configure Cloudinary if available
    this.configureCloudinary();

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private configureCloudinary(): void {
    const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
    const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

    const isCloudinaryConfigured =
      cloudinaryCloudName &&
      cloudinaryApiKey &&
      cloudinaryApiSecret &&
      !cloudinaryCloudName.includes('your-') &&
      !cloudinaryApiKey.includes('your-') &&
      !cloudinaryApiSecret.includes('your-');

    if (isCloudinaryConfigured) {
      cloudinary.config({
        cloud_name: cloudinaryCloudName,
        api_key: cloudinaryApiKey,
        api_secret: cloudinaryApiSecret,
      });
      console.log('☁️  Cloudinary configured successfully');
    } else {
      console.log('☁️  Cloudinary not configured - using local storage');
    }
  }

  private isCloudinaryAvailable(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET &&
      !process.env.CLOUDINARY_CLOUD_NAME.includes('your-')
    );
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log('📁 Created uploads directory:', this.uploadDir);
    }
  }

  /**
   * Save uploaded image files and return their URLs
   */
  async saveImages(files: UploadedFile[]): Promise<string[]> {
    console.log('📸 Starting image upload process...');
    console.log('📁 Upload directory:', this.uploadDir);
    console.log('🔗 Base URL:', this.baseUrl);
    console.log('☁️  Cloudinary available:', this.isCloudinaryAvailable());
    
    const imageUrls: string[] = [];
    
    for (const file of files) {
      try {
        // Generate unique filename
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        
        if (!allowedExts.includes(ext)) {
          console.warn('⚠️ Invalid file extension:', ext);
          continue;
        }

        let imageUrl: string;

        if (this.isCloudinaryAvailable()) {
          // Use Cloudinary for persistent storage
          try {
            const result = await cloudinary.uploader.upload(
              `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
              {
                folder: 'glan-getaway',
                public_id: `${crypto.randomUUID()}`,
                resource_type: 'auto',
                format: ext.replace('.', ''),
              }
            );
            
            imageUrl = result.secure_url;
            console.log('☁️  Image uploaded to Cloudinary:', imageUrl);
          } catch (cloudinaryError) {
            console.error('❌ Cloudinary upload failed, falling back to local:', cloudinaryError);
            // Fallback to local storage
            imageUrl = await this.saveImageLocally(file, ext);
          }
        } else {
          // Use local storage
          imageUrl = await this.saveImageLocally(file, ext);
        }
        
        imageUrls.push(imageUrl);
        
      } catch (error) {
        console.error('❌ Error saving image:', error);
        continue;
      }
    }
    
    console.log('📊 Total images processed:', imageUrls.length);
    return imageUrls;
  }

  private async saveImageLocally(file: UploadedFile, ext: string): Promise<string> {
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    
    // Write file to disk
    fs.writeFileSync(filePath, new Uint8Array(file.buffer));
    
    // Generate URL
    const imageUrl = `${this.baseUrl}/uploads/${uniqueName}`;
    
    console.log('✅ Image saved locally:', uniqueName);
    console.log('🔗 Generated URL:', imageUrl);
    
    return imageUrl;
  }

  /**
   * Serve image file with proper headers
   */
  serveImage(req: Request, res: Response): void {
    const filename = req.params.filename;
    const filePath = path.join(this.uploadDir, filename);


    
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.log('🚫 Security violation - invalid filename:', filename);
      res.status(400).json({ error: 'Invalid filename' });
      return;
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found:', filePath);
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('📊 File size:', stats.size, 'bytes');
    
    // Set proper content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Set enhanced headers for optimal caching and performance
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size.toString());
    
    // Enhanced caching strategy
    const oneYear = 365 * 24 * 60 * 60;
    res.setHeader('Cache-Control', `public, max-age=${oneYear}, immutable`);
    res.setHeader('ETag', `"${stats.size}-${stats.mtime.getTime()}"`);
    
    // Accept-Ranges for partial content support
    res.setHeader('Accept-Ranges', 'bytes');
    
    console.log('✅ Serving image:', {
      filename,
      contentType,
      size: stats.size,
      lastModified: stats.mtime,
      cacheControl: `public, max-age=${oneYear}, immutable`
    });
    
    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('❌ Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).send('Error serving image');
        }
      } else {
        console.log('✅ Image served successfully');
      }
    });
  }

  /**
   * Get all uploaded files info
   */
  getUploadedFiles(): Array<{name: string, size: number, url: string}> {
    try {
      const files = fs.readdirSync(this.uploadDir);
      return files.map(file => {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          url: `${this.baseUrl}/uploads/${file}`
        };
      });
    } catch (error) {
      console.error('❌ Error reading uploads directory:', error);
      return [];
    }
  }
}

export default new ImageService();
