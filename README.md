keep the darkside away: practical functional mixins for **lodash/fp** to make code more readable, maintainable & composable

<center><img src='https://media1.giphy.com/media/VZovxx7W7tbu8/giphy.gif' width="50%"/></center>

> Warning: Experimental

## Philosophy

1. functional programming in javascript has 2 categories: the good stuff..and there's the other stuff :)
2. `_.flow` (=reversed compose) & `_.trigger` saves us from writing lots of functions & if/else statements 
3. mixing functions & promises should be hasslefree 

<img src="https://cdn.shopify.com/s/files/1/0257/1675/t/147/assets/banner_ive-joined.gif?12750917494953216175"/>

So..what could code look like with this library?

```
engine                   = {}
engine.getOrCreateUser   = _.flow( 
                               _.trigger( console.dir ), 
                               _.either( engine.getUser, engine.createUser ), 
							   _.trigger( 'address.verified', (v) => console.log("verified:"+v) ), 
						       _.trigger( _.set('meta.lastlogin', Date.now ) ),  
                               _.when( _.get('id'),      (dbUser) => console.log("loaded user:"+dbUser.id) ), 
                               _.when( _.getno('id') ), () => throw 'could not load user' )
                           )
						   .catch( console.error )

engine.getOrCreateUser({email:"john@gmail.com"})
.then( (user) => console.dir(user) )
```

Instead of:

```
engine                   = {}
engine.getOrCreateUser   = function(user){
    return new Promise( (resolve, reject) => {
		console.dir(user)
		engine.getUser(user)
		.then( (dbUser) => {
			if( !dbUser ) return engine.createUser(user)
			else return dbUser
		})
		.then( (dbUser) => {
			if( dbUser ){
			  if( dbUser.address && dbUser.address.verified ) console.log("verified:"+v)
			  console.log("user ok") 
			  if( !dbUser.meta ) dbUser.meta = {}
			  dbUser.lastlogin = Date.now()
			  if( dbUser.id ) console.log("loaded user: "+dbUser.id)
			  else throw 'could not load user'
			}
		})
		.catch( console.error )
	})
}

engine.getOrCreateUser({email:"john@gmail.com"})
.then( (user) => console.dir(user) )
```

---

# Function Reference

## _.flow( mixed_arguments_of_promises_and_functions, ... )
 
Improved version of _.flow, which also supports automatic resolving of promises.
Note: modifies output. 
 
> example: a = _.flow( new Promise(.....), _.trigger(alert), Object.keys )
           a({foo:1, bar:2})

```
  input:{foo:1,bar:2} --->  promise --+--> Object.keys(input) ) 
                                      |
                                      +--> alert(input)
  output:['foo','bar'] 

```

## _.trigger(fn)
 
trigger simply executes a function OR promise, but forwards original input as output.
this comes in handy when you don't want to break a flow/chain
 
> example:	_.flow( _.trigger( alert ), _.trigger(console.dir) )({foo:"bar"})
 
## _.either(a, b)
 
this will execute function b only when function a returns false/null/undefined
 
> example: _.either(getUserByEmail,createUserEmail)("foo@gmail.com")
 
## _.getno(path)
 
this is the opposite of _.get 
 
> example: var a = _.getno( 'foo.bar' )
         a({foo:1}) // returns true
 
## _.maybe(fn)
 
this will execute function fn only when there's input.
this comes in handy when its unsure whether the previous function was succesful in a chain/flow/composed function.(){}
 
> example: _.flow( getOrCreateUser, maybe(_.log("user ok")) )
 
## _.when(f, g)
 
hipster if statement, only execute function g when function f does not return null/false/undefined
 
> example: _.when( _.isString, console.log )("foo")
 
## _.lensOver(path, fn)
 
lens over allows i/o for a nested property
 
> example: var updateBar = _.flow( -> 123, _.log )
			_.lensOver( "foo.bar", updateBar )({foo:{bar:0}})  // sets 'foo.bar' to 123 (and prints in console)
 
## _.template_es6(es6_template)
 
simple es6 templates for in the browser
 
> example: _.template_es6('${foo}', {foo:"bar"})    // outputs 'bar'

## _.prefix(prefix, fn)
 
simple way to prefix a function which outputs a string
 
> example: _.error = _.prefix("error: ", _.log)
 
## _.postfix(postfix, fn)
 
simple way to postfix a function which outputs a string
 
> example: _.flow( _.get('.length'), _.prefix("items", _.log) )([1, 2, 3])
 
## _.log(str)
 
simple log function (which forwards input to output)
 
> example: _.flow( doFoo, _log, doBar )({input:"foo"})
 
## _.error(str)
 
simple error function (which forwards input to output)
 
> example: _.when( !hasFoo, _.prefix("something went wrong:", _error ) )({input:"foo"})
 
## _.mapAsync(arr, done, cb)
 
calls cb(data, next) for each element in arr, and continues loop 
based on next()-calls (last element propagates done()).
Perfect to iterate over an array synchronously,  while performing async
operations inbetween the elements.
 
> example:	_.mapAsync([1, 2, 3], alert, (data, next) => next() )
 
 
