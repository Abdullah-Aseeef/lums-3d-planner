const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/prayerController');

router.get('/', ctrl.getPrayerTimings);

module.exports = router;