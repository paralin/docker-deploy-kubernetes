var should = require('should');

var validator = require('../lib/validator');

function validateAXorB(value, onError) {
  if (value.a !== undefined && value.b !== undefined) {
    onError('both a and b may not exist for the same object', 'a|b', null)
  }
}

var testChild = validator.isObject()
  .withRequired('test', validator.isString({ regex: /\w+/ }));

var testParent = validator.isObject()
  .withRequired('_id', validator.isString({ regex: /[abc]+/ }))
  .withOptional('date', validator.isIsoDate())
  .withRequired('child', testChild)
  .withOptional('a', validator.isArray(testChild, {min: 1}));

var testArrayItem = validator.isObject()
  .withCustom(validateAXorB)
  .withOptional('a', validator.isString())
  .withOptional('b', validator.isString());

var testArray = validator.isArray(testArrayItem);

function expectFailure(err, details) {
  err.should.be.not.eql(0);
}

function expectSuccess(err, details) {
  err.should.be.eql(0);
}

describe('validator', function () {
  it('should require item to be an object ',
    function (done) {
      validator.run(testParent, 'test', expectFailure);
      done();
    });

  it('should be invalid as missing required properties',
    function (done) {
      validator.run(testParent, { 'test': '1' }, expectFailure);
      done();
    });

  it('should be invalid as missing required properties including child object',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'date': '2013-10-15' }, expectFailure);
      done();
    });

  it('should also be invalid as missing required properties including child object',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'date': '2013-10-15T12:43:21' }, expectFailure);
      done();
    });

  it('should be invalid as missing child property test',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'child': '2013-10-15' }, expectFailure);
      done();
    });

  it('should also be invalid as missing child property test',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'child': { "blah": "foo" } }, expectFailure);
      done();
    });

  it('should be valid as contains child property test',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'child': { "test": "bar" } }, expectSuccess);
      done();
    });

  it('should be invalid as optional "a" property is an empty array',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'child': { "test": "bar" }, "a": [] }, expectFailure);
      done();
    });

  it('should be invalid as property "a" is an array that contains an object without property test',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'child': { "test": "bar" }, "a": [
        { "foo": "bar" }
      ] }, expectFailure);

      done();
    });

  it('should be valid as optional property "a" is an array that does contain an object with property test',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'child': { "test": "bar" }, "a": [
        { "test": "bar" }
      ] }, expectSuccess);

      done();
    });

  it('should be invalid as optional property "a" is an array that contain an object with property test ' +
    'but does not meet string regex validation',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'child': { "test": "bar" }, "a": [
        { "test": "<>." }
      ] }, expectFailure);

      done();
    });

  it('should be invalid as property "a" is an array that contains an object with property test ' +
    'but "a" array also contains an object without property test',
    function (done) {
      validator.run(testParent, { '_id': 'aac', 'child': { "test": "bar" }, "a": [
        { "test": "bar" },
        { "foo": "bar" }
      ] }, expectFailure);

      done();
    });

  it('should be valid array of numbers',
    function (done) {
      validator.run(validator.isArray(validator.isNumber()), [1, 2, 3], expectSuccess);
      done();
    });

  it('should be valid array of numbers that meets min and max',
    function (done) {
      validator.run(validator.isArray(validator.isNumber({min: 1, max: 3})), [1, 2, 3], expectSuccess);
      done();
    });

  it('should be invalid array of numbers as does not meets min and max',
    function (done) {
      validator.run(validator.isArray(validator.isNumber({min: 2, max: 3})), [1, 2, 3], expectFailure);
      done();
    });

  it('should be valid array of strings',
    function (done) {
      validator.run(validator.isArray(validator.isString()), ["1", "2", "3"], expectSuccess);
      done();
    });

  it('should be invalid array of strings as contains a number',
    function (done) {
      validator.run(validator.isArray(validator.isString()), ["1", "2", 3], expectFailure);
      done();
    });
});

describe('custom Xor validator', function () {
  it('should require "a" to be a string',
    function (done) {

      validator.run(testArray, [
        { 'a': [ { z: 1 } ] }
      ], expectFailure);

      done();
    });

  it('should require "b" to be a string',
    function (done) {

      validator.run(testArray, [
        { 'b': 17 }
      ], expectFailure);

      done();
    });

  it('should not allow both "a" and "b" to be present',
    function (done) {
      validator.run(testArray, [
        { 'a': "hello", 'b': 'world' }
      ], expectFailure);

      done();
    });

  it('should not allow unexpected fields',
    function (done) {
      validator.run(testArray, [
        { 'a': "hello", 'c': '!' }
      ], expectFailure);

      done();
    });

  it('should be valid as there is only "a"',
    function (done) {
      validator.run(testArray, [
        { 'a': "hello" }
      ], expectSuccess);

      done();
    });

  it('should be valid as there is only "b"',
    function (done) {
      validator.run(testArray, [
        { 'b': "world" }
      ], expectSuccess);

      done();
    });
});

describe('example1', function () {
  it('should fail',
    function (done) {

      var checkChild = validator.isObject()
        .withRequired('prop', validator.isString({ regex: /^[abc]+$/ }));

      var check = validator.isObject()
        .withRequired('_id', validator.isString({ regex: /^[abc]+$/ }))
        .withOptional('date', validator.isIsoDate())
        .withOptional('children', validator.isArray(checkChild, {min: 1}));

      var toValidate = {
        "_id": 'abababa',
        "date": '2013-10-24',
        "children": [{
          "prop": ''
        }]
      };

      validator.run(check, toValidate, function(errorCount, errors) {
        errorCount.should.equal(1);
        errors.should.have.length(1);
        errors[0].message.should.equal('Invalid value. Value must match required pattern.');
        errors[0].parameter.should.equal('children[0].prop');
        errors[0].value.should.equal('');
        done();
      });
    });
});

describe('readme example', function () {
  it('should fail',
    function (done) {

      var checkChild = validator.isObject()
        .withRequired('prop', validator.isString({ regex: /^[abc]+$/ }));

      var check = validator.isObject()
        .withRequired('_id', validator.isString({ regex: /^[abc]+$/ }))
        .withOptional('date', validator.isIsoDate())
        .withOptional('children', validator.isArray(checkChild, {min: 1}));

      var toValidate = {
        "_id": 'abababa',
        "date": '2013-10-24',
        "children": [{
          "prop": 'zxzx'
        }]
      };

      validator.run(check, toValidate, function(errorCount, errors) {
        errorCount.should.equal(1);
        errors.should.have.length(1);
        errors[0].message.should.equal('Invalid value. Value must match required pattern.');
        errors[0].parameter.should.equal('children[0].prop');
        errors[0].value.should.equal('zxzx');
        done();
      });
    });
});

