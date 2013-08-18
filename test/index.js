
/**
 * Module dependencies.
 */

var rpc = require('..')
  , axon = require('axon')
  , assert = require('better-assert');

var rep = axon.socket('rep');
var req = axon.socket('req');

rep.bind(4000);
req.connect(4000);

var server = new rpc.Server(rep);
var client = new rpc.Client(req);

var ctx = {};

describe('Server#expose(name, fn)', function(){
  it('should expose a single function', function(done){
    server.expose('add', function(a, b, fn){
      fn(null, a + b);
    });

    client.call('add', 1, 2, function(err, n){
      assert(!err);
      assert(3 === n);
      done();
    });
  })
})

describe('Server#expose(obj)', function(){
  it('should expose multiple', function(done){
    server.expose({
      uppercase: function(str, fn){
        fn(null, str.toUpperCase());
      }
    });

    client.call('uppercase', 'hello', function(err, str){
      assert(!err);
      assert('HELLO' == str);
      done();
    });
  })
})

describe('Client#methods(fn)', function(){
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
  })
})

describe('Client#call(name, ..., fn)', function(){
  describe('when method is not exposed', function(){
    it('should error', function(done){
      client.call('something', function(err){
        assert('method "something" does not exist' == err.message);
        done();
      });
    })
  })

  describe('with an error response', function(){
    it('should provide an Error', function(done){
      server.expose('error', function(fn){
        fn(new Error('boom'));
      });

      client.call('error', function(err){
        assert(err instanceof Error);
        assert('boom' == err.message);
        done();
      });
    })
  })
})

describe('Client#bind(ctx, methods)', function(){
  it('should bind methods in context', function(done){
    client.methods(function(err, methods){
      client.bind(ctx, methods);
      assert('add' in ctx);
      assert('uppercase' in ctx);
      assert('error' in ctx);
      done();
    });
  })

  it('should be callable', function(done){
    ctx.add(1, 2, function(err, n){
      assert(!err);
      assert(3 === n);
      ctx.uppercase('hello', function(err, str){
        assert(!err);
        assert('HELLO' == str);
        done();
      });
    });
  })
})