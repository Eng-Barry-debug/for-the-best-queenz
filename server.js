import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

// For serverless environments
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Validate required environment variables
const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8000;

// Create necessary directories if they don't exist
const initDirectories = async () => {
    try {
        const dirs = [
            path.join(__dirname, 'public', 'uploads'),
            path.join(__dirname, 'data')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        // Initialize data files if they don't exist
        const dataFiles = [
            { file: 'products.json', content: [] },
            { file: 'categories.json', content: [] },
            { file: 'orders.json', content: [] },
            { file: 'contacts.json', content: [] }
        ];
        
        for (const { file, content } of dataFiles) {
            const filePath = path.join(__dirname, 'data', file);
            try {
                await fs.access(filePath);
            } catch (e) {
                await fs.writeFile(filePath, JSON.stringify(content, null, 2));
            }
        }
    } catch (error) {
        console.error('Error initializing directories:', error);
    }
};

// Initialize directories and data files
initDirectories().catch(console.error);

const uploadsDir = path.join(__dirname, 'public', 'uploads');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// API routes
app.all('/api/products/:id?', require('./api/products.js'));
app.all('/api/categories/:id?', require('./api/categories.js'));
app.all('/api/contacts/:id?', require('./api/contacts.js'));
app.all('/api/orders/:id?', require('./api/orders.js'));

// Catch-all handler: send back index.html for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server only if not in a serverless environment
if (!isVercel) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the Express API for Vercel
module.exports = app;