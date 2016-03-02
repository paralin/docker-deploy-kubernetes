var util = require('util');
var ExtendableError = require('es6-error');

/**
 * `ValidationError` error.
 *
 * @api public
 */
function ValidationError(details) {
  this.name = 'ValidationError';
  this.message = 'Validation failed';
  this.details = details;

  ExtendableError.call(this, this.message);
}

/**
 * Inherit from `ExtendableError`.
 */
util.inherits(ValidationError, ExtendableError);

/**
 * Expose `ValidationError`.
 */
module.exports = ValidationError;
