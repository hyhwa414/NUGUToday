const express = require('express');
const nugu = require('../nugu');
const router = express.Router();

router.post(`/nugu/answer.history`, nugu);

module.exports = router;
