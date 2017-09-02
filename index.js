import _ from 'lodash'

// NOTE: following are all curried functions

/* _.trigger(fn)
 *
 * trigger simply executes a function, but forwards original input as output.
 * this comes in handy when you don't want to break a flow/chain
 *
 * example:	_.flow( doSomethingWithInput, _.trigger( alert ), doSomethingElseWithInput )({foo:"bar"})
 * 			
 */
function trigger(fn){ 
	return function(input){
		fn(input)
		return input
	}
}

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

/* _.when(f, g)
 *
 * hipster if statement, only execute function g when function f does not return null/false/undefined 
 *
 * example: _.when( _.isString, console.log )("foo")
 */

function when(f,g){
	function(input){
		if( f(v) ) g(v)
	}
}

/* _.flow( mixed_array_of_promises_and_functions )
 *
 * improved version of _.flow, which also supports automatic resolving of promises
 *
 * example: _.flow( new Promise(.....), alert )("foo@gmail.com")
 */

var compose                                        // example: var alertUser = _.flow( 
var internalCompose = function (args) {            //              _.getUserById,      
	var P = compose.Promise || Promise               //              _.pick('user.name'),
	return function (initialValue) {                 //              _.fallback('could not find user'),
		var chain = P.resolve(initialValue)            //              alert      
		var i, j                                       //          )
		for (i = 0, j = args.length; i < j; i++)       //          alertUser('32lk423')  -> will resolve getUserById promise + alert
			chain = chain.then(args[i])

		return chain
	}
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

function lensOver = function(key, fn){
	function (input){
		var new_obj = JSON.parse( JSON.stringify(obj) )
		prop;
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
	function (input){
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
		fn( (prefix||'') + str )
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
		fn( (prefix||'') + str )
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

_.mixin({
	lensOver:lensOver, 
	flow:compose
	either: either, 
	when: when, 
	trigger: trigger, 
	template_es6: template_es6, 
	log: log, 
	error: error
})
