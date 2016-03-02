var assert = require('assert');
require('should');

var validator = require('../lib/validator');

function expectFailure(message, childName, childValue) {
  message.should.not.be.empty;
}

function expectSuccess() {
  throw new Error('fail');
}

describe('validator.isStringOrNull', function () {
  it('should pass strings',
    function () {
      validator.isStringOrNull().validate('', expectSuccess);
      validator.isStringOrNull().validate('asdfasdf', expectSuccess);
    });

  it('should test regex options',
    function () {
      validator.isStringOrNull({regex: /^[abc]+$/}).validate('', expectFailure);
      validator.isStringOrNull({regex: /^[\w\d\-_].*$/}).validate('', expectFailure);
      validator.isStringOrNull({regex: /^[\w\d\-_].*$/}).validate('asd', expectSuccess);
      validator.isStringOrNull({regex: /^[abc]+$/}).validate('a', expectSuccess);
      validator.isStringOrNull({regex: /^[abc]+$/}).validate('b', expectSuccess);
      validator.isStringOrNull({regex: /^[abc]+$/}).validate('c', expectSuccess);
      validator.isStringOrNull({regex: /^[abc]+$/}).validate('bca', expectSuccess);
      validator.isStringOrNull({regex: /^[abc]+$/}).validate('d', expectFailure);
      validator.isStringOrNull({regex: /^[abc]+$/}).validate('3', expectFailure);
    });

  it('should test fail regex match of empty child element',
    function (done) {
      var check = validator.isObject()
        .withRequired('test', validator.isStringOrNull({regex: /^[abc]+$/}));

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
    function (done) {
      validator.isStringOrNull().validate(true, expectFailure);
      validator.isStringOrNull().validate(0, expectFailure);
      validator.isStringOrNull().validate(1, expectFailure);
      validator.isStringOrNull().validate(123.5, expectFailure);
      validator.isStringOrNull().validate({}, expectFailure);
      validator.isStringOrNull().validate([], expectFailure);
      validator.isStringOrNull().validate(function () {}, expectFailure);
      done();
    });

  it('should pass null',
    function (done) {
      validator.isStringOrNull().validate(null, expectSuccess);
      done();
    });

});