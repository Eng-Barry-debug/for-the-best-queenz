const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
    // Only allow DELETE requests
    if (req.method !== 'DELETE') {
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

        // Find the product to delete
        const productIndex = products.findIndex(p => p.id === parseInt(id));

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Store the product before deletion for response
        const deletedProduct = products[productIndex];

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
};