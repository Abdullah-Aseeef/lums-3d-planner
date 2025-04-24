const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/usersController');

router.post('/signup', ctrl.signup);
router.post('/login',  ctrl.login);

module.exports = router;