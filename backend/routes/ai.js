const router = require('express').Router();
const { getInsights, refreshInsights, getPrediction, chat, markRead } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getInsights);
router.post('/refresh', refreshInsights);
router.get('/predict', getPrediction);
router.post('/chat', chat);
router.put('/read', markRead);

module.exports = router;
