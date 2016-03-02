# node-validator

_node-validator_ is a simple, extensible object property validator for node.js

It includes direct support for express.js, and can be used as express middleware to automatically validating request body content.

Now also supports koa.js as middleware.

## Example
```javascript
var validator = require('node-validator');

var checkChild = validator.isObject()
  .withRequired('prop', validator.isString({ regex: /^[abc]+$/ }));

var check = validator.isObject()
  .withRequired('_id', validator.isString({ regex: /^[abc]+$/ }))
  .withOptional('date', validator.isIsoDate())
  .withOptional('children', validator.isArray(checkChild, {min: 1}));

var toValidate = {
  _id: 'abababa',
  date: '2013-10-24',
  children: [{
    prop: 'zxzx'
  }]
};

validator.run(check, toValidate, function(errorCount, errors) {
  // will return:
  // errorCount=1
  // errors=[{"parameter":"children[0].prop","value":"zxzx","message":"Invalid value. Value must match required pattern."}]
});
```

Or using express.js

```javascript
app.post('/', [validator.express(check), function(req, res) {
  // ...
}
```

Or using koa.js (use either `koaBody()`, `koaQuery` or `koaParams`)

```javascript
route.post('/', validator.koaBody(check), otherFunction);
```

If the body content does not pass the given validation check, the validator will return.

```
400 Bad Request

{
    "errors": [
        {
            "parameter": "children[0].prop",
            "value": "zxzx",
            "message": "Invalid value. Value must match required pattern."
        }
    ]
}
```

## Installation

    $ npm install node-validator

## Included Validators

Following are the build-in validators. You may also use your own, see section below.

### isObject

Used to validate that the item under test is an object, and to check it's properties. This is often the root validator.

Property requirements are chained to the `isObject` validator.

```javascript
var check = validator.isObject()
  .withRequired('requiredProperty', propertyValidator1)
  .withOptional('optionalProperty', propertyValidator2);
```

If any properties are present in the object under test that are not listed, this will fail the validation.

The property validators may be any other validator, including `isObject`, or may omitted to allow any value.

### isAnyObject

Similar to `isObject`, however does not fail for unexpected properties.

### isString

Makes sure the item is of type string, also can check the value against a regular expression.

```javascript
var check = validator.isString();
```
or
```javascript
var check = validator.isString({regex: /[0-9A-Fa-f]+/, message: 'Invalid value. Value must be hex.'});
```

### isStringOrNull

Makes sure the item is of type string or equal to null, also can check the value against a regular expression.

```javascript
var check = validator.isStringOrNull();
```
or
```javascript
var check = validator.isArray(validator.isStringOrNull({regex: /[0-9A-Fa-f]+/, message: 'Invalid value. Value must be hex.'}));
```

### isNumber

Makes sure the item is a number, also can specify minimum and maximum values.

```javascript
var check = validator.isNumber();
```
or
```javascript
var check = validator.isNumber({min: 0, max: 78});
```

### isInteger

Makes sure the item is a whole number (integer), also can specify minimum and maximum values.

```javascript
var check = validator.isInteger();
```
or
```javascript
var check = validator.isInteger({min: 0, max: 78});
```

### isDate

Checks for a `Date` object or a string that is moment.js can parse.

```javascript
var check = validator.isDate();
```

Optionally, the moment.js format can be passed through to specify a particular format

```javascript
var check = validator.isDate();
```
or
```javascript
var check = validator.isDate({format: 'LT'});
```

### isIsoDate

A shortcut for `validator.isDate({format: 'YYYY-MM-DD'})`

### isArray

Makes sure that the item is of type array, and validates the items. Also can specify minimum and maximum length of the array.

```javascript
var check = validator.isArray(validator.isDate());
```
or
```javascript
var check = validator.isArray(validator.isDate(), {min: 3});
```

## Your Own Validators

You may use your own validators. All that is required is a function that meets the below requirements.

```javascript
function myValidator(value, onError) {
  ...
}
```

Where `value` is the item under test, and `onError` is a function to call with any validation errors. It has the signature:

```javascript
function onError(message,propertyName,propertyValue) {
  ...
}
```

Example: to make sure that there can not be both properties `foo` and `bar`

```javascript
function validateFooXorBar(value, onError) {
  if (value.foo !== undefined && value.bar !== undefined) {
    onError('both foo and bar may not be defined', 'foo|bar', null);
  }
}
```

## License

(The MIT License)

Copyright (c) 2013

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.