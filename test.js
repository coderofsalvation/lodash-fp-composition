var _ = require('lodash/fp') 
_.mixin( require('./') )

function test(opts){
	this.node   = typeof process != undefined
	this.tests  = this.tests || []
	this.errors = 0 
	this.error  = (msg) => { this.errors += 1; console.error("> error: "+msg) }
	this.add    = (description, cb) => this.tests.push({ description, cb }) 
	this.done   = () => { console.log("\n> tests : "+this.tests.length+"\n> errors: "+this.errors); process.exit( this.errors == 0 ? 0 : 1 ) }
	this.run    = () => {
		var p = Promise.resolve()
		var runTest = (i) => {
			return new Promise( (resolve, reject) => {
				var test = this.tests[i]
				if( !test ) return this.done()
				var printf  = this.node ? process.stdout.write.bind(process.stdout) : console.log 
				if( this.node ) printf("[ ] "+test.description+"\r")
				var onError = (err) => { this.error(err); this.done() }
				var _next   = () => { printf("[✓] "+test.description+"\n"); p.then(runTest(i+1)) }
				try { test.cb(_next, onError ) } catch (e) { onError(e) }
			})
		}
		p.then( runTest(0) )
	}
}

var t = new test()

t.add("testing _.flow && _.trigger",  function(next, error){
	var checkOk = (input) => {
		if( input.user.name !== "John" ) return error("incorrect output of promise")
		next()
	}
	var getFakeUser = function(email){
		return new Promise( (resolve, reject) => resolve({user:{email, name:"John"}}) )
	}
	var a = _.flow( 
		_.trigger( function(){} ), 
		new Promise( (resolve, reject) => resolve("john@gmail.com") ), 
		getFakeUser, 
		_.trigger( function(){} ), 
		checkOk
	)
	a({foo:"bar"})
})
t.add("testing _.flow exception",  function(next, error){
	var onError = input => err => {
		if( err != 'an error' ) return error("did not catch exception")
		next()
	}
	var a = _.flow( 
		function(){ throw 'an error' }, 
		new Promise( (resolve, reject) => reject("reject!") )
	).catch(onError)

	a({foo:"bar"})
})

t.add("testing _.flow promise rejects",  function(next, error){
	var onError = input => err => {
		if( err != 'reject!' ) return error("did not catch exception")
		next()
	}
	var a = _.flow( 
		new Promise( (resolve, reject) => reject("reject!") ), 
		function(){ throw 'an error' }
	).catch(onError)

	a({foo:"bar"})
})

t.add("testing empty _.flow && _.trigger && _.when",  function(next, error){
	var input     = {a:1, b:1}
	var equal     = (prop, val ) => input => input[prop] == val
	var increment = (prop, val ) => input => input[prop] += val

	var superfunc = _.flow() // create empty flow
					 .then( increment('a',2) ).when( equal('a', 1) )
					 .then( increment('b',2) ).when( equal('a', 3) ).fork()
					 .then( increment('a',2) )
			 		 .catch( error )
	superfunc(input)
	.then( (i) => i.a == 5 && i.b == 1 ? next() : error(JSON.stringify(i)) )
	.catch(console.error) 
})

t.run()
