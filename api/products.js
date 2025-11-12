const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        fs.mkdir(uploadsDir, { recursive: true }).then(() => {
            cb(null, uploadsDir);
        }).catch(err => {
            cb(err);
        });
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
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
}).single('image');

// Middleware to handle file upload and form data
const handleFileUpload = (req, res, next) => {
    console.log('Handling file upload...');
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);
    
    upload(req, res, (err) => {
        if (err) {
            console.error('File upload error:', err);
            return res.status(400).json({ error: err.message });
        }
        console.log('File upload successful:', req.file);
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

module.exports = async (req, res) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    console.log('Content-Type:', req.headers['content-type']);
    
    try {
        const { id } = req.params;

        // Handle different HTTP methods
        if (req.method === 'GET') {
            if (id) {
                // Get single product
                await getProduct(req, res);
            } else {
                // Get all products
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
        const dataPath = path.join(process.cwd(), 'data', 'products.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const products = JSON.parse(data);

        res.status(200).json(products);
    } catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function addProduct(req, res) {
    try {
        console.log('Raw request body:', req.body);
        
        // Handle form data (from multipart/form-data)
        let newProduct = {};
        if (req.file) {
            // If we have a file, we're dealing with multipart/form-data
            newProduct = {
                name: req.body.name,
                category: req.body.category,
                price: req.body.price,
                description: req.body.description,
                stock: req.body.stock
            };
        } else {
            // Otherwise, it's JSON
            newProduct = req.body;
        }
        
        console.log('Processed product data:', newProduct);
        
        // Validate required fields
        if (!newProduct.name || !newProduct.price) {
            // If there was a file uploaded but validation failed, delete it
            if (req.file) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Handle file upload if exists
        let imagePath = '';
        if (req.file) {
            imagePath = '/uploads/' + path.basename(req.file.path);
        }

        // Read current products
        const dataPath = path.join(process.cwd(), 'data', 'products.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const products = JSON.parse(data);

        // Generate new ID
        const newId = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id) || 0)) + 1 : 1;

        // Create new product
        const product = {
            id: newId,
            name: newProduct.name,
            category: newProduct.category || '',
            price: parseFloat(newProduct.price) || 0,
            description: newProduct.description || '',
            image: imagePath || newProduct.image || 'https://via.placeholder.com/300x200?text=No+Image',
            stock: newProduct.stock ? parseInt(newProduct.stock) : 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        console.log('New product to be added:', product);

        // Add to products array
        products.push(product);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(products, null, 2));

        res.status(201).json({
            message: 'Product added successfully',
            product: product
        });

    } catch (error) {
        console.error('Error adding product:', error);
        // Clean up uploaded file if there was an error
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

async function getProduct(req, res) {
    try {
        const { id } = req.params;
        const dataPath = path.join(process.cwd(), 'data', 'products.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const products = JSON.parse(data);

        const product = products.find(p => p.id === parseInt(id));

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
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
        console.log('Updating product ID:', id);
        
        // Log the incoming request for debugging
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        
        // Handle both JSON and form data
        let updatedData = {};
        if (req.headers['content-type'] && req.headers['content-type'].startsWith('application/json')) {
            // JSON request
            updatedData = req.body;
        } else {
            // Form data (multipart/form-data)
            updatedData = {
                name: req.body.name,
                category: req.body.category,
                price: req.body.price,
                description: req.body.description,
                stock: req.body.stock
            };
        }
        
        console.log('Processed update data:', updatedData);

        // Read current products
        const dataPath = path.join(process.cwd(), 'data', 'products.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const products = JSON.parse(data);

        // Find the product to update
        const productIndex = products.findIndex(p => p.id === parseInt(id));

        if (productIndex === -1) {
            // Clean up uploaded file if product not found
            if (req.file) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            return res.status(404).json({ error: 'Product not found' });
        }

        // Validate required fields
        if (!updatedData.name || !updatedData.price) {
            // Clean up uploaded file if validation fails
            if (req.file) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            return res.status(400).json({ 
                error: 'Validation error',
                details: 'Name and price are required',
                receivedData: updatedData
            });
        }

        // Handle file upload if exists
        let imagePath = '';
        if (req.file) {
            imagePath = '/uploads/' + path.basename(req.file.path);
            console.log('New image uploaded:', imagePath);
        }

        // Store old image path for cleanup
        const oldImagePath = products[productIndex].image;
        const oldImageFullPath = oldImagePath && typeof oldImagePath === 'string' && !oldImagePath.startsWith('http') && oldImagePath !== ''
            ? path.join(process.cwd(), 'public', oldImagePath)
            : null;

        // Update the product
        const updatedProduct = {
            ...products[productIndex],
            ...updatedData,
            price: parseFloat(updatedData.price) || products[productIndex].price,
            stock: updatedData.stock ? parseInt(updatedData.stock) : products[productIndex].stock,
            image: imagePath || updatedData.image || products[productIndex].image || 'https://via.placeholder.com/300x200?text=No+Image',
            id: parseInt(id), // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        console.log('Updated product data:', updatedProduct);

        // Update the products array
        products[productIndex] = updatedProduct;

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(products, null, 2));

        // Delete old image if it was updated and not a placeholder
        if (oldImageFullPath && imagePath && oldImagePath !== imagePath) {
            try {
                // Check if file exists before trying to delete
                try {
                    await fs.access(oldImageFullPath);
                    console.log('Deleting old image:', oldImageFullPath);
                    await fs.unlink(oldImageFullPath);
                } catch (accessError) {
                    console.log('Old image file not found, skipping deletion:', oldImageFullPath);
                }
            } catch (error) {
                console.error('Error deleting old image:', error);
                // Don't fail the request if image deletion fails
            }
        }

        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct
        });

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

        // Read the current products data
        const dataPath = path.join(process.cwd(), 'data', 'products.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const products = JSON.parse(data);

        // Find the product to delete
        const productIndex = products.findIndex(p => p.id === parseInt(id));

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Store the product before deletion for response
        const deletedProduct = products[productIndex];

        // Remove the product's image file if it exists and is not a placeholder
        if (deletedProduct.image && !deletedProduct.image.startsWith('http')) {
            const imagePath = path.join(process.cwd(), 'public', deletedProduct.image);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('Error deleting product image:', error);
                // Continue with deletion even if image deletion fails
            }
        }

        // Remove the product from the array
        products.splice(productIndex, 1);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(products, null, 2));

        // Return success response
        res.status(200).json({
            message: 'Product deleted successfully',
            deletedProduct: deletedProduct
        });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}