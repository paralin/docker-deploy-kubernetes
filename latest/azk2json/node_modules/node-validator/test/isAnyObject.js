var assert = require('assert');
require('should');

var validator = require('../lib/validator');

function expectFailure(message, childName, childValue) {
  message.should.not.be.empty;
}

function expectSuccess() {
  assert.fail();
}

describe('validator.isAnyObject', function () {
  it('should pass an object',
    function () {
      validator.isAnyObject().validate({}, expectSuccess);
    });

  it('should fail non-objects',
    function () {
      validator.isAnyObject().validate('asd', expectFailure);
      validator.isAnyObject().validate(null, expectFailure);
      validator.isAnyObject().validate(123.4, expectFailure);
      validator.isAnyObject().validate(true, expectFailure);
      validator.isAnyObject().validate(function () {}, expectFailure);
    });

  it('should pass with unexpected properties',
    function () {
      validator.isAnyObject().validate({test: true}, expectSuccess);
      validator.isAnyObject().validate({string: 'string'}, expectSuccess);
      validator.isAnyObject().validate({test: 123}, expectSuccess);
    });

  it('should validate optional properties, but not require them',
    function () {
      var v = validator.isAnyObject()
        .withOptional('test', validator.isNumber());
      v.validate({test: 123}, expectSuccess);
      v.validate({test: null}, expectSuccess);
      v.validate({test: undefined}, expectSuccess);
      v.validate({}, expectSuccess);
    });

  it('should validate require required properties',
    function () {
      var v = validator.isAnyObject()
        .withRequired('test', validator.isNumber());
      v.validate({test: 123}, expectSuccess);
      v.validate({test: null}, expectFailure);
      v.validate({test: undefined}, expectFailure);
      v.validate({}, expectFailure);
    });
});