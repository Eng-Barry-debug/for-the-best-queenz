const fs = require('fs').promises;
const path = require('path');
const fileStorage = require('../services/fileStorage');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Configuration
const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');

// Track files in use
const usedFiles = new Set();

async function findUsedFiles() {
    try {
        // Read products data
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(data || '[]');
        
        // Extract all image URLs from products
        products.forEach(product => {
            if (product.image) {
                // For local files, we only care about the filename
                if (product.image.startsWith('/uploads/')) {
                    const fileName = path.basename(product.image);
                    usedFiles.add(fileName);
                } else if (product.image.includes('amazonaws.com')) {
                    // For S3 files, we use the full URL as the key
                    usedFiles.add(product.image);
                }
            }
        });
        
        console.log(`Found ${usedFiles.size} files in use`);
        return usedFiles;
    } catch (error) {
        console.error('Error finding used files:', error);
        throw error;
    }
}

async function cleanLocalUploads() {
    try {
        // Ensure uploads directory exists
        await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
        
        // Get all files in uploads directory
        const files = await fs.readdir(LOCAL_UPLOADS_DIR);
        let deletedCount = 0;
        
        // Delete files not in use
        for (const file of files) {
            if (!usedFiles.has(file)) {
                const filePath = path.join(LOCAL_UPLOADS_DIR, file);
                try {
                    await fs.unlink(filePath);
                    console.log(`Deleted local file: ${file}`);
                    deletedCount++;
                } catch (error) {
                    console.error(`Error deleting file ${file}:`, error);
                }
            }
        }
        
        console.log(`Cleaned up ${deletedCount} local files`);
        return deletedCount;
    } catch (error) {
        console.error('Error cleaning local uploads:', error);
        throw error;
    }
}

async function cleanS3Uploads() {
    try {
        const s3Files = await fileStorage.listFiles();
        let deletedCount = 0;
        
        for (const file of s3Files) {
            if (!usedFiles.has(file.url)) {
                try {
                    await fileStorage.deleteFile(file.url);
                    console.log(`Deleted S3 file: ${file.key}`);
                    deletedCount++;
                } catch (error) {
                    console.error(`Error deleting S3 file ${file.key}:`, error);
                }
            }
        }
        
        console.log(`Cleaned up ${deletedCount} S3 files`);
        return deletedCount;
    } catch (error) {
        console.error('Error cleaning S3 uploads:', error);
        throw error;
    }
}

async function runCleanup() {
    console.log('Starting cleanup of orphaned files...');
    
    try {
        // Find all files that are in use
        await findUsedFiles();
        
        // Clean up local files
        const localCleaned = await cleanLocalUploads();
        
        // Clean up S3 files if configured
        let s3Cleaned = 0;
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            s3Cleaned = await cleanS3Uploads();
        }
        
        console.log(`Cleanup complete. Removed ${localCleaned} local files and ${s3Cleaned} S3 files.`);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

// Run the cleanup if this script is called directly
if (require.main === module) {
    runCleanup();
}

module.exports = {
    findUsedFiles,
    cleanLocalUploads,
    cleanS3Uploads,
    runCleanup
};
