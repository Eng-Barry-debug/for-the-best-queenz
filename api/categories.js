import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function categoriesRouter(req, res) {
    const { id } = req.params;

    // Handle different HTTP methods
    if (req.method === 'GET') {
        if (id) {
            // Get single category
            await getCategory(req, res);
        } else {
            // Get all categories
            await getCategories(req, res);
        }
    } else if (req.method === 'POST') {
        // Add new category
        await addCategory(req, res);
    } else if (req.method === 'PUT') {
        // Update category
        await updateCategory(req, res);
    } else if (req.method === 'DELETE') {
        // Delete category
        await deleteCategory(req, res);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};

async function getCategories(req, res) {
    try {
        const dataPath = path.join(__dirname, '..', 'data', 'categories.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const categories = JSON.parse(data);

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error reading categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getCategory(req, res) {
    try {
        const { id } = req.params;
        const dataPath = path.join(__dirname, '..', 'data', 'categories.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const categories = JSON.parse(data);

        const category = categories.find(c => c.id === parseInt(id));

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error('Error reading category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function addCategory(req, res) {
    try {
        const newCategory = req.body;

        // Validate required fields
        if (!newCategory.name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Read current categories
        const dataPath = path.join(__dirname, '..', 'data', 'categories.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const categories = JSON.parse(data);

        // Generate new ID
        const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;

        // Create new category
        const category = {
            id: newId,
            name: newCategory.name,
            slug: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
            description: newCategory.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add to categories array
        categories.push(category);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(categories, null, 2));

        res.status(201).json({
            message: 'Category added successfully',
            category: category
        });

    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Read current categories
        const dataPath = path.join(__dirname, '..', 'data', 'categories.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const categories = JSON.parse(data);

        // Find the category to update
        const categoryIndex = categories.findIndex(c => c.id === parseInt(id));

        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Validate required fields
        if (!updatedData.name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Update the category
        categories[categoryIndex] = {
            ...categories[categoryIndex],
            ...updatedData,
            id: parseInt(id), // Ensure ID doesn't change
            slug: updatedData.name.toLowerCase().replace(/\s+/g, '-'),
            updatedAt: new Date().toISOString()
        };

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(categories, null, 2));

        res.status(200).json({
            message: 'Category updated successfully',
            category: categories[categoryIndex]
        });

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function deleteCategory(req, res) {
    try {
        const { id } = req.params;

        // Read the current categories data
        const dataPath = path.join(__dirname, '..', 'data', 'categories.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const categories = JSON.parse(data);

        // Find the category to delete
        const categoryIndex = categories.findIndex(c => c.id === parseInt(id));

        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Store the category before deletion for response
        const deletedCategory = categories[categoryIndex];

        // Remove the category from the array
        categories.splice(categoryIndex, 1);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(categories, null, 2));

        // Return success response
        res.status(200).json({
            message: 'Category deleted successfully',
            deletedCategory: deletedCategory
        });

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}