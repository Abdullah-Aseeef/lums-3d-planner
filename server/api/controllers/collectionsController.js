const { connect } = require('../config/db');
const { ObjectId } = require('mongodb');

function fetchCollection(name) {
  return async (req, res, next) => {
    const db = await connect();
    const data = await db.collection(name).find().toArray();
    res.json(data);
  };
}

function createDocument(name) {
  return async (req, res, next) => {
    const db = await connect();
    const result = await db.collection(name).insertOne(req.body);
    res.status(201).json({ id: result.insertedId });
  };
}

function getDocumentById(name) {
  return async (req, res, next) => {
    const db = await connect();
    const doc = await db.collection(name)
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  };
}

function updateDocument(name) {
  return async (req, res, next) => {
    const db = await connect();
    const result = await db.collection(name)
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    if (!result.matchedCount) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
  };
}

function deleteDocument(name) {
  return async (req, res, next) => {
    const db = await connect();
    const result = await db.collection(name)
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  };
}

module.exports = {
  fetchCollection,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
};