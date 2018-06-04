'use strict';
var _ = require('lodash')

// NOTE: following are all curried functions

/* _.either(a, b)
 *
 * this will execute function b only when function a returns false/null/undefined
 *
 * example: _.either(getUserByEmail,createUserEmail)("foo@gmail.com")
 */

function either(a,b){
	return function(input){
		return a(input) || b(input)
	}
}

/* _.getno(path)
 *
 * this is the opposite of _.get 
 *
 * example: var a = _.getno( 'foo.bar' )
 *          a({foo:1}) // returns true
 */

function getno(path){
	return function(input){
		return _.get(path,input) == undefined
	}
}

/* _.maybe(fn)
 *
 * this will execute function fn only when there's input.
 * this comes in handy when its unsure whether the previous function was succesful in a chain/flow/composed function.(){}
 *
 * example: _.flow( getOrCreateUser, maybe(_.log("user ok")) )
 */

function maybe(fn){
	return function(input){
		return input ? fn(input) : input
	}
}

/* _.when(f, g)
 *
 * hipster if statement, only execute function g when function f does not return null/false/undefined
 *
 * example: _.when( _.isString, console.log )("foo")
 */

function when(f,g){
	return function(input){
		if( f(v) ) g(v)
	}
}

/* _.flow( mixed_arguments_of_promises_and_functions, ... )
 *
 * improved version of _.flow, which also supports automatic resolving of promises
 *
 * > example: a = _.flow( new Promise(.....), _.trigger(alert), Object.keys )
 * >          a({foo:1, bar:2})
 * 
 * ```
 *   input:{foo:1,bar:2} --->  promise --+--> Object.keys(input) ) 
 *                                       |
 *                                       +--> alert(input)
 *   output:['foo','bar'] 
 * 
 * ```
 */

var compose                                        
var internalCompose = function (args) {            
	var f 
	f = function (initialValue) {              
		var chain = compose.Promise || Promise.resolve(initialValue)        
		var i, j                                   
		var me = this
		for (i = 0, j = args.length; i < j; i++){
			chain = chain.then( args[i].then ? function(p){ return p }.bind(null,args[i]) : args[i] )
		}
		chain.catch( f.catch )
		return chain
	}
	f.catch = function(efn){ f.catch = efn; return f }
	return f
}

function compose () {
	return internalCompose(arguments)
}

/* _.lensOver(path, fn)
 *
 * lens over allows i/o for a nested property
 *
 * example: var updateBar = _.flow( -> 123, _.log )
 * 			_.lensOver( "foo.bar", updateBar )({foo:{bar:0}})  // sets 'foo.bar' to 123 (and prints in console)
 */

function lensOver(key, fn){
	return function (input){
		if( !input ) return
		var new_obj = JSON.parse( JSON.stringify(input) )
		var prop;
		if(_.has(new_obj,key)){//not efficient: a REAL lens can get/set all in one go
			prop = _.get(new_obj,key);
			_.set(new_obj,key,fn(prop));
		}
		return new_obj;
	}
}

/* _.template_es6(es6_template)
 *
 * simple es6 templates for in the browser
 *
 * example: _.template_es6('${foo}', {foo:"bar"})    // outputs 'bar'
 */

function template_es6(es6_template) {
	return function (input){
		data = JSON.parse( JSON.stringify(input) )
		var reg = /\$\{(.*?)\}/g;
		var res;
		while (res = reg.exec(es6_template)) {
			es6_template = es6_template.replace(res[0], eval('data.'+res[1]));
		}
		return es6_template
	}
}

/* _.prefix(prefix, fn)
 *
 * simple way to prefix a function which outputs a string
 *
 * example: _.error = _.prefix("error: ", _.log)
 */
function prefix(prefix, fn){
	return function(input){
		fn( (prefix||'') + input )
		return input
	}
}

/* _.postfix(postfix, fn)
 *
 * simple way to postfix a function which outputs a string
 *
 * example: _.flow( _.get('.length'), _.prefix("items", _.log) )([1, 2, 3])
 */
function postfix(postfix, fn){
	return function(input){
		fn( (prefix||'') + input )
		return input
	}
}

/* _.log(str)
 *
 * simple log function (which forwards input to output)
 *
 * example: _.flow( doFoo, _log, doBar )({input:"foo"})
 */

function log(str){
	return function(input){
		console.log(str)
		return input
	}
}

/* _.error(str)
 *
 * simple error function (which forwards input to output)
 *
 * example: _.when( !hasFoo, _.prefix("something went wrong:", _error ) )({input:"foo"})
 */

function error(msg){
	return prefix("error: ", _log )
}

/*
 * _.trigger(fn)
 *
 * trigger simply executes a function OR promise, but forwards original input as output.
 * this comes in handy when you don't want to break a flow/chain
 *
 * example:	_.flow( _.trigger( alert ), _.trigger(console.dir) )({foo:"bar"})
 *
 */
function trigger(a,b){
	return function(input){
		var fn = b ? lensOver(a,b) : a
		if( fn.then ){
			return compose(fn, new Promise( function(resolve, reject){resolve(input)} ) )
		}else{
			fn(input)
			return input
		}
	}
}

/*
 * _.mapAsync(arr, done, cb)
 *
 * calls cb(data, next) for each element in arr, and continues loop 
 * based on next()-calls (last element propagates done()).
 * Perfect to iterate over an array synchronously,  while performing async
 * operations inbetween the elements.
 *
 * example:	_.mapAsync([1, 2, 3], alert, (data, next) => next() )
 *
 */
function mapAsync(arr, done, cb) {
	if( !arr || arr.length == 0 ) done() 
	var f, funcs, i, k, v;
	funcs = [];
	i = 0;
	for (k in arr) {
	  v = arr[k];
	  f = function(i, v) {
		return function() {
		  var e, error;
		  try {
			if (funcs[i + 1] != null) {
			  return cb(v, i, funcs[i + 1]);
			} else {
			  return cb(v, i, done);
			}
		  } catch (error) {
			e = error;
			return done(new Error(e));
		  }
		};
	  };
	  funcs.push(f(i++, v));
	}
	return funcs[0]()
}

var functions = {
	mapAsync: mapAsync, 
	lensOver:lensOver,
	flow:compose,
	either: either,
	getno:getno, 
	when: when,
	trigger: trigger,
	template_es6: template_es6,
	log: log,
	error: error, 
	prefix:prefix, 
	postfix:postfix
}

_.mixin(functions)

module.exports.flow = compose
module.exports.lensOver = lensOver
module.exports.either = either
module.exports.getno = getno
module.exports.when = when
module.exports.trigger = trigger
module.exports.template_es6 = template_es6
module.exports.log = log
module.exports.error = error
module.exports.mapAsync = mapAsync
module.exports.prefix = prefix
module.exports.postfix = postfix
