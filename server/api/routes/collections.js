const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/collectionsController');

const collections = ['locations', 'eateries', 'events', 'offices', 'users'];

collections.forEach(name => {
  router.get(`/${name}`,      ctrl.fetchCollection(name));
  router.post(`/${name}`,     ctrl.createDocument(name));
  router.get(`/${name}/:id`,  ctrl.getDocumentById(name));
  router.put(`/${name}/:id`,  ctrl.updateDocument(name));
  router.delete(`/${name}/:id`, ctrl.deleteDocument(name));
});

module.exports = router;