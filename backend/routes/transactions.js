const router = require('express').Router();
const { create, getAll, getOne, update, remove, getAnalytics, getNetWorth } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.use(protect);
router.get('/analytics', getAnalytics);
router.get('/net-worth', getNetWorth);
router.route('/').get(getAll).post(validate(schemas.createTransaction), create);
router.route('/:id').get(getOne).put(validate(schemas.updateTransaction), update).delete(remove);

module.exports = router;
