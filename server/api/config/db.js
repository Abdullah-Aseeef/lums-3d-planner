const { MongoClient } = require('mongodb');
const { mongoUri } = require('./index');

const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;
async function connect() {
  if (!db) {
    console.log('🔗 Connecting to Mongo at', mongoUri);
    await client.connect();
    db = client.db('LUMScapeDB');
    console.log('✅ MongoDB connected');
  }
  return db;
}


module.exports = { connect };