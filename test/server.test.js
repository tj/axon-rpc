
/**
 * Module dependencies.
 */

var rpc = require('..')
  , api = require('./api')
  , axon = require('axon')
  , assert = require('better-assert');

var rep = axon.socket('rep');
var req = axon.socket('req');

rep.bind(4000);
req.connect(4000);

var server = new rpc.Server(rep);
var client = new rpc.Client(req);

describe('Server', function(){
  describe('.expose(name, fn)', function(){
    it('should expose a single function', function(done){
      server.expose('add', api.add);

      client.call('add', 1, 2, function(err, n){
        assert(!err);
        assert(3 === n);
        done();
      });
    });
  });

  describe('.expose(obj)', function(){
    it('should expose multiple', function(done){
      server.expose(api);

      client.call('uppercase', 'hello', function(err, str){
        assert(!err);
        assert('HELLO' == str);
        done();
      });
    });
  });
});