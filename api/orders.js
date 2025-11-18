import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function ordersRouter(req, res) {
    const { id } = req.params;

    // Handle different HTTP methods
    if (req.method === 'GET') {
        if (id) {
            // Get single order
            await getOrder(req, res);
        } else {
            // Get all orders
            await getOrders(req, res);
        }
    } else if (req.method === 'POST') {
        // Add new order
        await addOrder(req, res);
    } else if (req.method === 'PUT') {
        // Update order
        await updateOrder(req, res);
    } else if (req.method === 'DELETE') {
        // Delete order
        await deleteOrder(req, res);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};

async function getOrders(req, res) {
    try {
        const dataPath = path.join(__dirname, '..', 'data', 'orders.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const orders = JSON.parse(data);

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error reading orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getOrder(req, res) {
    try {
        const { id } = req.params;
        const dataPath = path.join(__dirname, '..', 'data', 'orders.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const orders = JSON.parse(data);

        const order = orders.find(o => o.id === parseInt(id));

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Error reading order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function addOrder(req, res) {
    try {
        const newOrder = req.body;

        // Validate required fields
        if (!newOrder.customerName || !newOrder.customerEmail || !newOrder.items || !Array.isArray(newOrder.items)) {
            return res.status(400).json({ error: 'Customer name, email, and items are required' });
        }

        // Read current orders
        const dataPath = path.join(__dirname, '..', 'data', 'orders.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const orders = JSON.parse(data);

        // Generate new ID
        const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;

        // Calculate total
        const total = newOrder.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        // Create new order
        const order = {
            id: newId,
            customerName: newOrder.customerName,
            customerEmail: newOrder.customerEmail,
            items: newOrder.items,
            total: total,
            status: newOrder.status || 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add to orders array
        orders.push(order);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(orders, null, 2));

        res.status(201).json({
            message: 'Order created successfully',
            order: order
        });

    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateOrder(req, res) {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Read current orders
        const dataPath = path.join(__dirname, '..', 'data', 'orders.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const orders = JSON.parse(data);

        // Find the order to update
        const orderIndex = orders.findIndex(o => o.id === parseInt(id));

        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update the order
        orders[orderIndex] = {
            ...orders[orderIndex],
            ...updatedData,
            id: parseInt(id), // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(orders, null, 2));

        res.status(200).json({
            message: 'Order updated successfully',
            order: orders[orderIndex]
        });

    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function deleteOrder(req, res) {
    try {
        const { id } = req.params;

        // Read the current orders data
        const dataPath = path.join(__dirname, '..', 'data', 'orders.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const orders = JSON.parse(data);

        // Find the order to delete
        const orderIndex = orders.findIndex(o => o.id === parseInt(id));

        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Store the order before deletion for response
        const deletedOrder = orders[orderIndex];

        // Remove the order from the array
        orders.splice(orderIndex, 1);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(orders, null, 2));

        // Return success response
        res.status(200).json({
            message: 'Order deleted successfully',
            deletedOrder: deletedOrder
        });

    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}