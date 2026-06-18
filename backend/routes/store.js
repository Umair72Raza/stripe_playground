const express = require('express');
const { getIds, updateIds } = require('../store');

const router = express.Router();

router.get('/ids', (req, res) => {
  res.json(getIds());
});

router.patch('/ids', (req, res) => {
  res.json(updateIds(req.body));
});

module.exports = router;
