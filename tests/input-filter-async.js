#!/usr/bin/env node

var _ = require('underscore');

module.exports = {
    setUp: function (callback) {
        this.inputFilter = require('../input-filter-async');
        callback();
    },
    exceptionIfConstructorWasNotCalled: function (test) {
        try {
            this.inputFilter({});
            test.ok(false);
        } catch (err) {
            test.ok(true);
        }

        test.done();
    },
    emptyValuesBeforeProcessing: function (test) {
        var inputFilter = new this.inputFilter({});
        var actual = inputFilter.getValues();
        var expected = {};

        test.deepEqual(actual, expected);

        test.done();
    },
    expectedValuesAfterProcessing: function (test) {
        var rules = {name: {}, age: {}};
        var data = {name: 'dV', age: 29};

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function () {
            var actual = this.getValues();
            var expected = data;

            test.deepEqual(actual, expected);

            test.done();
        });
    },
    emptyErrorsBeforeProcessing: function (test) {
        var inputFilter = new this.inputFilter({});
        var actual = inputFilter.getErrors();
        var expected = {};

        test.deepEqual(actual, expected);

        test.done();
    },
    testGetValue: function (test) {
        var rules = {name: {}, age: {}};
        var data = {name: 'dV', age: 29};

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function (is) {
            var actual = this.getValue('name');
            var expected = 'dV';
            test.strictEqual(actual, expected);

            test.done();
        });
    },
    testGetValues: function (test) {
        var rules = {name: {}, age: {}};
        var data = {name: 'dV', age: 29};

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function (is) {
            var actual = this.getValues();
            var expected = data;
            test.deepEqual(actual, expected);

            test.done();
        });
    },
    testGetErrors: function (test) {
        var rules = {name: {required: true}, age: {required: true}};
        var data = {};

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function (is) {
            var actual = _.keys(this.getErrors());
            var expected = ['name', 'age'];
            test.deepEqual(actual, expected);

            test.done();
        });
    },
    valuesAreRequired: function (test) {
        var rules = {
            age: {
                required: false,
            },
            name: {
                required: true,
            },
            nickname: {
            },
        };

        var data = {};

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function (is) {
            test.strictEqual(is, false);

            var actual = _.keys(this.getErrors());
            var expected = ['name'];
            test.deepEqual(actual, expected);

            test.done();
        });
    },
    valuesArePreFiltered: function (test) {
        var rules = {
            age: {
                preFilters: [
                    'trim',
                    'toInt',
                ],
            },
            name: {
                preFilters: [
                    'trim',
                    function (value) {
                        return 'dV' == value ? 'DV' : value;
                    },
                ],
            },
        };

        var data = {
            name: ' dV ',
            age: ' 29 ',
        };

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function (is) {
            var actual = inputFilter.getValues();
            var expected = {
                name: 'DV',
                age: 29,
            };
            test.deepEqual(actual, expected);

            test.done();
        });
    },
    valuesAreValidatedSuccess: function (test) {
        var rules = {
            age: {
                validators: [
                    'isInt',
                ],
            },
            name: {
                validators: [
                    'isUppercase',
                ],
            },
        };

        var data = {
            name: 'DV',
            age: 29,
        };

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function (is) {
            test.strictEqual(is, true);

            test.done();
        });
    },
    valuesAreValidatedFail: function (test) {
        var rules = {
            age: {
                validators: [
                    'isInt',
                ],
            },
            name: {
                validators: [
                    'isUppercase',
                ],
            },
        };

        var data = {
            name: 'DV',
            age: 'DV',
        };

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function (is) {
            test.strictEqual(is, false);

            test.done();
        });
    },
    valuesArePostFiltered: function (test) {
        var rules = {
            age: {
                postFilters: [
                    'toInt',
                ],
            },
            name: {
                postFilters: [
                    'trim',
                    function (value) {
                        return 'dV' == value ? 'DV' : value;
                    },
                ],
            },
        };

        var data = {
            name: ' dV ',
            age: '29',
        };

        var inputFilter = new this.inputFilter(rules);
        inputFilter.isValid(data, function (is) {
            var actual = inputFilter.getValues();
            var expected = {
                name: 'DV',
                age: 29,
            };
            test.deepEqual(actual, expected);

            test.done();
        });
    },
};
