
module.exports = Client;

function Client(sock) {
  sock.format('json');
  this.sock = sock;
}

Client.prototype.call = function(name){
  var args = [].slice.call(arguments, 1, -1);
  var fn = arguments[arguments.length - 1];

  this.sock.send({
    type: 'call',
    method: name,
    args: args
  }, function(msg){
    if (msg.error) {
      fn(new Error(msg.error));
    } else {
      msg.args.unshift(null);
      fn.apply(null, msg.args);
    }
  });
};
