const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const newProduct = req.body;

        // Validate required fields
        if (!newProduct.name || !newProduct.price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        // Read current products
        const dataPath = path.join(process.cwd(), 'data', 'products.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const products = JSON.parse(data);

        // Generate new ID
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

        // Create new product
        const product = {
            id: newId,
            name: newProduct.name,
            category: newProduct.category || '',
            price: parseFloat(newProduct.price),
            description: newProduct.description || '',
            image: newProduct.image || 'https://via.placeholder.com/300x200?text=No+Image',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

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
        res.status(500).json({ error: 'Internal server error' });
    }
};