require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://LUMScape:diddyparty16!@lumscape.md59v.mongodb.net";

const client = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

async function connectToDb() {
  if (!db) {
    try {
      await client.connect();
      db = client.db('LUMScapeDB');
      console.log("Connected to MongoDB!");
    } catch (err) {
      console.error("Database connection error:", err);
      process.exit(1);
    }
  }
}

app.use(express.json());

async function fetchCollection(req, res, collectionName) {
  await connectToDb();
  try {
    const data = await db.collection(collectionName).find({}).toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createDocument(req, res, collectionName) {
  await connectToDb();
  try {
    const result = await db.collection(collectionName).insertOne(req.body);
    res.status(201).json({ message: "Document created", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getDocumentById(req, res, collectionName) {
  await connectToDb();
  try {
    const document = await db.collection(collectionName).findOne({ _id: new ObjectId(req.params.id) });
    document ? res.json(document) : res.status(404).json({ message: "Document not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateDocument(req, res, collectionName) {
  await connectToDb();
  try {
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    result.matchedCount
      ? res.json({ message: "Document updated" })
      : res.status(404).json({ message: "Document not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteDocument(req, res, collectionName) {
  await connectToDb();
  try {
    const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(req.params.id) });
    result.deletedCount
      ? res.json({ message: "Document deleted" })
      : res.status(404).json({ message: "Document not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// CRUD routes for all collections
['locations', 'eateries', 'events', 'offices', 'users'].forEach(collection => {
  app.get(`/${collection}`, (req, res) => fetchCollection(req, res, collection));
  app.post(`/${collection}`, (req, res) => createDocument(req, res, collection));
  app.get(`/${collection}/:id`, (req, res) => getDocumentById(req, res, collection));
  app.put(`/${collection}/:id`, (req, res) => updateDocument(req, res, collection));
  app.delete(`/${collection}/:id`, (req, res) => deleteDocument(req, res, collection));
});

// Signup route
app.post('/users/signup', async (req, res) => {
  await connectToDb();
  try {
    const { email, password, scope } = req.body;
    // console.log("Signup Request Body:", req.body);
    const encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');
    // console.log(encryptedPassword);

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const result = await db.collection('users').insertOne({ email, password: encryptedPassword, scope });
    res.status(201).json({ message: "User created", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route
app.post('/users/login', async (req, res) => {
  await connectToDb();
  try {
    const { email, password } = req.body;
    // console.log("Signup Request Body:", req.body);
    const encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');
    // console.log(encryptedPassword);


    const user = await db.collection('users').findOne({ email });
    if (user && user.password === encryptedPassword) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;