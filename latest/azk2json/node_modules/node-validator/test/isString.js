var assert = require('assert');
require('should');

var validator = require('../lib/validator');

function expectFailure(message, childName, childValue) {
  message.should.not.be.empty;
}

function expectSuccess() {
  throw new Error('fail');
}

describe('validator.isString', function () {
  it('should pass strings',
    function () {
      validator.isString().validate('', expectSuccess);
      validator.isString().validate('asdfasdf', expectSuccess);
    });

  it('should test regex options',
    function () {
      validator.isString({regex: /^[abc]+$/}).validate('', expectFailure);
      validator.isString({regex: /^[\w\d\-_].*$/}).validate('', expectFailure);
      validator.isString({regex: /^[\w\d\-_].*$/}).validate('asd', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('a', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('b', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('c', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('bca', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('d', expectFailure);
      validator.isString({regex: /^[abc]+$/}).validate('3', expectFailure);
    });

  it('should test fail regex match of empty child element',
    function (done) {
      var check = validator.isObject()
        .withRequired('test', validator.isString({regex: /^[abc]+$/}));

      var toValidate = {test:''};
      check.validate(toValidate, expectFailure);

      validator.run(check, toValidate, function(errorCount, errors) {
        errorCount.should.equal(1);
        errors.should.have.length(1);
        errors[0].message.should.equal('Invalid value. Value must match required pattern.');
        errors[0].parameter.should.equal('test');
        errors[0].value.should.equal('');
        done();
      });
    });

  it('should fail non-strings',
    function () {
      validator.isString().validate(true, expectFailure);
      validator.isString().validate(null, expectFailure);
      validator.isString().validate(0, expectFailure);
      validator.isString().validate(1, expectFailure);
      validator.isString().validate(123.5, expectFailure);
      validator.isString().validate({}, expectFailure);
      validator.isString().validate([], expectFailure);
      validator.isString().validate(function () {}, expectFailure);
    });

});