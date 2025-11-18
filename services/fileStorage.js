const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class FileStorage {
    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1', // Default to us-east-1 if not set
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        this.bucketName = process.env.S3_BUCKET_NAME || 'for-the-best-queenz';
        this.uploadFolder = 'uploads';
    }

    async uploadFile(file, folder = '') {
        try {
            const fileExt = path.extname(file.originalname).toLowerCase();
            const fileName = `${this.uploadFolder}${folder ? '/' + folder : ''}/${uuidv4()}${fileExt}`;
            
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read'
            });

            await this.s3Client.send(command);
            
            // Return the public URL
            return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
        } catch (error) {
            console.error('Error uploading file to S3:', error);
            throw error;
        }
    }

    async deleteFile(fileUrl) {
        try {
            if (!fileUrl) return;
            
            // Extract the key from the URL
            const url = new URL(fileUrl);
            let key = url.pathname.substring(1); // Remove leading slash
            
            // Handle different URL formats
            if (url.hostname.endsWith('amazonaws.com')) {
                // Full S3 URL format
                key = key.replace(`${this.bucketName}/`, '');
            }
            
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });
            
            await this.s3Client.send(command);
            return true;
        } catch (error) {
            console.error('Error deleting file from S3:', error);
            return false;
        }
    }

    async listFiles(prefix = '') {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix ? `${this.uploadFolder}/${prefix}` : this.uploadFolder
            });
            
            const response = await this.s3Client.send(command);
            return response.Contents?.map(item => ({
                key: item.Key,
                url: `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${item.Key}`,
                lastModified: item.LastModified,
                size: item.Size
            })) || [];
        } catch (error) {
            console.error('Error listing files from S3:', error);
            throw error;
        }
    }
}

// Export a singleton instance
module.exports = new FileStorage();
