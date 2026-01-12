const fs = require('fs');
const csv = require('csv-parser');
const IngestionService = require('../services/ingestionService');
// Optional: trigger detection immediately? For now, just ingest.

exports.uploadCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                // Validate headers roughly or rely on IngestionService to handle/fail
                if (results.length === 0) {
                    return res.status(400).json({ success: false, message: 'Empty CSV' });
                }

                // Call Ingestion Service
                const report = await IngestionService.ingestTransactions(results);

                // Log Action
                const LogService = require('../services/logService');
                await LogService.logAction(req, 'IMPORT_CSV', `Imported ${results.length} transactions from ${req.file.originalname}`);

                // remove file after processing
                fs.unlinkSync(filePath);

                res.json({
                    success: true,
                    message: 'CSV processed successfully',
                    data: report
                });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        })
        .on('error', (error) => {
            res.status(500).json({ success: false, message: 'Error parsing CSV: ' + error.message });
        });
};
