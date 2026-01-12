const { getSession } = require('../config/db');

class IngestionService {
    static async ingestTransactions(transactions) {
        const session = getSession();
        const results = {
            processed: 0,
            errors: 0,
            errorDetails: []
        };

        try {
            // Create constraints (idempotent) - run once
            await session.run('CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT account_id IF NOT EXISTS FOR (a:Account) REQUIRE a.accountId IS UNIQUE');
            await session.run('CREATE CONSTRAINT tx_id IF NOT EXISTS FOR (t:Transaction) REQUIRE t.txId IS UNIQUE');

            // Using UNWIND for batch processing is better, but let's process in chunks or logical units
            // For simplicity and error tracking, let's process one by one or small batches. 
            // Given the requirement for "Upload files CSV", assume moderate size. 
            // We will do a robust single query per transaction to ensure all nodes and links are created.

            for (const tx of transactions) {
                const query = `
          MERGE (u:User {username: $userName, role: 'CLIENT'})
          ON CREATE SET u.id = randomUUID(), u.createdAt = datetime()
          
          MERGE (a:Account {accountId: $accountId})
          ON CREATE SET a.owner = $userName
          
          MERGE (u)-[:OWNS]->(a)
          
          MERGE (m:Merchant {merchantId: $merchantId})
          ON CREATE SET m.name = $merchantName
          
          MERGE (d:Device {deviceId: $deviceId})
          
          MERGE (ip:IP {ipAddress: $ipAddress})
          
          MERGE (t:Transaction {txId: $txId})
          ON CREATE SET 
            t.amount = toFloat($amount),
            t.currency = $currency,
            t.date = datetime($date),
            t.status = $status,
            t.processedAt = datetime()
            
          MERGE (a)-[:PERFORMED]->(t)
          MERGE (t)-[:TO_MERCHANT]->(m)
          MERGE (t)-[:FROM_DEVICE]->(d)
          MERGE (t)-[:FROM_IP]->(ip)
        `;

                try {
                    // Date format validation or transformation might be needed if ISO string
                    await session.run(query, {
                        userName: tx.userName || 'Unknown',
                        accountId: tx.accountId,
                        merchantId: tx.merchantId,
                        merchantName: tx.merchantName || 'Unknown',
                        deviceId: tx.deviceId,
                        ipAddress: tx.ipAddress,
                        txId: tx.txId,
                        amount: tx.amount,
                        currency: tx.currency,
                        date: tx.date, // ensure ISO 8601 format in CSV
                        status: tx.status
                    });
                    results.processed++;
                } catch (err) {
                    console.error(`Error processing TX ${tx.txId}:`, err);
                    results.errors++;
                    results.errorDetails.push({ txId: tx.txId, error: err.message });
                }
            }
        } finally {
            await session.close();
        }

        return results;
    }
}

module.exports = IngestionService;
