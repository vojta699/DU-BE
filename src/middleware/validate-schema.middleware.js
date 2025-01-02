const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, useDefaults: true });

const validateSchema = (schema) => {
  const validate = ajv.compile(schema);

  return (req, res, next) => {
    const valid = validate(req.body);

    if (!valid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input data",
        errors: validate.errors,
      });
    }

    next();
  };
};

module.exports = validateSchema;