require('dotenv').config();
const cron = require('node-cron');
const { runCleanup } = require('../scripts/cleanupOrphanedFiles');

// Schedule cleanup to run every Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
    console.log('Running scheduled cleanup of orphaned files...');
    try {
        await runCleanup();
        console.log('Scheduled cleanup completed successfully');
    } catch (error) {
        console.error('Error during scheduled cleanup:', error);
    }
}, {
    timezone: 'America/New_York' // Update this to your timezone
});

console.log('Scheduled cleanup job started. Will run every Sunday at 2 AM.');

// Keep the process running
process.stdin.resume();
