const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

async function initData() {
    try {
        // Create data directory if it doesn't exist
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize empty JSON files if they don't exist
        const files = [
            { path: PRODUCTS_FILE, default: [] },
            { path: CATEGORIES_FILE, default: [] },
            { path: ORDERS_FILE, default: [] },
            { path: CONTACTS_FILE, default: [] }
        ];

        for (const file of files) {
            try {
                await fs.access(file.path);
            } catch (e) {
                await fs.writeFile(file.path, JSON.stringify(file.default, null, 2));
                console.log(`Created ${path.basename(file.path)}`);
            }
        }

        console.log('Data initialization complete');
    } catch (error) {
        console.error('Error initializing data:', error);
        process.exit(1);
    }
}

// Run the initialization
initData();
