const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
    // Only allow PUT requests
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Read the current products data
        const dataPath = path.join(process.cwd(), 'data', 'products.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const products = JSON.parse(data);

        // Find the product to update
        const productIndex = products.findIndex(p => p.id === parseInt(id));

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get updated data from request body
        const updatedProduct = req.body;

        // Validate required fields
        if (!updatedProduct.name || !updatedProduct.price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Update the product (keep the ID)
        products[productIndex] = {
            ...products[productIndex],
            ...updatedProduct,
            id: parseInt(id), // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(products, null, 2));

        // Return the updated product
        res.status(200).json({
            message: 'Product updated successfully',
            product: products[productIndex]
        });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};