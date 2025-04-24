const { connect } = require('../config/db');
const { hashPassword } = require('../utils/hash');

exports.signup = async (req, res, next) => {
  const db = await connect();
  const { email, password, scope } = req.body;
  const encrypted = hashPassword(password);
  const exists = await db.collection('users').findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email exists' });
  const result = await db.collection('users')
    .insertOne({ email, password: encrypted, scope });
  res.status(201).json({ id: result.insertedId });
};

exports.login = async (req, res, next) => {
  const db = await connect();
  const { email, password } = req.body;
  const encrypted = hashPassword(password);
  const user = await db.collection('users').findOne({ email });
  if (user && user.password === encrypted) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Invalid creds' });
};