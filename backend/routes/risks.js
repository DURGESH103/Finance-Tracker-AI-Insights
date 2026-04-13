const router = require('express').Router();
const { getRisks } = require('../controllers/riskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getRisks);

module.exports = router;
