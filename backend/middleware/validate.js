const logger = require('../utils/logger');

/**
 * validate(schema) — middleware factory
 * Validates req.body against a Joi schema.
 * On success, replaces req.body with the validated (coerced) value.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    logger.warn('Validation failed', { path: req.path, details });
    return res.status(422).json({ success: false, message: 'Validation failed', errors: details });
  }

  req.body = value;
  next();
};

module.exports = validate;
