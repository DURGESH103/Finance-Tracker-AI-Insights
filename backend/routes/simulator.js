const router = require('express').Router();
const { simulate } = require('../controllers/simulatorController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.use(protect);
router.post('/', validate(schemas.simulate), simulate);

module.exports = router;
