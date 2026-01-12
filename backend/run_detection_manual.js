const DetectionService = require('./src/services/detectionService');
const { getSession } = require('./src/config/db');

async function runManualDetection() {
    console.log("Starting Manual Detection Run...");
    try {
        const stats = await DetectionService.runDetection();
        console.log("Detection Complete.");
        console.log("Stats:", JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error("FATAL Detection Error:", err);
    } finally {
        // give it a moment to finish pending logs or driver closes
        setTimeout(() => process.exit(0), 1000);
    }
}

runManualDetection();
