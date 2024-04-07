const express = require('express')
const path = require('path')
const session = require('express-session')

const app = express()

const PORT = process.env.PORT || 3000

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs') //use hbs handlebars wrapper
app.locals.pretty = true //to generate pretty view-source code in browser

//read routes modules
const routes = require('./routes/routes')

//middleware
app.use(express.json())//used to parse html post form
app.use(express.urlencoded({extended: true}))//used to parse html post form
app.use(express.static(path.join(__dirname, '/public')))//for js scripts and css


const checkAuth = function(request, response, next){//middleware used to check if the user has an established session
    if (request.session.userId) {
        next() //user has a session established, continue with next middleware
    }
	else {
        response.redirect('/index.html/?status=fail')//redirect user to the login page
    }
}

const checkRole = function(request, response, next){//middleware used to check if the user is an admin
	if(request.session.userRole){
		next()
	}
	else{
		response.redirect('/dashboard')//redirect user to the dashboard
	}
}

app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: true,
	cookie:{maxAge:3600000}//1 hour in milliseconds
}))

//routes
app.post('/login', routes.login)
app.post('/register',routes.register)
app.get(['/','/index.html'], routes.index)
app.get('/dashboard', checkAuth, routes.dashboard)
app.get('/users', checkAuth, checkRole, routes.users)
app.get('/game/*', checkAuth, routes.gameDetails)
app.get('/searchGame', checkAuth, routes.searchGame)
app.get('/deleteGame', checkAuth, routes.deleteGame)

app.get('/addGame', checkAuth, routes.addGame)

app.get('/logout', (request, response) =>{
	request.session.destroy(()=>{
		console.log("delete session")
		response.redirect('/index.html/?status=logout')
	})
	
})

//start server
app.listen(PORT, err => {
  if(err) console.log(err)
  else {
		console.log(`Server listening on port: ${PORT} CNTL:-C to stop`)
		console.log(`To Test:`)
		console.log('user: admin password: password')
		console.log('http://localhost:3000/')
		console.log('http://localhost:3000/index.html')
	}
})
