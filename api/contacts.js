import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function contactsRouter(req, res) {
    const { id } = req.params;

    // Handle different HTTP methods
    if (req.method === 'GET') {
        if (id) {
            // Get single contact
            await getContact(req, res);
        } else {
            // Get all contacts
            await getContacts(req, res);
        }
    } else if (req.method === 'POST') {
        // Add new contact
        await addContact(req, res);
    } else if (req.method === 'DELETE') {
        // Delete contact
        await deleteContact(req, res);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};

async function getContacts(req, res) {
    try {
        const dataPath = path.join(__dirname, '..', 'data', 'contacts.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const contacts = JSON.parse(data);

        res.status(200).json(contacts);
    } catch (error) {
        console.error('Error reading contacts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getContact(req, res) {
    try {
        const { id } = req.params;
        const dataPath = path.join(__dirname, '..', 'data', 'contacts.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const contacts = JSON.parse(data);

        const contact = contacts.find(c => c.id === parseInt(id));

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.status(200).json(contact);
    } catch (error) {
        console.error('Error reading contact:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function addContact(req, res) {
    try {
        const newContact = req.body;

        // Validate required fields
        if (!newContact.name || !newContact.email || !newContact.message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        // Read current contacts
        const dataPath = path.join(__dirname, '..', 'data', 'contacts.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const contacts = JSON.parse(data);

        // Generate new ID
        const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;

        // Create new contact
        const contact = {
            id: newId,
            name: newContact.name,
            email: newContact.email,
            message: newContact.message,
            createdAt: new Date().toISOString()
        };

        // Add to contacts array
        contacts.push(contact);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(contacts, null, 2));

        res.status(201).json({
            message: 'Contact submitted successfully',
            contact: contact
        });

    } catch (error) {
        console.error('Error adding contact:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function deleteContact(req, res) {
    try {
        const { id } = req.params;

        // Read the current contacts data
        const dataPath = path.join(__dirname, '..', 'data', 'contacts.json');
        const data = await fs.readFile(dataPath, 'utf8');
        const contacts = JSON.parse(data);

        // Find the contact to delete
        const contactIndex = contacts.findIndex(c => c.id === parseInt(id));

        if (contactIndex === -1) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        // Store the contact before deletion for response
        const deletedContact = contacts[contactIndex];

        // Remove the contact from the array
        contacts.splice(contactIndex, 1);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(contacts, null, 2));

        // Return success response
        res.status(200).json({
            message: 'Contact deleted successfully',
            deletedContact: deletedContact
        });

    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}