
/**
 * Module dependencies.
 */

var rpc = require('..')
  , axon = require('axon')
  , assert = require('better-assert');

var rep = axon.socket('rep');
var req = axon.socket('req');

rep.bind(4001);
req.connect(4001);

var client = new rpc.Client(req);
var server = new rpc.Server(rep);
server.expose(require('./api'));

describe('Client', function(){
  describe('.methods(fn)', function(){
    it('should respond with available methods', function(done){
      client.methods(function(err, methods){
        assert(!err);
        assert('add' == methods.add.name);
        assert('a' == methods.add.params[0]);
        assert('b' == methods.add.params[1]);
        assert('fn' == methods.add.params[2]);
        assert(methods.uppercase);
        done();
      });
    });
  });

  describe('.call(name, ..., fn)', function(){
    describe('when method is not exposed', function(){
      it('should error', function(done){
        client.call('something', function(err){
          assert('method "something" does not exist' == err.message);
          done();
        });
      });
    });

    describe('with an error response', function(){
      it('should provide an Error', function(done){
        client.call('error', function(err){
          assert(err instanceof Error);
          assert('boom' == err.message);
          done();
        });
      });
    });
  });
});