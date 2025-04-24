// Loads & exports all config
module.exports = {
    // port: process.env.PORT || 10000,
    mongoUri: process.env.MONGO_URI,
    prayerSourceUrl: process.env.PRAYER_SOURCE_URL,
    latitude: +process.env.LATITUDE,
    longitude: +process.env.LONGITUDE,
  };