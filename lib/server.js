
module.exports = Server;

function Server(sock) {
  sock.format('json');
  this.sock = sock;
  this.methods = {};
  this.sock.on('message', this.onmessage.bind(this));
}

Server.prototype.onmessage = function(msg, reply){
  var meth = msg.method;
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
  this.methods[name] = fn;
};
