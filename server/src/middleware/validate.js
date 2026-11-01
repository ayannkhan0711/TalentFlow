const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results and returns 400 if any fail.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      details: errors.array().map((e) => e.msg),
    });
  }
  next();
};

module.exports = validate;
