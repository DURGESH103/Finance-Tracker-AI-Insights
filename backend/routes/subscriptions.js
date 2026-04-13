const router = require('express').Router();
const { getAll, detect, create, update, remove } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/detect', detect);
router.route('/').get(getAll).post(create);
router.route('/:id').put(update).delete(remove);

module.exports = router;
