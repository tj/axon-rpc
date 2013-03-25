
/**
 * Module dependencies.
 */

var rpc = require('..')
  , api = require('./api')
  , axon = require('axon')
  , assert = require('better-assert');

var rep = axon.socket('rep');
var req = axon.socket('req');

rep.bind(4002);
req.connect(4002);

var client = new rpc.Client(req);
var server = new rpc.Server(rep);
server.expose(api);

describe('Hooks', function(){
  describe('.before(fn)', function(){
    it('should perform the hook always', function(done){
      var n = 0;

      server.before(hook);

      client.call('ping', function(err){
        assert(!err);
        client.call('echo', 'hai', function(err){
          assert(!err);
          assert(2 == n);
          done();
        });
      });

      function hook(msg, next){
        ++n;
        next();
      }
    });
  });

  describe('.before(name, fn)', function(){
    it('should perform the named hooks', function(done){
      var n = 0;

      server.before('ping', hook);
      server.before('echo', hook);

      client.call('ping', function(err){
        assert(!err);
        assert(1 == n);
        client.call('echo', 'hai', function(err){
          assert(!err);
          assert(2 === n);
          done();
        });
      });

      function hook(msg, next){
        ++n;
        next();
      }
    });

    it('should perform the named and wildcard hooks', function(done){
      var n = 0;

      server.before(hook);
      server.before('add', hook);
      server.before('double', hook);

      client.call('double', 2, function(err){
        assert(!err);
        assert(2 == n);
        client.call('add', 1, 1, function(err){
          assert(!err);
          assert(4 === n);
          done();
        });
      });

      function hook(msg, next){
        ++n;
        next();
      }
    });
  });

  describe('.after(fn)', function(){
    it('should perform the hook always', function(done){
      var n = 0;

      server.after(hook);

      client.call('echo', 'ok', function(err){
        assert(!err);
        client.call('ping', function(err){
          assert(!err);
          assert(n == 2);
          done();
        });
      });

      function hook(msg, next){
        ++n;
        next();
      }
    });
  });

  describe('.after(name, fn)', function(){
    it('should only perform the named hooks', function(done){
      var n = 0;

      server.after('echo', hook);

      client.call('echo', 'ok', function(err){
        assert(!err);
        client.call('ping', function(err){
          assert(!err);
          assert(1 == n);
          done();
        });
      });

      function hook(msg, next){
        ++n;
        next();
      }
    });

    it('should only perform the named amd wildcard hooks', function(done){
      var n = 0;

      server.after(hook);
      server.after('add', hook);
      server.after('double', hook);

      client.call('add', 1, 1, function(err){
        assert(!err);
        assert(2 == n);
        client.call('double', 2, function(err){
          assert(!err);
          assert(4 == n);
          done();
        });
      });

      function hook(msg, next){
        ++n;
        next();
      }
    });
  });

});