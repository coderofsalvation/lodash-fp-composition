keep the darkside away: practical functional mixins for **lodash/fp** to make code more readable, maintainable & composable

<center><img src='https://media1.giphy.com/media/VZovxx7W7tbu8/giphy.gif' width="50%"/></center>

> Warning: Experimental

## How does this library makes my code look?
 
```
var hasPassword       = _.get('password')
var hasNoPassword     = _.negate( hasPassword )
var getUser           = opts => db.find({email:opts.email, password:opts.password})
var gotoCatch         = err => e => throw e // optionally you can log stuff here
var doAnalytics       = Promise.all([logUser, logAnalytics])
var notifyExpiryDate  = opts => return true         // mock
var userAlmostExpired = opts => return true         // mock
var updateLastLogin = _.set('lastlogin', Date.now )
var error             = (opts, err)  => return true // mock 
var reply             = opts => req.send(opts)

var createUser        = opts => new Promise( (resolve, reject) => {
                           opts.password = '1234'
                           db.create(opts)
                           .then( resolve )
                           .catch( resolve )
                        })


var loginUser         = _.flow() // create empty flow
                         .then( error('no email') ).when( hasNoEmail    )
                         .then( getUser           ).when( hasPassword   )
                         .then( createUser        ).when( hasNoPassword )
                         .then( doAnalytics       ).fork()
                         .then( updateLastLogin   )
                         .then( notifyExpiryDate  ).when( userAlmostExpired ).fork()
                         .then( saveUser          )
                         .then( doAnalytics       ).fork()
                         .then( reply )
                         .catch( error )
```

> NOTE: `fork()` doesn't wait for the execution of that line. Its execution happens parallel, will never never break the flow (=desired)

Summary:

* looks easy
* easy to maintain
* no if/else-clutter
* no early returns (pipeline certainty)
* immutable

## Because you don't want this

```
var doAnalytics       = Promise.all([logUser, logAnalytics])
var getUser           = db.find({email:opts.email, password:opts.password})
var notifyExpiryDate  = opts => return true         // mock
var userAlmostExpired = opts => return true         // mock
var reply             = opts => req.send(opts)

var createUser        = opts => new Promise( (resolve, reject) => {
                          opts.password = '1234'
                          db.create(opts)
                          .then( resolve )
                          .catch( resolve )
                        })

var loginUser = (opts) => new Promise( (resolve, reject) => {
  if( !opts.email ){ 
    // log stuff here
    return req.send({err:"no email"})
  }
  var user
  var getOrCreateUser
  if( opts.password ){ 
    getOrCreateUser = getUser
  }else{
    getOrCreateUser = createUser
  }
  getOrCreateUser(opts)
  .then( (u) => {
    user = u
    doAnalytics.then( () => false ).catch( () => false ) // ugly parallel code
  })
  .then( () => {
    user.lastlogin = Date.now()
    // PROBLEM: user is now modified..so code below will process an updated userobject 
  })
  .then( () => {
    if( userAlmostExpired(user) ){  // will not work because of previous problem
      notifyExpiryDate(user)        // even if it would work..
                                    // this could throw an exception
                                    // an skip code execution below
    }
  })
  .then( () => {
    doAnalytics.then( () => false ).catch( () => false ) // ugly parallel code
  })
  .then( () => saveUser(user) )
  .then( () => reply(user) )
  .catch( err => {
    if( !user ) user = opts 
    reply({ err, ...user})  
  })  

})
```

Issues: 

* early returns 
* needs temporary variables
* mutability issues
* if/else-clutter
* unexpected halting of .then()-pipelines


## Philosophy

1. functional programming in javascript has 2 categories: the good stuff..and there's the other stuff :)
2. `_.flow` (=reversed compose) is great, and reduces the amount of temporary variables 
3. Promises are great building blocks for async flow-control (and can be extended)
4. mixing functions & promises should be hasslefree (lodash + promise = not hasslefree)
5. accept javascript, therefore accept and expect mutable objects

| Usage | what this lib does | comment |
|-|-|-|
| `_.flow(... , ...)` | adds support for automic promise-resolving | without arguments, it creates an extended promise |
| `_.flow().then( [Function] )`           | **always** forwards processed input to next function | reduces if/else statements |
| `_.flow().then( [Function] ).fork()` | **dont wait** for the output, just forward unprocessed input to next function | immutable data FTW |
| `_.flow().then( ... ).when( isValid )` | **always** forwards input, but processes if isValid({..}) is true | prevents need of inline promise-code and early returns |

> NOTE: optionally you can define your own clonefunction like `.fork(_.cloneDeep)` e.g. 

<img src="https://cdn.shopify.com/s/files/1/0257/1675/t/147/assets/banner_ive-joined.gif?12750917494953216175"/>

## Usage 

| type | how |
|-|-|
| nodejs with lodash | `var _                 = require('lodash/fp')`
| | `_.mixin( require('lodash-fp-composition')` |
| nodejs without lodash | `var _ = require('lodash-fp-composition')` |
| browser without lodash | `<script src='https://unpkg.com/lodash-fp-composition'></script>`|
|                        | `<script>flow(...)</script>
| browser with lodash     | `<script src='https://unpkg.com/lodash'></script>`|
|                        | `<script src='https://unpkg.com/lodash-fp-composition'></script>`|
|                        | `<script>_.flow(...)</script>` |

---

# Function Reference

## _.flow( promise_or_function, ... )
 
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
 
 
