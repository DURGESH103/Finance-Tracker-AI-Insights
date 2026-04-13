const router = require('express').Router();
const { getAll, create, contribute, update, remove } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.use(protect);
router.route('/').get(getAll).post(validate(schemas.createGoal), create);
router.post('/:id/contribute', validate(schemas.contributeGoal), contribute);
router.route('/:id').put(update).delete(remove);

module.exports = router;
