const router = require('express').Router();
const { create, getAll, update, remove } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getAll).post(create);
router.route('/:id').put(update).delete(remove);

module.exports = router;
