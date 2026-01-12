const neo4j = require('neo4j-driver');
require('dotenv').config();

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE } = process.env;

let driver;

try {
  driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  );
  console.log('Neo4j Driver initialized');
} catch (error) {
  console.error('Error initializing Neo4j driver:', error);
}

const getSession = () => {
  // Use the database defined in .env, or default to 'neo4j' (standard default) or undefined (driver default)
  const dbName = NEO4J_DATABASE || 'neo4j';
  return driver.session({ database: dbName });
};

const closeDriver = async () => {
  if (driver) {
    await driver.close();
    console.log('Neo4j Driver closed');
  }
};

const verifyConnection = async () => {
  try {
    await driver.verifyConnectivity();
    console.log(`Connected to Neo4j successfully (Target DB: ${NEO4J_DATABASE || 'default'})`);
  } catch (error) {
    console.error('Failed to connect to Neo4j:', error);
    process.exit(1);
  }
};

module.exports = {
  driver,
  getSession,
  closeDriver,
  verifyConnection
};
