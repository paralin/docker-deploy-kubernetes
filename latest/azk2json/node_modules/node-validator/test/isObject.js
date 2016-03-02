var assert = require('assert');
require('should');

var validator = require('../lib/validator');

function expectFailure(message, childName, childValue) {
  message.should.not.be.empty;
}

function expectSuccess() {
  throw new Error('fail');
}

describe('validator.isObject', function () {
  it('should pass an object',
    function () {
      validator.isObject().validate({}, expectSuccess);
    });

  it('should fail non-objects',
    function () {
      validator.isObject().validate('asd', expectFailure);
      validator.isObject().validate(null, expectFailure);
      validator.isObject().validate(123.4, expectFailure);
      validator.isObject().validate(true, expectFailure);
      validator.isObject().validate(function () {}, expectFailure);
    });

  it('should fail with unexpected properties',
    function () {
      validator.isObject().validate({test: 123}, expectFailure);
    });

  it('should allow optional properties, but not require them',
    function () {
      var v = validator.isObject()
        .withOptional('test');
      v.validate({test: 123}, expectSuccess);
      v.validate({test: null}, expectSuccess);
      v.validate({test: undefined}, expectSuccess);
      v.validate({}, expectSuccess);
    });

  it('should allow require required properties',
    function () {
      var v = validator.isObject()
        .withRequired('test');
      v.validate({test: 123}, expectSuccess);
      v.validate({test: null}, expectFailure);
      v.validate({test: undefined}, expectFailure);
      v.validate({}, expectFailure);
    });

  it('should fail child property with string int when expecting int',
    function () {
      var v = validator.isObject()
        .withOptional('test', validator.isInteger());
      v.validate({test: 123}, expectSuccess);
      v.validate({test: '123'}, expectFailure);
      v.validate({test: undefined}, expectSuccess);
      v.validate({}, expectSuccess);
    });

  it('should validate children',
    function () {
      // TODO: put stuff here
    });

});