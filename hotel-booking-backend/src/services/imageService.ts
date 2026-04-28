import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
    // Set upload directory - handle both development and production environments
    const isProduction = __dirname.includes('dist');
    if (isProduction) {
      // In production, we need to go up more levels from dist/hotel-booking-backend/src
      this.uploadDir = path.join(__dirname, '..', '..', '..', '..', 'uploads');
    } else {
      // In development (running from src), go up from src to project root
      this.uploadDir = path.join(__dirname, '..', '..', 'uploads');
    }
    
    this.baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 7002}`;
    
    // Ensure upload directory exists
    this.ensureUploadDir();
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

        const uniqueName = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(this.uploadDir, uniqueName);
        
        // Write file to disk
        fs.writeFileSync(filePath, file.buffer);
        
        // Generate URL
        const imageUrl = `${this.baseUrl}/uploads/${uniqueName}`;
        imageUrls.push(imageUrl);
        
        console.log('✅ Image saved:', uniqueName);
        console.log('🔗 Generated URL:', imageUrl);
        
      } catch (error) {
        console.error('❌ Error saving image:', error);
        continue;
      }
    }
    
    console.log('📊 Total images processed:', imageUrls.length);
    return imageUrls;
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
