const { connect } = require('../config/db');
const { getTimings } = require('../services/prayerService');

exports.getPrayerTimings = async (req, res, next) => {
  const db = await connect();
  const coll = db.collection('prayerTimings');

  const latest = await coll.findOne({}, { sort: { updatedAt: -1 } });
  const now = Date.now();
  if (latest && now - latest.updatedAt < 86400000) {
    return res.json(latest.timings);
  }

  const timings = await getTimings();
  await coll.deleteMany({});
  await coll.insertOne({ timings, updatedAt: now });
  res.json(timings);
};