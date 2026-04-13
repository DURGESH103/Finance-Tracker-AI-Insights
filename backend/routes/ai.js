const router = require('express').Router();
const {
  getInsights, refreshInsights, getPrediction, chat, markRead,
  getHealthScore, getSpendingPatterns, getGamification, getPortfolioIntelligence,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.use(protect);
router.get('/', getInsights);
router.post('/refresh', refreshInsights);
router.get('/predict', getPrediction);
router.post('/chat', validate(schemas.chat), chat);
router.put('/read', markRead);
router.get('/health-score', getHealthScore);
router.get('/patterns', getSpendingPatterns);
router.get('/gamification', getGamification);
router.get('/portfolio-intelligence', getPortfolioIntelligence);

module.exports = router;
