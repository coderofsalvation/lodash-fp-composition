'use strict';
// NOTE: following are all curried functions

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
var flow
var internalCompose = function (args) {            
	var f 
	f = function (initialValue) {              
		var chain = compose.Promise || Promise.resolve(initialValue)        
		var i, j                                   
		var me = this
		for (i = 0, j = f.args.length; i < j; i++){
			chain = chain.then( f.args[i].then ? function(p){ return p }.bind(null,f.args[i]) : f.args[i] )
		}
		if( f.catch ){
		  f.catch(initialValue)
		  chain.catch( f.catch )
		}
		return chain
	}
	f.args = Array.prototype.slice.call(args)
	f.then = function(){
		var args = Array.prototype.slice.call(arguments)
		args.map( function(c){
			f.args.push( trigger(c) )
		})
		return f
	}
	f.when = function(condition ){
		var last = f.args[ f.args.length-1 ]
		f.args[ f.args.length-1] = function(input){
			return condition(input) ? last(input) : input 
		}
		return f
	}
	f.fork = function(func){
		var last = f.args[ f.args.length-1 ]
		f.args[ f.args.length-1] = function(input){
			last( func ? func(input) : JSON.parse( JSON.stringify(input) )  )
			return input 
		}
		return f
	}
	f.catch = function(efn){ f.catch = efn; return f }
	return f
}

function compose () {
	return internalCompose(arguments)
}
flow = compose

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

var lodash_fp_composition = {
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

var nodejs = (typeof module !== 'undefined' && typeof module.exports !== 'undefined')

if( nodejs ){
	// standalone
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
}else{
	if( window._ ) _.mixin(lodash_fp_composition)
	else for ( var i in lodash_fp_composition  ) window[i] = lodash_fp_composition[i]
}
