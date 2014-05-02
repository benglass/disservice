var Disservice = require('../src/disservice.js');
var assert = require('assert');

describe('Disservice', function() {

    describe('#setParameter()', function() {

        it('should add a parameter to the container', function() {
            var di = new Disservice();
            di.setParameter('foo', 'bar');
            assert.equal('bar', di.getParameter('foo'));
        });

        it('should add a lazy parameter to the container', function() {
            var di = new Disservice();
            di.setParameter('foo', 'bar');
            di.setParameter('biz', function() {
                return this.getParameter('foo') + 'biz';
            });
            assert.equal('barbiz', di.getParameter('biz'));
        });

    });

    describe('#add()', function() {

        it('should add a service to the container', function() {
            var di = new Disservice();
            di.add('adder', function() {
                return function(a, b) {
                    return a + b;
                };
            });
            var adder = di.get('adder');
            assert.equal(3, adder(1, 2));
        });

    });

    describe('#inject()', function() {

        it('should inject a service into a function', function() {
            var di = new Disservice();
            di.add('adder', function() {
                return function(a, b) {
                    return a + b;
                };
            });
            var myFunc = function(adder) {
                return adder(5, 4);
            };
            assert.equal(9, di.inject(myFunc));
        });

        it('should inject a parameter into a function', function() {
            var di = new Disservice();
            di.setParameter('fizz', 'buzz');
            var myFunc = function(fizz) {
                return fizz+' from param';
            };
            assert.equal('buzz from param', di.inject(myFunc));
        });

        it('should inject a defaults into a function', function() {
            var di = new Disservice();
            var myFunc = function(fizz) {
                return fizz+' from param';
            };
            assert.equal('default buzz from param', di.inject(myFunc, {
                fizz: 'default buzz'
            }));
        });

    });

});
