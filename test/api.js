
exports.echo = function(value, fn){
  fn(null, value);
};

exports.add = function(a, b, fn){
  fn(null, a + b);
};

exports.double = function(value, fn){
  fn(null, value * 2);
};

exports.ping = function(fn){
  fn(null, 'pong');
};

exports.uppercase = function(str, fn){
  fn(null, str.toUpperCase());
};

exports.error = function(fn){
  fn(new Error('boom'));
};