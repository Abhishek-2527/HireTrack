const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    return res.status(400).json({
      success: false,
      message: validationErrors[0].msg,
      errors: validationErrors.map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  return next();
};

module.exports = validateRequest;
