var async = require('async');
var _ = require('underscore');
var check = require('validator').check,
    sanitize = require('validator').sanitize;

function inputFilter(rules) {
    "use strict";

    if (! (this instanceof inputFilter)) {
        throw new Error('Constructor called as a function');
    }

    var values = {},
        errors = {};

    this.isValid = function (data, callback) {

        var tasks = {};
        _.each(rules, function (handlers, name) {
            // convert element description into asynchronous task
            tasks[name] = function (next) {

                if (_.has(data, name)) {
                    values[name] = data[name];
                } else {
                    values[name] = null;
                }

                // by default value is optional
                if (! _.has(handlers, 'required')) {
                    handlers.required = false;
                }

                // ------------- READY, STEADY...

                function preFilter() {
                    // first pre-filter value
                    if (handlers.preFilters) {
                        _.each(handlers.preFilters, function (filter) {
                            if (typeof filter === 'function') {
                                values[name] = filter(values[name]);
                            } else {
                                values[name] = sanitize(
                                    values[name])[filter]();
                            }
                        });
                    }
                }


                function validate(callback) {
                    var asyncValidators = [];

                    if (handlers.validators) {
                        _.each(handlers.validators, function (validator) {
                            var asyncValidator;
                            if (typeof validator === 'function') {
                                asyncValidator = function (callback) {
                                    validator(values[name], data, function (error) {
                                        if (error) {
                                            errors[name] = error;
                                            callback(error);
                                        } else {
                                            callback();
                                        }
                                    });
                                };
                            } else {
                                asyncValidator = function (callback) {
                                    try {
                                        check(values[name])[validator]();
                                        callback();
                                    } catch (e) {
                                        errors[name] = e.message;
                                        callback(e.message);
                                    }
                                };
                            }

                            asyncValidators.push(asyncValidator);
                        });
                    }

                    // execute validators one after another
                    async.series(asyncValidators, function () {
                        callback();
                    });
                }

                function postFilter() {
                    // post-filter those values which passed validation
                    if (handlers.postFilters && ! (name in errors)) {
                        _.each(handlers.postFilters, function (filter) {
                            if (typeof filter === 'function') {
                                values[name] = filter(values[name]);
                            } else {
                                values[name] = sanitize(
                                    values[name])[filter]();
                            }
                        });
                    }
                }

                // ------------- GO!!!

                // pre-filter value in any case
                preFilter();


                // always validate and post-filter value if it's given
                // otherwise process only in case it's required
                if (! _.isEmpty(values[name])) {
                    // validation is asynchronous
                    validate(function () {
                        postFilter();
                        // go to the next element
                        next();
                    });
                } else {
                    if (handlers.required) {
                        errors[name] = "Value is required and can't be empty";
                    }
                    // go to the next element
                    next();
                }
            };
        });


        var inputFilter = this;
        // go through asynchronous tasks simultaneously
        // (in other words, let's validate incoming data in parallel)
        async.parallel(tasks, function (err) {
            // smth unexpected happened, validation errors must be in "errors" var
            if (err) {
                if (! err instanceof Error) {
                    err = new Error(err);
                }
                throw err;
            }

            if (! _.isFunction(callback)) {
                var message = 'Input filter is asynchronous. Callback function is required';
                throw new Error(message);
            }
            callback.call(inputFilter, _.isEmpty(errors));
        });
    }

    this.getValue = function (name) {
        return values[name];
    }

    this.getValues = function () {
        return values;
    }

    this.getErrors = function () {
        return errors;
    }
}

module.exports = inputFilter;
