
/**
 * Module dependencies.
 */

var debug = require('debug');

module.exports = Server;

function Server(sock) {
  sock.format('json');
  this.sock = sock;
  this.methods = {};
  this.sock.on('message', this.onmessage.bind(this));
}

Server.prototype.onmessage = function(msg, reply){
  var meth = msg.method;
  if (!meth) return reply({ error: '.method required' });

  var fn = this.methods[meth];
  if (!fn) return reply({ error: 'method "' + meth + '" does not exist' });
  var args = msg.args;

  args.push(function(err){
    if (err) return reply({ error: err.message });
    var args = [].slice.call(arguments, 1);
    reply({ args: args });
  });

  fn.apply(null, args);
};


Server.prototype.expose = function(name, fn){
  if (1 == arguments.length) {
    for (var key in name) {
      this.expose(key, name[key]);
    }
  } else {
    debug('expose "%s"', name);
    this.methods[name] = fn;
  }
};
