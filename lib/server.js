
/**
 * Module dependencies.
 */

var debug = require('debug')('axon-rpc:server');

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
  this.hooks = {};
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
  var fn;

  for (var name in this.methods) {
    fn = this.methods[name];
    obj[name] = {
      name: name,
      params: params(fn)
    };
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
 * TODO: refactor internal validation to use hooks.
 *
 * @param {Object} msg
 * @param {Object} fn
 * @api private
 */

Server.prototype.onmessage = function(msg, reply){
  if ('methods' == msg.type) return this.respondWithMethods(reply);

  // ensure .method
  var meth = msg.method;
  if (!meth) return reply({ error: '.method required' });

  // ensure .method is exposed
  var fn = this.methods[meth];
  if (!fn) return reply({ error: 'method "' + meth + '" does not exist' });

  // ensure .args
  var args = msg.args;
  if (!args) return reply({ error: '.args required' });

  // attach "reply" callback
  var self = this;
  args.push(function(err){
    if (err) return reply({ error: err.message });
    var args = [].slice.call(arguments, 1);
    reply({ args: args });
    self.performHook('after', msg);
  });

  // before hooks
  this.performHook('before', msg, function(err){
    if (err) return reply({ error: err.message });
    fn.apply(null, args);
  });
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
    this.methods[name] = fn;
  }
};

/**
 * Registers a hook `fn` for `type`, optionally filtered by `name`. If
 * no `name` is given, it will match all method calls.
 *
 * @api private
 * @param {String} type
 * @param {String} name
 * @param {Function} fn
 */

Server.prototype.hook = function(type, name, fn){
  if (name == null) name = '.*';
  var re = new RegExp('^' + name + '$');
  this.hooks[type] = this.hooks[type] || [];
  this.hooks[type].push([re, fn]);
  debug('registered %s hook -- %s', type, re);
};

/**
 * Registers a "before" hook.
 *
 * @api public
 * @param {String} name
 * @param {Function} fn
 */

Server.prototype.before = function(name, fn){
  if ('function' == typeof name) fn = name, name = undefined;
  this.hook('before', name, fn);
  return this;
};

/**
 * Registers a "after" hook.
 *
 * @api public
 * @param {String} name
 * @param {Function} fn
 */

Server.prototype.after = function(name, fn){
  if ('function' == typeof name) fn = name, name = undefined;
  this.hook('after', name, fn);
  return this;
};

/**
 * Performs all the `hooks` registered for `type`.
 *
 * @api private
 * @param {String} type
 * @param {Object} msg
 * @param {Function} fn
 */

Server.prototype.performHook = function(type, msg, done){
  done = done || function(){};
  debug('performing %s hooks', type);

  var hooks = this.hooks[type] || [];
  var i = 0;

  function next(err){
    if (err) return done(err);
    var hook = hooks[i++];
    if (!hook) return done();
    if (!hook[0].test(msg.method)) return next();
    hook[1](msg, next);
  }

  next();
};

/**
 * Parse params.
 *
 * @param {Function} fn
 * @return {Array}
 * @api private
 */

function params(fn) {
  var ret = fn.toString().match(/^function *(\w*)\((.*?)\)/)[2];
  if (ret) return ret.split(/ *, */);
  return [];
}
