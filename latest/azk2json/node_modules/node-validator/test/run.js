var should = require('should');

var validator = require('../lib/validator');

describe('validator.run', function () {
  it('should call the callback on pass',
    function (done) {
      var count = 0;

      function callback(errorCount) {
        count++;
        errorCount.should.be.equal(0);
      }

      validator.run({validate: function () {}}, null, callback);
      count.should.be.equal(1);
      done();
    });

  it('should call the callback on failure',
    function (done) {
      var count = 0;

      function callback(errorCount) {
        count++;
        errorCount.should.be.equal(1);
      }

      validator.run({validate: function (value, onError) { onError(); }}, null, callback);
      count.should.be.equal(1);
      done();
    });

  it('should return multiple errors',
    function (done) {
      var count = 0;

      function callback(errorCount, errorList) {
        count++;
        errorCount.should.be.equal(2);
        errorList.should.be.have.length(2);

        errorList[0].should.be.type('object');
        errorList[0].should.have.property('message', 'error1');
        errorList[0].should.have.property('parameter', 'a');
        errorList[0].should.have.property('value', 'test');

        errorList[1].should.be.type('object');
        errorList[1].should.have.property('message', 'error2');
        errorList[1].should.have.property('parameter', 'b');
        errorList[1].should.have.property('value', 123);
      }

      function validate(value, onError) {
        onError('error1', 'a', 'test');
        onError('error2', 'b', 123);
      }

      validator.run({validate: validate}, null, callback);
      count.should.be.equal(1);
      done();
    });
});