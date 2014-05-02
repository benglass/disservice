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

});
