"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
class ImageService {
    constructor() {
        // Set upload directory - handle both development and production environments
        const isProduction = __dirname.includes('dist');
        if (isProduction) {
            // In production, we need to go up more levels from dist/hotel-booking-backend/src
            this.uploadDir = path_1.default.join(__dirname, '..', '..', '..', '..', 'uploads');
        }
        else {
            // In development (running from src), go up from src to project root
            this.uploadDir = path_1.default.join(__dirname, '..', '..', 'uploads');
        }
        this.baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 7002}`;
        // Ensure upload directory exists
        this.ensureUploadDir();
    }
    ensureUploadDir() {
        if (!fs_1.default.existsSync(this.uploadDir)) {
            fs_1.default.mkdirSync(this.uploadDir, { recursive: true });
            console.log('📁 Created uploads directory:', this.uploadDir);
        }
    }
    /**
     * Save uploaded image files and return their URLs
     */
    saveImages(files) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('📸 Starting image upload process...');
            console.log('📁 Upload directory:', this.uploadDir);
            console.log('🔗 Base URL:', this.baseUrl);
            const imageUrls = [];
            for (const file of files) {
                try {
                    // Generate unique filename
                    const ext = path_1.default.extname(file.originalname).toLowerCase();
                    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                    if (!allowedExts.includes(ext)) {
                        console.warn('⚠️ Invalid file extension:', ext);
                        continue;
                    }
                    const uniqueName = `${crypto_1.default.randomUUID()}${ext}`;
                    const filePath = path_1.default.join(this.uploadDir, uniqueName);
                    // Write file to disk
                    fs_1.default.writeFileSync(filePath, file.buffer);
                    // Generate URL
                    const imageUrl = `${this.baseUrl}/uploads/${uniqueName}`;
                    imageUrls.push(imageUrl);
                    console.log('✅ Image saved:', uniqueName);
                    console.log('🔗 Generated URL:', imageUrl);
                }
                catch (error) {
                    console.error('❌ Error saving image:', error);
                    continue;
                }
            }
            console.log('📊 Total images processed:', imageUrls.length);
            return imageUrls;
        });
    }
    /**
     * Serve image file with proper headers
     */
    serveImage(req, res) {
        const filename = req.params.filename;
        const filePath = path_1.default.join(this.uploadDir, filename);
        // Security check - prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            console.log('🚫 Security violation - invalid filename:', filename);
            res.status(400).json({ error: 'Invalid filename' });
            return;
        }
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            console.log('❌ File not found:', filePath);
            res.status(404).json({ error: 'Image not found' });
            return;
        }
        // Get file stats
        const stats = fs_1.default.statSync(filePath);
        console.log('📊 File size:', stats.size, 'bytes');
        // Set proper content type
        const ext = path_1.default.extname(filename).toLowerCase();
        const contentTypes = {
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
            }
            else {
                console.log('✅ Image served successfully');
            }
        });
    }
    /**
     * Get all uploaded files info
     */
    getUploadedFiles() {
        try {
            const files = fs_1.default.readdirSync(this.uploadDir);
            return files.map(file => {
                const filePath = path_1.default.join(this.uploadDir, file);
                const stats = fs_1.default.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    url: `${this.baseUrl}/uploads/${file}`
                };
            });
        }
        catch (error) {
            console.error('❌ Error reading uploads directory:', error);
            return [];
        }
    }
}
exports.default = new ImageService();
