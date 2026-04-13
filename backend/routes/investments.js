const router = require('express').Router();
const { getAll, create, update, remove, getIntelligence } = require('../controllers/investmentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.use(protect);
router.get('/intelligence', getIntelligence);
router.route('/').get(getAll).post(validate(schemas.createInvestment), create);
router.route('/:id').put(validate(schemas.updateInvestment), update).delete(remove);

module.exports = router;
