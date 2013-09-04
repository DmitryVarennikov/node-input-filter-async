Asynchronous input filter
=======================

[![Build Status](https://api.travis-ci.org/dVaffection/node-input-filter-async.png)](https://travis-ci.org/dVaffection/node-input-filter-async)

A high-level library for filtering (sanitization) and validating input data

## Installation

     npm install input-filter-async

## Usage

#### Basic usage
**NOTE:** 

* if `required: true` is NOT specified, value is considered **optional** 
* value is **pre filtered** regardless whether it's *mandatory* or *optional*, if value is not given `null` is placed instead
* if value is **optional but given** then it's **validated**
* finally if value **passed validation** then it's **post filtered**

> Basic validation and sanitization is build upon [node-validator](https://github.com/chriso/node-validator) library by **Chris O'Hara**

```javascript
var InputFilter = require('input-filter-async');
var rules = {
    'name': {
        'required': true,
        'preFilters': [
            'trim',
        ],
    },
    'age': {
        'required': false,  // also FALSE if absent
        'preFilters': [
            'trim',
        ],
        'validators': [
            'isInt',
        ],
        'postFilters': [
            'toInt',
        ],
    },
};
var data = {
    name: " dV ",
    age: ' 29 ',
};

var inputFilter = new InputFilter(rules);
inputFilter.isValid(data, function(isValid) {
    if (isValid) {
        console.log(this.getValues());      // { name: 'dV', age: 29 }
        console.log(this.getValue('age'));  // 29
    } else {
        console.log(this.getErrors());
        /*
        {
            name: 'Value is required and can't be empty',
            age: 'Invalid integer'
        }
         */
    }
});
```

#### Writing you own filters and validators.
**NOTE:** 

* filters work in **synchronous** way while validators are expected to be **asynchronous**

```javascript
var _ = require('underscore');
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
    if (err)
        throw err;

    var usersCol = db.collection('users');
    var InputFilter = require('input-filter-async');
    var rules = {
        name: {
            required: true,
            preFilters: [
                'trim',
                function(value) {
                    if (_.isString(value)) {
                        value = value.toLowerCase();
                    }

                    return value;
                },
            ],
            validators: [
                function(value, params, callback) {
                    // params — passed data

                    var query = {name: value};
                    usersCol.findOne(query, function(err, doc) {
                        if (err)
                            throw err;

                        if (doc) {
                            var message = 'User "' + value + '" already exists';
                            callback(message);
                        } else {
                            callback(null);
                        }
                    });
                },
            ],
        },
    };
    var data = {
        name: " JOHN SMITH ",
    };

    var inputFilter = new InputFilter(rules);
    inputFilter.isValid(data, function(isValid) {
        if (isValid) {
            // { name: 'john smith' }
            console.log(this.getValues());
        } else {
            // { name: 'User "john smith" already exists' }
            console.log(this.getErrors());
        }
    });
});

```