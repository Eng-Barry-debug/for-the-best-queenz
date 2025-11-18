const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fileStorage = require('../services/fileStorage');

// Path to the products JSON file
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');

// Ensure data directory exists
const ensureDataDirectory = async () => {
    const dataDir = path.join(__dirname, '..', 'data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
        // Initialize products file if it doesn't exist
        try {
            await fs.access(PRODUCTS_FILE);
        } catch (e) {
            await fs.writeFile(PRODUCTS_FILE, JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error('Error initializing data directory:', error);
    }
};

// Initialize data directory
ensureDataDirectory();

// Configure multer for file uploads (in-memory storage for S3 uploads)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }
}).single('image');

// Middleware to handle file upload and form data
const handleFileUpload = async (req, res, next) => {
    console.log('Handling file upload...');
    
    upload(req, res, async (err) => {
        if (err) {
            console.error('File upload error:', err);
            return res.status(400).json({ error: err.message });
        }
        
        // If there's a file, upload it to S3
        if (req.file) {
            try {
                const fileUrl = await fileStorage.uploadFile(req.file);
                console.log('File uploaded to S3:', fileUrl);
                req.fileUrl = fileUrl; // Store the URL for later use
            } catch (error) {
                console.error('Error uploading file to S3:', error);
                return res.status(500).json({ error: 'Failed to upload file' });
            }
        }
        
        next();
    });
};

// Parse JSON body for non-file upload requests
const jsonParser = (req, res, next) => {
    if (req.headers['content-type'] && 
        req.headers['content-type'].startsWith('application/json')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(body);
                next();
            } catch (e) {
                console.error('Error parsing JSON:', e);
                res.status(400).json({ error: 'Invalid JSON' });
            }
        });
    } else {
        next();
    }
};

// Toggle featured status for a product
const toggleFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        const { featured } = req.body;
        
        if (typeof featured !== 'boolean') {
            return res.status(400).json({ error: 'Featured status must be a boolean' });
        }
        
        const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf-8'));
        const productIndex = products.findIndex(p => p.id == id);
        
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        products[productIndex].featured = featured;
        products[productIndex].updatedAt = new Date().toISOString();
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        
        res.json(products[productIndex]);
    } catch (error) {
        console.error('Error toggling featured status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = async (req, res) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    
    try {
        // Extract ID from URL for all methods
        const id = req.params?.id;
        
        // Handle featured status toggle
        if (req.url.startsWith('/featured/') && req.method === 'PUT') {
            // Extract the ID from the URL
            const id = req.url.split('/').pop();
            req.params = { id };
            return await toggleFeatured(req, res);
        }

        // Handle different HTTP methods
        if (req.method === 'GET') {
            if (id) {
                // Get single product
                await getProduct(req, res);
            } else {
                // Get all products with optional featured filter
                await getProducts(req, res);
            }
        } else if (req.method === 'POST') {
            // Handle file upload for new product
            handleFileUpload(req, res, async () => {
                try {
                    console.log('Processing POST request with data:', req.body);
                    console.log('Uploaded file:', req.file);
                    await addProduct(req, res);
                } catch (error) {
                    console.error('Error in POST handler:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            });
        } else if (req.method === 'PUT') {
            // Check if this is a JSON request or form data
            if (req.headers['content-type'] && req.headers['content-type'].startsWith('application/json')) {
                // Handle JSON request directly
                jsonParser(req, res, async () => {
                    try {
                        console.log('Processing JSON PUT request with data:', req.body);
                        await updateProduct(req, res);
                    } catch (error) {
                        console.error('Error in JSON PUT handler:', error);
                        res.status(500).json({ error: 'Internal server error' });
                    }
                });
            } else {
                // Handle file upload for product update
                handleFileUpload(req, res, async () => {
                    try {
                        console.log('Processing form-data PUT request with data:', req.body);
                        console.log('Uploaded file:', req.file);
                        await updateProduct(req, res);
                    } catch (error) {
                        console.error('Error in form-data PUT handler:', error);
                        res.status(500).json({ error: 'Internal server error' });
                    }
                });
            }
        } else if (req.method === 'DELETE') {
            // Delete product
            await deleteProduct(req, res);
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Unexpected error in products API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

async function getProducts(req, res) {
    try {
        // Ensure the file exists
        try {
            await fs.access(PRODUCTS_FILE);
        } catch (e) {
            return res.json([]);
        }
        
        const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
        let products = JSON.parse(data || '[]');
        
        // Filter by featured status if requested
        if (req.query.featured === 'true') {
            products = products.filter(p => p.featured === true);
        }
        
        // Apply limit if specified
        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            products = products.slice(0, limit);
        }
        
        res.json(products);
    } catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}

async function addProduct(req, res) {
    try {
        const { name, price, description, category, stock } = req.body;
        
        const newProduct = {
            id: uuidv4(),
            name,
            price: parseFloat(price),
            description,
            category,
            stock: parseInt(stock) || 0,
            image: req.fileUrl || null,
            featured: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        let products = [];
        try {
            const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
            products = JSON.parse(data || '[]');
        } catch (error) {
            console.log('Creating new products file');
        }

        products.push(newProduct);
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));

        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
}

async function getProduct(req, res) {
    try {
        const { id } = req.params;
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(data);

        // Find product with loose equality to handle both string and number IDs
        const product = products.find(p => p.id == id);

        if (!product) {
            console.log(`Product with ID ${id} not found. Available IDs:`, products.map(p => p.id));
            return res.status(404).json({ 
                error: 'Product not found',
                requestedId: id,
                availableIds: products.map(p => p.id)
            });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error('Error reading product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                error: 'Product ID is required',
                requestDetails: {
                    url: req.url,
                    method: req.method,
                    params: req.params,
                    body: req.body
                }
            });
        }
        
        // Handle both JSON and form data
        let updatedData = {};
        if (req.headers['content-type'] && req.headers['content-type'].startsWith('application/json')) {
            updatedData = req.body;
        } else {
            updatedData = {
                name: req.body.name,
                category: req.body.category,
                price: req.body.price,
                description: req.body.description,
                stock: req.body.stock,
                featured: req.body.featured === 'true'
            };
        }
        
        // Read current products
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(data || '[]');

        // Find the product to update - handle both string and number IDs
        const productIndex = products.findIndex(p => p.id == id); // Use loose equality to handle string/number comparison

        if (productIndex === -1) {
            console.log(`Product with ID ${id} not found. Available IDs:`, products.map(p => p.id));
            return res.status(404).json({ 
                error: 'Product not found',
                requestedId: id,
                availableIds: products.map(p => p.id)
            });
        }

        // Validate required fields
        if (!updatedData.name || !updatedData.price) {
            return res.status(400).json({ 
                error: 'Validation error',
                details: 'Name and price are required',
                receivedData: updatedData
            });
        }

        // Store old image URL for cleanup
        const oldImageUrl = products[productIndex].image;
        let newImageUrl = oldImageUrl;

        // If there's a new image, update the URL
        if (req.fileUrl) {
            newImageUrl = req.fileUrl;
            
            // Delete old image if it exists and is from S3
            if (oldImageUrl && oldImageUrl.includes('amazonaws.com')) {
                try {
                    await fileStorage.deleteFile(oldImageUrl);
                    console.log('Deleted old S3 image:', oldImageUrl);
                } catch (error) {
                    console.error('Error deleting old image from S3:', error);
                    // Continue even if deletion fails
                }
            }
        }

        // Update the product
        const updatedProduct = {
            ...products[productIndex],
            ...updatedData,
            image: newImageUrl, // Use new image URL if it was updated
            updatedAt: new Date().toISOString()
        };

        products[productIndex] = updatedProduct;
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));

        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        // Clean up uploaded file if there was an error
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        
        // Read current products
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(data || '[]');
        
        // Find the product to delete
        const productIndex = products.findIndex(p => p.id == id);
        
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Get the product to delete
        const productToDelete = products[productIndex];
        
        // Remove the product from the array
        products.splice(productIndex, 1);
        
        // Save the updated products array
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        
        // Delete the associated image file if it exists
        if (productToDelete.image) {
            try {
                await fileStorage.deleteFile(productToDelete.image);
                console.log('Deleted image file:', productToDelete.image);
            } catch (error) {
                console.error('Error deleting image file:', error);
            }
        }
        
        // Save the updated products array
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));

        res.json({ message: 'Product deleted successfully' });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}