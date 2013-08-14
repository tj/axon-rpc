
/**
 * Module dependencies.
 */

var debug = require('debug');

/**
 * Expose `Server`.
 */

module.exports = Server;

/**
 * Initialize a server with the given `sock`.
 *
 * @param {Socket} sock
 * @api public
 */

function Server(sock) {
  sock.format('json');
  this.sock = sock;
  this.methods = {};
  this.sock.on('message', this.onmessage.bind(this));
}

/**
 * Return method descriptions with:
 *
 *  `.name` string
 *  `.params` array
 *
 * @return {Object}
 * @api private
 */

Server.prototype.methodDescriptions = function(){
  var obj = {};

  for (var name in this.methods) {
    var ns = getNamespace(this.methods[name]);
    obj[name] = getNamespace(this.methods[name],true);
  }

  return obj;
};

/**
 * Response with the method descriptions.
 *
 * @param {Function} fn
 * @api private
 */

Server.prototype.respondWithMethods = function(reply){
  reply({ methods: this.methodDescriptions() });
};

/**
 * Handle `msg`.
 *
 * @param {Object} msg
 * @param {Object} fn
 * @api private
 */

Server.prototype.onmessage = function(msg, reply){
  if ('methods' == msg.type) return this.respondWithMethods(reply);

  // .method
  var meth = msg.method;
  if (!meth) return reply({ error: '.method required' });

  // Check for namespacing
  var ns = meth.split('.');
  if (ns.length > 1){
    var fn = this.methods;
    ns.forEach(function(attr){
      fn = fn[attr];
    });
  } else {
    var fn = this.methods[meth];
  }

  // ensure .method is exposed
  if (!fn) return reply({ error: 'method "' + meth + '" does not exist' });

  // .args
  var args = msg.args;
  if (!args) return reply({ error: '.args required' });

  // invoke
  args.push(function(err){
    if (err) return reply({ error: err.message });
    var args = [].slice.call(arguments, 1);
    reply({ args: args });
  });

  fn.apply(null, args);
};

/**
 * Get the namespace tree.
 *
 * @param {Object} obj
 * @param {Object} parms
 * @api private
 */
var getNamespace = function(obj,parms) {
  parms = parms == undefined ? false : parms;
  switch (typeof obj){
    case 'function':
      return obj;
    case 'object':
      var out = {};
      for (var ns in obj){
        out[ns] = typeof obj[ns] == 'function' ? (parms == true ? {name: ns, params:params(obj[ns])} : obj[ns]) : getNamespace(obj[ns],parms);
      }
      return out;
    default:
      throw 'Function attribute provided to expose() is invalid.';
  }
};

/**
 * Expose many or a single method.
 *
 * @param {String|Object} name
 * @param {String|Object} fn
 * @api public
 */

Server.prototype.expose = function(name, fn){
  if (1 == arguments.length) {
    for (var key in name) {
      this.expose(key, name[key]);
    }
  } else {
    debug('expose "%s"', name);
    this.methods[name] = getNamespace(fn);
  }
};

/**
 * Retrieve a method
 *
 * @param {Object} obj
 * @api private
 */
var getMethod = function(obj) {
  if (typeof obj == 'function'){
    return obj;
  }
  var ns = obj;
  while (typeof ns == 'object'){
    ns = ns[Object.keys(ns)[0]];
  }
  return ns;
};

/**
 * Parse params.
 *
 * @param {Function} fn
 * @return {Array}
 * @api private
 */

function params(fn) {
  var ret = getMethod(fn).toString().match(/^function *(\w*)\((.*?)\)/)[2];
  if (ret) return ret.split(/ *, */);
  return [];
}
