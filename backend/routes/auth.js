const router = require('express').Router();
const { register, login, refreshToken, logout, googleAuth, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.post('/register', validate(schemas.register), register);
router.post('/login',    validate(schemas.login),    login);
router.post('/refresh',  refreshToken);
router.post('/google',   googleAuth);
router.post('/logout',   logout);       // no protect — token may be expired
router.get('/me',        protect, getMe);

module.exports = router;
