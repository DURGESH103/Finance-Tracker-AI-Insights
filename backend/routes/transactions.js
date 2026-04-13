const router = require('express').Router();
const { create, getAll, getOne, update, remove, getAnalytics } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/analytics', getAnalytics);
router.route('/').get(getAll).post(create);
router.route('/:id').get(getOne).put(update).delete(remove);

module.exports = router;
